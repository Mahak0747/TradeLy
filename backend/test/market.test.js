const test = require("node:test");
const assert = require("node:assert/strict");
const { makeFakeYahoo, silentLogger } = require("./helpers");
const { createMarketData } = require("../services/yahooService");
const { WATCHLIST, toYahooSymbol } = require("../config/symbols");

const allPrices = () => Object.fromEntries(WATCHLIST.map((n, i) => [toYahooSymbol(n), 100 + i]));

test("watchlist is fetched with ONE upstream request and then served from cache", async () => {
  const yahoo = makeFakeYahoo({ ...allPrices(), "^NSEI": 24000, "^BSESN": 80000 });
  const md = createMarketData({ client: yahoo, logger: silentLogger });

  const first = await md.getWatchlist();
  assert.equal(first.stocks.length, 50);
  assert.equal(yahoo.calls.length, 1, "50 symbols must be one batched request, not 50");
  assert.equal(yahoo.calls[0].length, 50);

  await md.getWatchlist();
  await md.getWatchlist();
  assert.equal(yahoo.calls.length, 1, "cache hit must not call Yahoo again");
});

test("concurrent requests for the same symbols share a single in-flight upstream call", async () => {
  const yahoo = makeFakeYahoo(allPrices());
  const md = createMarketData({ client: yahoo, logger: silentLogger });
  await Promise.all(Array.from({ length: 20 }, () => md.getWatchlist()));
  assert.equal(yahoo.calls.length, 1);
});

test("holdings/positions/trading reuse quotes already fetched for the watchlist", async () => {
  const yahoo = makeFakeYahoo(allPrices());
  const md = createMarketData({ client: yahoo, logger: silentLogger });
  await md.getWatchlist();
  const q = await md.getQuote("TCS.NS");
  assert.ok(q.price > 0);
  assert.equal(yahoo.calls.length, 1);
});

test("symbols Yahoo does not return are omitted instead of breaking the response", async () => {
  const prices = allPrices();
  delete prices["INFY.NS"];
  const md = createMarketData({ client: makeFakeYahoo(prices), logger: silentLogger });
  const { stocks, missing } = await md.getWatchlist();
  assert.equal(stocks.length, 49);
  assert.equal(missing, 1);
  assert.ok(!stocks.some((s) => s.name === "INFY"));
});

test("when Yahoo fails, last known quotes are served flagged stale (no error)", async () => {
  let t = 1_000_000;
  const yahoo = makeFakeYahoo(allPrices());
  const md = createMarketData({ client: yahoo, ttlMs: 30_000, failureBackoffMs: 10_000, now: () => t, logger: silentLogger });

  await md.getWatchlist();
  t += 60_000; // cache is now older than the TTL
  yahoo.mode = "fail";
  const res = await md.getWatchlist();
  assert.equal(res.stocks.length, 50);
  assert.equal(res.stale, true);
});

test("after a failure Yahoo is not hammered: calls are skipped during the back-off window", async () => {
  let t = 1_000_000;
  const yahoo = makeFakeYahoo(allPrices());
  const md = createMarketData({ client: yahoo, ttlMs: 30_000, failureBackoffMs: 10_000, now: () => t, logger: silentLogger });
  await md.getWatchlist();
  t += 60_000;
  yahoo.mode = "fail";
  await md.getWatchlist(); // 1 failing attempt
  const callsAfterFailure = yahoo.calls.length;
  for (let i = 0; i < 10; i++) await md.getWatchlist();
  assert.equal(yahoo.calls.length, callsAfterFailure, "no new upstream calls while backing off");
  t += 11_000; // back-off over, Yahoo recovers
  yahoo.mode = "ok";
  const res = await md.getWatchlist();
  assert.equal(res.stale, false);
});

test("a hanging Yahoo request times out instead of hanging the API", async () => {
  const yahoo = makeFakeYahoo(allPrices());
  yahoo.mode = "hang";
  const md = createMarketData({ client: yahoo, timeoutMs: 50, logger: silentLogger });
  const started = Date.now();
  const res = await md.getWatchlist();
  assert.ok(Date.now() - started < 1000, "must return quickly");
  assert.equal(res.stocks.length, 0);
});

test("indices report unavailable (not a crash) when there is no data at all", async () => {
  const yahoo = makeFakeYahoo({});
  const md = createMarketData({ client: yahoo, logger: silentLogger });
  const { available } = await md.getIndices();
  assert.equal(available, false);
});

test("renamed tickers map to their current Yahoo symbol", () => {
  assert.equal(toYahooSymbol("ZOMATO"), "ETERNAL.NS");
  assert.equal(toYahooSymbol("tatamotors"), "TMPV.NS");
  assert.equal(toYahooSymbol("M&M.NS"), "M&M.NS");
  assert.equal(toYahooSymbol("'; drop"), null);
});
