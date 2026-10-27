const { config } = require("../config/env");
const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { OrdersModel } = require("../model/OrdersModel");
const { FundsModel } = require("../model/FundsModel");
const { ownerFilter, rawCollection, round2, round4, ObjectId } = require("../utils/owner");
const { HttpError } = require("../utils/httpError");
const { WATCHLIST_SET, ALIASES, normalizeName, toYahooSymbol } = require("../config/symbols");
const { getMarketData } = require("./yahooService");
const { getOrCreateFund, serializeFund } = require("./portfolioService");

/**
 * Order engine.
 *
 * Fixes vs. the original /newOrder:
 *  - The execution price now comes from the server's live quote. The original trusted the `price`
 *    sent by the browser, so anyone could "buy" at Rs 0.01 or "sell" at Rs 1,000,000.
 *  - Input is validated (whole-number quantity, known instrument, BUY/SELL only).
 *  - The balance check and the debit are ONE atomic update (`availableCash >= cost`), so two
 *    simultaneous orders can no longer both pass the check and overdraw the account.
 *  - Holdings/positions are updated with optimistic concurrency, positions now keep a weighted
 *    average (the original left `avg` stale), and any failure rolls back the steps already done.
 *  - SELL releases the *cost basis* from used margin (the original subtracted sale proceeds).
 *
 * MongoDB multi-document transactions would be the textbook answer but need a replica set;
 * compensating rollback works on any deployment (local mongod, Atlas free tier, ...).
 */

const MAX_QTY = 100_000;
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function validateOrder(body) {
  const name = normalizeName(body && body.name);
  if (!name) throw new HttpError(400, "Invalid instrument");

  const mode = typeof body.mode === "string" ? body.mode.trim().toUpperCase() : "";
  if (mode !== "BUY" && mode !== "SELL") throw new HttpError(400, "Mode must be BUY or SELL");

  const rawQty = body.qty;
  const numeric = typeof rawQty === "number" || (typeof rawQty === "string" && rawQty.trim() !== "");
  const qty = numeric ? Number(rawQty) : NaN;
  if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, "Quantity must be a whole number greater than 0");
  if (qty > MAX_QTY) throw new HttpError(400, `Quantity cannot exceed ${MAX_QTY}`);

  return { name, mode, qty };
}

async function executionPrice(name) {
  const symbol = toYahooSymbol(name);
  const quote = symbol ? await getMarketData().getQuote(symbol) : null;
  if (!quote || quote.ageMs > config.market.tradeMaxQuoteAgeMs) {
    throw new HttpError(503, `Live price for ${name} is unavailable right now. Please try again in a moment.`);
  }
  return quote.price;
}

/** Runs the compensating actions in reverse order. Never throws. */
async function rollback(undo) {
  for (const fn of undo.reverse()) {
    try {
      await fn();
    } catch (err) {
      console.error("[trade] rollback step failed:", err.message);
    }
  }
}

/** Add `qty` @ `price` to the user's lot for `name` (weighted-average cost), creating it if needed. */
async function addToLot(col, userId, name, qty, price, extra, undo) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const cur = await col.findOne({ ...ownerFilter(userId), name });
    if (!cur) {
      const doc = { userId: new ObjectId(userId), name, qty, avg: price, price, net: "0%", day: "0%", ...extra };
      const { insertedId } = await col.insertOne(doc);
      undo.push(() => col.deleteOne({ _id: insertedId }));
      return;
    }
    const curQty = n(cur.qty);
    const newQty = curQty + qty;
    const newAvg = round4((n(cur.avg) * curQty + price * qty) / newQty);
    const res = await col.updateOne({ _id: cur._id, qty: cur.qty, avg: cur.avg }, { $set: { qty: newQty, avg: newAvg, price } });
    if (res.matchedCount === 1) {
      undo.push(() => col.replaceOne({ _id: cur._id }, cur));
      return;
    }
    // somebody else changed the row between our read and write: re-read and retry
  }
  throw new HttpError(409, "Your portfolio changed while the order was being placed. Please try again.");
}

/** Remove `qty` from the given lots atomically (guarded by `qty >= take`). Returns what was taken. */
async function takeFromLots(col, docs, qty, undo) {
  let remaining = qty;
  const taken = [];
  for (const doc of docs) {
    if (remaining <= 0) break;
    const have = n(doc.qty);
    if (have <= 0) continue;
    const take = Math.min(have, remaining);
    const res = await col.updateOne({ _id: doc._id, qty: { $gte: take } }, { $inc: { qty: -take } });
    if (res.matchedCount !== 1) throw new HttpError(409, "Your holdings changed while the order was being placed. Please try again.");
    undo.push(() => col.updateOne({ _id: doc._id }, { $inc: { qty: take } }));
    taken.push({ doc, take });
    remaining -= take;
  }
  if (remaining > 0) throw new HttpError(400, "Not enough quantity");
  return taken;
}

async function placeOrder(userId, body) {
  const order = validateOrder(body);
  const { mode, qty } = order;
  let { name } = order;

  if (mode === "BUY") {
    name = ALIASES[name] || name; // legacy ticker -> current ticker
    if (!WATCHLIST_SET.has(name)) throw new HttpError(400, "Unknown instrument");
  }

  const price = await executionPrice(name);
  const amount = round2(qty * price);

  const funds = rawCollection(FundsModel);
  const holdings = rawCollection(HoldingsModel);
  const positions = rawCollection(PositionsModel);
  const orders = rawCollection(OrdersModel);

  const fund = await getOrCreateFund(userId);
  const undo = [];
  const zeroedHoldingIds = [];
  const zeroedPositionIds = [];

  try {
    if (mode === "BUY") {
      // Check-and-debit in a single atomic operation.
      const debited = await funds.findOneAndUpdate(
        { _id: fund._id, availableCash: { $gte: amount } },
        { $inc: { availableCash: -amount, availableMargin: -amount, usedMargin: amount } },
        { returnDocument: "after" }
      );
      if (!debited) throw new HttpError(400, "Insufficient Balance");
      undo.push(() =>
        funds.updateOne({ _id: fund._id }, { $inc: { availableCash: amount, availableMargin: amount, usedMargin: -amount } })
      );

      await addToLot(holdings, userId, name, qty, price, {}, undo);
      await addToLot(positions, userId, name, qty, price, { product: "CNC", isLoss: false }, undo);
    } else {
      const lots = (await holdings.find({ ...ownerFilter(userId), name }).toArray()).filter((d) => n(d.qty) > 0);
      if (lots.length === 0) throw new HttpError(400, "No Holdings Found");
      if (lots.reduce((s, d) => s + n(d.qty), 0) < qty) throw new HttpError(400, "Not enough quantity");

      const taken = await takeFromLots(holdings, lots, qty, undo);
      const costBasis = round2(taken.reduce((s, t) => s + t.take * n(t.doc.avg), 0));
      zeroedHoldingIds.push(...taken.filter((t) => n(t.doc.qty) - t.take <= 0).map((t) => t.doc._id));

      const posLots = (await positions.find({ ...ownerFilter(userId), name }).toArray()).filter((d) => n(d.qty) > 0);
      const posQty = Math.min(qty, posLots.reduce((s, d) => s + n(d.qty), 0));
      if (posQty > 0) {
        const posTaken = await takeFromLots(positions, posLots, posQty, undo);
        zeroedPositionIds.push(...posTaken.filter((t) => n(t.doc.qty) - t.take <= 0).map((t) => t.doc._id));
      }

      await funds.updateOne(
        { _id: fund._id },
        { $inc: { availableCash: amount, availableMargin: amount, usedMargin: -costBasis } }
      );
      undo.push(() =>
        funds.updateOne({ _id: fund._id }, { $inc: { availableCash: -amount, availableMargin: -amount, usedMargin: costBasis } })
      );
      await funds.updateOne({ _id: fund._id, usedMargin: { $lt: 0 } }, { $set: { usedMargin: 0 } }); // never negative
    }

    const record = {
      userId: new ObjectId(userId),
      name,
      qty,
      price,
      mode,
      status: "COMPLETED",
      createdAt: new Date(),
    };
    const { insertedId } = await orders.insertOne(record);
    undo.push(() => orders.deleteOne({ _id: insertedId }));

    // Housekeeping only after the order is safely recorded (empty lots are also filtered out on read).
    if (zeroedHoldingIds.length) await holdings.deleteMany({ _id: { $in: zeroedHoldingIds }, qty: { $lte: 0 } }).catch(() => {});
    if (zeroedPositionIds.length) await positions.deleteMany({ _id: { $in: zeroedPositionIds }, qty: { $lte: 0 } }).catch(() => {});

    const updatedFund = await funds.findOne({ _id: fund._id });
    return {
      success: true,
      message: "Order Placed Successfully",
      order: { _id: insertedId, name, qty, price, mode, status: "COMPLETED", createdAt: record.createdAt },
      funds: serializeFund(updatedFund),
    };
  } catch (err) {
    await rollback(undo);
    throw err;
  }
}

module.exports = { placeOrder, validateOrder };
