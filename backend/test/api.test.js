/**
 * Integration tests - need a MongoDB-compatible server:
 *   TEST_MONGO_URL=mongodb://127.0.0.1:27017 npm test
 * A throw-away database is created and dropped, nothing else is touched. Skipped if TEST_MONGO_URL is unset.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const mongoose = require("mongoose");
const { makeFakeYahoo, silentLogger } = require("./helpers");

const MONGO = process.env.TEST_MONGO_URL;
const skip = MONGO ? false : "TEST_MONGO_URL not set";

const { config } = require("../config/env");
const { createApp } = require("../app");
const { createMarketData, setMarketData } = require("../services/yahooService");
const { WATCHLIST, toYahooSymbol } = require("../config/symbols");
const { ObjectId } = mongoose.Types;

const dbName = `tradely_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
let app, db, yahoo;

const tokenFor = (id, opts = {}) => jwt.sign({ id: String(id), email: "x@example.com" }, config.jwtSecret, { expiresIn: "1h", ...opts });
const auth = (id) => ({ Authorization: `Bearer ${tokenFor(id)}` });
const prices = () => ({ ...Object.fromEntries(WATCHLIST.map((n) => [toYahooSymbol(n), 100])), "TCS.NS": 1000, "INFY.NS": 2000, "^NSEI": 24000, "^BSESN": 80000 });

test.before(async () => {
  if (!MONGO) return;
  await mongoose.connect(MONGO, { dbName });
  db = mongoose.connection.db;
  await Promise.all(Object.values(mongoose.models).map((m) => m.init().catch(() => {})));
  yahoo = makeFakeYahoo(prices());
  setMarketData(createMarketData({ client: yahoo, logger: silentLogger }));
  app = createApp();
});

test.after(async () => {
  if (!MONGO) return;
  await db.dropDatabase();
  await mongoose.disconnect();
});

async function newUser(cash = 100000) {
  const _id = new ObjectId();
  await db.collection("users").insertOne({ _id, username: "u", email: `${_id}@example.com`, password: "x" });
  await db.collection("funds").insertOne({ userId: _id, availableMargin: cash, usedMargin: 0, availableCash: cash, openingBalance: cash, payin: 0 });
  return _id;
}
const fundOf = (id) => db.collection("funds").findOne({ userId: id });

// ---------------------------------------------------------------- auth
test("signup -> login -> protected route works end to end", { skip }, async () => {
  const email = `new${Date.now()}@Example.com`;
  const s = await request(app).post("/api/auth/signup").send({ username: "Neo", email, password: "correct-horse" });
  assert.equal(s.status, 201);

  const l = await request(app).post("/api/auth/login").send({ email: email.toUpperCase(), password: "correct-horse" });
  assert.equal(l.status, 200);
  assert.ok(l.body.token);

  const f = await request(app).get("/funds").set("Authorization", `Bearer ${l.body.token}`);
  assert.equal(f.status, 200);
  assert.equal(f.body.availableCash, 100000);
});

test("signup validates input and rejects duplicates", { skip }, async () => {
  const bad = await request(app).post("/api/auth/signup").send({ username: "a", email: "nope", password: "12345678" });
  assert.equal(bad.status, 400);
  const short = await request(app).post("/api/auth/signup").send({ username: "a", email: "a@b.co", password: "123" });
  assert.equal(short.status, 400);
  const email = `dup${Date.now()}@example.com`;
  await request(app).post("/api/auth/signup").send({ username: "a", email, password: "12345678" });
  const dup = await request(app).post("/api/auth/signup").send({ username: "a", email, password: "12345678" });
  assert.equal(dup.status, 409);
});

test("login: wrong password and unknown user give the same answer; operator injection is rejected", { skip }, async () => {
  const email = `l${Date.now()}@example.com`;
  await request(app).post("/api/auth/signup").send({ username: "a", email, password: "12345678" });
  const wrong = await request(app).post("/api/auth/login").send({ email, password: "wrong-wrong" });
  const unknown = await request(app).post("/api/auth/login").send({ email: "ghost@example.com", password: "whatever1" });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.message, unknown.body.message);

  const inject = await request(app).post("/api/auth/login").send({ email: { $gt: "" }, password: "x" });
  assert.ok([400, 401].includes(inject.status));
  assert.equal(inject.body.token, undefined);
});

test("protected routes reject missing, garbage, forged and expired tokens", { skip }, async () => {
  assert.equal((await request(app).get("/orders")).status, 401);
  assert.equal((await request(app).get("/orders").set("Authorization", "Bearer garbage")).status, 401);
  const forged = jwt.sign({ id: String(new ObjectId()) }, "some-other-secret");
  assert.equal((await request(app).get("/orders").set("Authorization", `Bearer ${forged}`)).status, 401);
  const expired = tokenFor(new ObjectId(), { expiresIn: -10 });
  const r = await request(app).get("/orders").set("Authorization", `Bearer ${expired}`);
  assert.equal(r.status, 401);
  assert.match(r.body.message, /expired/i);
});

// ---------------------------------------------------------------- data visibility (the reported bug)
test("existing records are returned for ObjectId userId, string userId, and never for other users or orphans", { skip }, async () => {
  const A = new ObjectId();
  const B = new ObjectId();
  const C = new ObjectId();
  await db.collection("funds").insertMany([
    { userId: A, availableMargin: 90000, usedMargin: 10000, availableCash: 90000, openingBalance: 100000, payin: 0 },
    { userId: B.toString(), availableMargin: 50000, usedMargin: 0, availableCash: 50000, openingBalance: 50000, payin: 0 },
  ]);
  await db.collection("holdings").insertMany([
    { userId: A, name: "TCS", qty: 5, avg: 900, price: 900 },
    { userId: B.toString(), name: "ITC", qty: 20, avg: 400, price: 400 },
    { name: "SBIN", qty: 3, avg: 600, price: 600 }, // legacy, no userId
  ]);
  await db.collection("orders").insertMany([
    { userId: A, name: "TCS", qty: 5, price: 900, mode: "BUY", status: "COMPLETED", createdAt: new Date() },
    { userId: B.toString(), name: "ITC", qty: 20, price: 400, mode: "BUY", status: "COMPLETED", createdAt: new Date() },
    { name: "SBIN", qty: 3, price: 600, mode: "BUY" },
  ]);

  const a = await request(app).get("/allHoldings").set(auth(A));
  assert.deepEqual(a.body.map((h) => h.name), ["TCS"]);
  const b = await request(app).get("/allHoldings").set(auth(B));
  assert.deepEqual(b.body.map((h) => h.name), ["ITC"], "string-typed userId must be found");
  assert.equal((await request(app).get("/orders").set(auth(B))).body.length, 1);

  const bFunds = await request(app).get("/funds").set(auth(B));
  assert.equal(bFunds.body.availableCash, 50000, "existing fund must be returned as-is");
  assert.equal(await db.collection("funds").countDocuments({ userId: { $in: [B, B.toString()] } }), 1, "no duplicate fund may be created");

  // C has nothing: sees nothing (orphan docs are not leaked) and gets a fresh default fund
  assert.deepEqual((await request(app).get("/allHoldings").set(auth(C))).body, []);
  assert.deepEqual((await request(app).get("/orders").set(auth(C))).body, []);
  assert.equal((await request(app).get("/funds").set(auth(C))).body.availableCash, 100000);
});

test("GET endpoints never modify stored holdings/orders/positions", { skip }, async () => {
  const U = await newUser();
  await db.collection("holdings").insertOne({ userId: U, name: "TCS", qty: 5, avg: 900, price: 111 });
  const before = JSON.stringify(await db.collection("holdings").find({ userId: U }).toArray());
  for (const p of ["/allHoldings", "/allPositions", "/orders", "/funds"]) await request(app).get(p).set(auth(U));
  const after = JSON.stringify(await db.collection("holdings").find({ userId: U }).toArray());
  assert.equal(after, before);
});

test("holdings: P&L is computed from live price; net chg is return on cost, day chg is the day move", { skip }, async () => {
  const U = await newUser();
  await db.collection("holdings").insertOne({ userId: U, name: "TCS", qty: 10, avg: 800 });
  const r = await request(app).get("/allHoldings").set(auth(U));
  const h = r.body[0];
  assert.equal(h.price, 1000);
  assert.equal(h.curValue, 10000);
  assert.equal(h.profit, 2000);
  assert.equal(h.net, "+25.00%");
  assert.equal(h.day, "+1.50%");
  assert.equal(h.priceSource, "live");
});

test("holdings fall back to the stored price (and say so) when Yahoo has no quote", { skip }, async () => {
  const U = await newUser();
  await db.collection("holdings").insertOne({ userId: U, name: "OBSCURE", qty: 2, avg: 50, price: 55 });
  const r = await request(app).get("/allHoldings").set(auth(U));
  assert.equal(r.status, 200);
  assert.equal(r.body[0].price, 55);
  assert.equal(r.body[0].priceSource, "stored");
  assert.equal(r.headers["x-data-unpriced"], "1");
});

test("legacy holdings saved as ZOMATO are priced via the renamed ETERNAL ticker", { skip }, async () => {
  const U = await newUser();
  await db.collection("holdings").insertOne({ userId: U, name: "ZOMATO", qty: 4, avg: 90, price: 90 });
  const r = await request(app).get("/allHoldings").set(auth(U));
  assert.equal(r.body[0].priceSource, "live");
  assert.equal(r.body[0].price, 100);
});

// ---------------------------------------------------------------- market endpoints
test("watchlist and indices endpoints respond; failures surface as 503, not a hang", { skip }, async () => {
  const w = await request(app).get("/api/stocks/watchlist");
  assert.equal(w.status, 200);
  assert.equal(w.body.length, 50);
  const i = await request(app).get("/marketIndices");
  assert.equal(i.status, 200);
  assert.equal(i.body.nifty.price, 24000);
  assert.equal((await request(app).get("/api/health")).body.status, "ok");

  const dead = createMarketData({ client: Object.assign(makeFakeYahoo({}), { mode: "fail" }), logger: silentLogger });
  setMarketData(dead);
  assert.equal((await request(app).get("/api/stocks/watchlist")).status, 503);
  assert.equal((await request(app).get("/marketIndices")).status, 503);
  setMarketData(createMarketData({ client: yahoo, logger: silentLogger })); // restore
});

// ---------------------------------------------------------------- trading
test("BUY uses the SERVER price, ignores the client's price, and updates funds/holdings/positions/orders", { skip }, async () => {
  const U = await newUser(100000);
  const r = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 10, price: 0.01, mode: "BUY" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.order.price, 1000, "executed at live price, not the 0.01 sent by the client");

  const f = await fundOf(U);
  assert.equal(f.availableCash, 90000);
  assert.equal(f.availableMargin, 90000);
  assert.equal(f.usedMargin, 10000);
  const h = await db.collection("holdings").findOne({ userId: U, name: "TCS" });
  assert.equal(h.qty, 10);
  assert.equal(h.avg, 1000);
  assert.equal((await db.collection("positions").findOne({ userId: U, name: "TCS" })).qty, 10);
  assert.equal(await db.collection("orders").countDocuments({ userId: U }), 1);
});

test("second BUY at a different price keeps a weighted average in holdings AND positions", { skip }, async () => {
  const U = await newUser(1_000_000);
  await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 10, mode: "BUY" }); // @1000
  yahoo.prices["TCS.NS"] = 1200;
  setMarketData(createMarketData({ client: yahoo, logger: silentLogger })); // drop cache
  await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 10, mode: "BUY" }); // @1200
  yahoo.prices["TCS.NS"] = 1000;
  setMarketData(createMarketData({ client: yahoo, logger: silentLogger }));

  const h = await db.collection("holdings").findOne({ userId: U, name: "TCS" });
  const p = await db.collection("positions").findOne({ userId: U, name: "TCS" });
  assert.equal(h.qty, 20);
  assert.equal(h.avg, 1100);
  assert.equal(p.avg, 1100);
});

test("BUY with insufficient balance is rejected and changes nothing", { skip }, async () => {
  const U = await newUser(500);
  const r = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 1, mode: "BUY" });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /insufficient/i);
  assert.equal((await fundOf(U)).availableCash, 500);
  assert.equal(await db.collection("holdings").countDocuments({ userId: U }), 0);
  assert.equal(await db.collection("orders").countDocuments({ userId: U }), 0);
});

test("invalid orders are rejected (fractional qty, zero, negative, junk mode, unknown instrument, bad name)", { skip }, async () => {
  const U = await newUser();
  const bad = [
    { name: "TCS", qty: 1.5, mode: "BUY" },
    { name: "TCS", qty: 0, mode: "BUY" },
    { name: "TCS", qty: -3, mode: "BUY" },
    { name: "TCS", qty: "abc", mode: "BUY" },
    { name: "TCS", qty: 1, mode: "HOLD" },
    { name: "NOTASTOCK", qty: 1, mode: "BUY" },
    { name: { $ne: 1 }, qty: 1, mode: "BUY" },
    { qty: 1, mode: "BUY" },
    { name: "TCS", qty: 10_000_000, mode: "BUY" },
  ];
  for (const body of bad) {
    const r = await request(app).post("/newOrder").set(auth(U)).send(body);
    assert.equal(r.status, 400, `expected 400 for ${JSON.stringify(body)}, got ${r.status}`);
  }
  assert.equal(await db.collection("orders").countDocuments({ userId: U }), 0);
});

test("SELL credits proceeds, releases COST BASIS from used margin, shrinks then removes the holding", { skip }, async () => {
  const U = await newUser(100000);
  await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 10, mode: "BUY" }); // cost 10,000
  yahoo.prices["TCS.NS"] = 1300;
  setMarketData(createMarketData({ client: yahoo, logger: silentLogger }));

  const s1 = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 4, mode: "SELL" });
  assert.equal(s1.status, 200, JSON.stringify(s1.body));
  let f = await fundOf(U);
  assert.equal(f.availableCash, 90000 + 4 * 1300);
  assert.equal(f.usedMargin, 10000 - 4 * 1000, "used margin drops by the cost basis (4 x 1000), not by the proceeds");
  assert.equal((await db.collection("holdings").findOne({ userId: U, name: "TCS" })).qty, 6);

  const s2 = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 6, mode: "SELL" });
  assert.equal(s2.status, 200);
  assert.equal(await db.collection("holdings").countDocuments({ userId: U, name: "TCS" }), 0);
  assert.equal(await db.collection("positions").countDocuments({ userId: U, name: "TCS" }), 0);
  f = await fundOf(U);
  assert.equal(f.usedMargin, 0);
  assert.equal(f.availableCash, 90000 + 10 * 1300);

  yahoo.prices["TCS.NS"] = 1000;
  setMarketData(createMarketData({ client: yahoo, logger: silentLogger }));
});

test("SELL more than owned / nothing owned is rejected without side effects", { skip }, async () => {
  const U = await newUser(100000);
  const none = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 1, mode: "SELL" });
  assert.equal(none.status, 400);
  await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 2, mode: "BUY" });
  const cash = (await fundOf(U)).availableCash;
  const tooMany = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 3, mode: "SELL" });
  assert.equal(tooMany.status, 400);
  assert.equal((await fundOf(U)).availableCash, cash);
  assert.equal((await db.collection("holdings").findOne({ userId: U, name: "TCS" })).qty, 2);
});

test("SELL works on holdings whose userId is stored as a string", { skip }, async () => {
  const U = new ObjectId();
  await db.collection("funds").insertOne({ userId: U.toString(), availableMargin: 1000, usedMargin: 800, availableCash: 1000, openingBalance: 1800, payin: 0 });
  await db.collection("holdings").insertOne({ userId: U.toString(), name: "TCS", qty: 2, avg: 400, price: 400 });
  const r = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 2, mode: "SELL" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const f = await db.collection("funds").findOne({ userId: U.toString() });
  assert.equal(f.availableCash, 3000);
  assert.equal(f.usedMargin, 0);
  assert.equal(await db.collection("funds").countDocuments({ userId: { $in: [U, U.toString()] } }), 1);
});

test("CONCURRENT buys cannot overdraw the account (atomic balance check)", { skip }, async () => {
  const U = await newUser(3500); // enough for three TCS@1000 buys, not four
  const results = await Promise.all(
    Array.from({ length: 8 }, () => request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 1, mode: "BUY" }))
  );
  const ok = results.filter((r) => r.status === 200).length;
  const rejected = results.filter((r) => r.status === 400).length;
  const f = await fundOf(U);
  assert.equal(ok, 3, `exactly 3 should succeed, got ${ok} (statuses: ${results.map((r) => r.status)})`);
  assert.equal(ok + rejected + results.filter((r) => r.status === 409).length, 8);
  assert.ok(f.availableCash >= 0, "balance must never go negative");
  assert.equal(f.availableCash, 3500 - ok * 1000);
  assert.equal(await db.collection("orders").countDocuments({ userId: U }), ok);
  const holdingQty = (await db.collection("holdings").find({ userId: U, name: "TCS" }).toArray()).reduce((s, d) => s + d.qty, 0);
  assert.equal(holdingQty, ok);
});

test("CONCURRENT sells cannot sell the same shares twice", { skip }, async () => {
  const U = await newUser(100000);
  await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 3, mode: "BUY" });
  const results = await Promise.all(
    Array.from({ length: 6 }, () => request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 1, mode: "SELL" }))
  );
  const ok = results.filter((r) => r.status === 200).length;
  assert.equal(ok, 3);
  const left = (await db.collection("holdings").find({ userId: U, name: "TCS" }).toArray()).reduce((s, d) => s + d.qty, 0);
  assert.equal(left, 0);
});

test("when live price is unavailable the order is refused (503) and nothing changes", { skip }, async () => {
  const U = await newUser(100000);
  const dead = Object.assign(makeFakeYahoo({}), { mode: "fail" });
  setMarketData(createMarketData({ client: dead, logger: silentLogger }));
  const r = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 1, mode: "BUY" });
  assert.equal(r.status, 503);
  assert.equal((await fundOf(U)).availableCash, 100000);
  assert.equal(await db.collection("orders").countDocuments({ userId: U }), 0);
  setMarketData(createMarketData({ client: yahoo, logger: silentLogger }));
});

test("a failure in the middle of an order rolls back funds and holdings", { skip }, async () => {
  const U = await newUser(100000);
  const original = db.collection.bind(db);
  db.collection = (name, ...rest) => {
    const col = original(name, ...rest);
    if (name !== "orders") return col;
    return new Proxy(col, { get: (t, p) => (p === "insertOne" ? async () => { throw new Error("simulated DB failure"); } : typeof t[p] === "function" ? t[p].bind(t) : t[p]) });
  };
  try {
    const r = await request(app).post("/newOrder").set(auth(U)).send({ name: "TCS", qty: 5, mode: "BUY" });
    assert.equal(r.status, 500);
  } finally {
    db.collection = original;
  }
  const f = await fundOf(U);
  assert.equal(f.availableCash, 100000, "debit must be rolled back");
  assert.equal(f.usedMargin, 0);
  assert.equal(await db.collection("holdings").countDocuments({ userId: U }), 0);
  assert.equal(await db.collection("positions").countDocuments({ userId: U }), 0);
});

test("orders endpoint returns newest first", { skip }, async () => {
  const U = await newUser();
  await db.collection("orders").insertMany([
    { userId: U, name: "A", qty: 1, price: 1, mode: "BUY", createdAt: new Date("2026-01-01") },
    { userId: U, name: "B", qty: 1, price: 1, mode: "BUY", createdAt: new Date("2026-03-01") },
    { userId: U, name: "C", qty: 1, price: 1, mode: "BUY", createdAt: new Date("2026-02-01") },
  ]);
  const r = await request(app).get("/orders").set(auth(U));
  assert.deepEqual(r.body.map((o) => o.name), ["B", "C", "A"]);
});

test("unknown routes return JSON 404 and malformed JSON returns 400", { skip }, async () => {
  assert.equal((await request(app).get("/nope")).status, 404);
  const r = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{bad json");
  assert.equal(r.status, 400);
});
