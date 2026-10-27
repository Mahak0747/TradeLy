const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { OrdersModel } = require("../model/OrdersModel");
const { FundsModel } = require("../model/FundsModel");
const { ownerFilter, rawCollection, round2, ObjectId } = require("../utils/owner");
const { toYahooSymbol, normalizeName } = require("../config/symbols");
const { getMarketData } = require("./yahooService");

const DEFAULT_FUND = { availableMargin: 100000, usedMargin: 0, availableCash: 100000, openingBalance: 100000, payin: 0 };

const n = (v, fallback = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};
const pct = (v) => `${v >= 0 ? "+" : ""}${n(v).toFixed(2)}%`;

/** Rows of the same instrument (possible after concurrent first-buys or legacy imports) are merged for display. */
function mergeByName(rows) {
  const map = new Map();
  for (const r of rows) {
    const name = normalizeName(r.name) || String(r.name);
    const qty = n(r.qty);
    const prev = map.get(name);
    if (!prev) {
      map.set(name, { ...r, name, qty, avg: n(r.avg), price: n(r.price) });
    } else {
      const total = prev.qty + qty;
      prev.avg = total > 0 ? (prev.avg * prev.qty + n(r.avg) * qty) / total : prev.avg;
      prev.qty = total;
    }
  }
  return [...map.values()].filter((r) => r.qty > 0);
}

/** Attach live prices (one batched, cached request for all rows) and compute P&L. */
async function priceRows(rows) {
  const merged = mergeByName(rows);
  const symbols = merged.map((r) => toYahooSymbol(r.name));
  const quotes = await getMarketData().getQuotes(symbols);
  let stale = false;
  let unpriced = 0;

  const items = merged.map((r) => {
    const q = quotes.get(toYahooSymbol(r.name));
    const live = q && q.price > 0;
    if (!live) unpriced += 1;
    if (q && q.stale) stale = true;
    const price = live ? q.price : n(r.price, r.avg); // fall back to the last price stored with the record
    const curValue = price * r.qty;
    const invested = r.avg * r.qty;
    const profit = curValue - invested;
    const netPct = invested > 0 ? (profit / invested) * 100 : 0;
    const dayPct = live ? n(q.percent) : 0;
    return {
      ...r,
      price,
      curValue,
      profit,
      net: pct(netPct), // overall return on cost (the original showed the day change here)
      day: pct(dayPct),
      isLoss: dayPct < 0,
      priceSource: live ? (q.stale ? "cached" : "live") : "stored",
    };
  });
  return { items, stale, unpriced };
}

async function getHoldings(userId) {
  const docs = await rawCollection(HoldingsModel).find(ownerFilter(userId)).toArray();
  const { items, stale, unpriced } = await priceRows(docs);
  return {
    stale,
    unpriced,
    items: items.map((r) => ({
      _id: r._id,
      name: r.name,
      qty: r.qty,
      avg: r.avg,
      price: r.price,
      curValue: r.curValue,
      profit: r.profit,
      net: r.net,
      day: r.day,
      priceSource: r.priceSource,
    })),
  };
}

async function getPositions(userId) {
  const docs = await rawCollection(PositionsModel).find(ownerFilter(userId)).toArray();
  const { items, stale, unpriced } = await priceRows(docs);
  return {
    stale,
    unpriced,
    items: items.map((r) => ({
      _id: r._id,
      product: r.product || "CNC",
      name: r.name,
      qty: r.qty,
      avg: r.avg,
      price: r.price,
      net: r.net,
      day: r.day,
      isLoss: r.isLoss,
      priceSource: r.priceSource,
    })),
  };
}

async function getOrders(userId, { limit = 500, skip = 0 } = {}) {
  const docs = await rawCollection(OrdersModel)
    .find(ownerFilter(userId))
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return docs.map((o) => ({
    _id: o._id,
    name: o.name,
    qty: n(o.qty),
    price: n(o.price),
    mode: o.mode,
    status: o.status || "COMPLETED",
    createdAt: o.createdAt || (o._id instanceof ObjectId ? o._id.getTimestamp() : null),
  }));
}

/**
 * Funds for a user. A fund document is only created if the user has none at all
 * (same behaviour as the original) - an existing document is never altered here.
 */
async function getOrCreateFund(userId) {
  const col = rawCollection(FundsModel);
  const existing = await col.findOne(ownerFilter(userId));
  if (existing) return existing;
  return col.findOneAndUpdate(
    ownerFilter(userId),
    { $setOnInsert: { ...DEFAULT_FUND, userId: new ObjectId(String(userId)) } },
    { upsert: true, returnDocument: "after" }
  );
}

function serializeFund(f) {
  return {
    _id: f._id,
    availableMargin: round2(n(f.availableMargin)),
    usedMargin: round2(n(f.usedMargin)),
    availableCash: round2(n(f.availableCash)),
    openingBalance: round2(n(f.openingBalance)),
    payin: round2(n(f.payin)),
  };
}

module.exports = { getHoldings, getPositions, getOrders, getOrCreateFund, serializeFund, DEFAULT_FUND };
