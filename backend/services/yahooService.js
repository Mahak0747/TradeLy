const { config } = require("../config/env");
const { WATCHLIST, INDEX_SYMBOLS, toYahooSymbol } = require("../config/symbols");

/**
 * Market-data service (Yahoo Finance).
 *
 * What changed vs. the original and why:
 *  - ONE batched request for many symbols (the library supports quote([..])). The original made 50
 *    sequential requests for the watchlist plus one request per holding/position row.
 *  - Per-symbol TTL cache shared by every endpoint (watchlist, indices, holdings, positions, trading).
 *  - In-flight de-duplication: N concurrent callers needing the same symbol trigger one upstream call.
 *  - Hard timeout + short back-off after a failure, so a slow/blocked Yahoo can never hang a request.
 *  - Stale-while-error: if Yahoo fails, last known quotes are served (flagged `stale`) instead of an error.
 */

const MAX_STALE_MS = 6 * 60 * 60 * 1000; // never serve a quote older than 6h, even as a fallback
const CHUNK_SIZE = 50;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalise(q) {
  return {
    symbol: q.symbol,
    price: num(q.regularMarketPrice),
    change: num(q.regularMarketChange),
    percent: num(q.regularMarketChangePercent),
    prevClose: num(q.regularMarketPreviousClose),
    time: q.regularMarketTime ? new Date(q.regularMarketTime).toISOString() : null,
  };
}

function createMarketData({
  client,
  ttlMs = config.market.quoteTtlMs,
  timeoutMs = config.market.requestTimeoutMs,
  failureBackoffMs = config.market.failureBackoffMs,
  now = Date.now,
  logger = console,
} = {}) {
  const cache = new Map(); // symbol -> { at, quote }
  const inflight = new Map(); // symbol -> Promise (shared by every caller that needs it)
  const state = { backoffUntil: 0, lastError: null, lastErrorAt: null, lastSuccessAt: null, upstreamCalls: 0 };

  const view = (entry, stale) => ({ ...entry.quote, stale, ageMs: now() - entry.at });

  async function fetchChunk(symbols) {
    state.upstreamCalls += 1;
    try {
      const res = await withTimeout(
        client.quote(symbols, {}, { validateResult: false }),
        timeoutMs,
        "Yahoo Finance request"
      );
      const list = Array.isArray(res) ? res : res ? [res] : [];
      const at = now();
      for (const raw of list) {
        if (!raw || !raw.symbol) continue;
        const quote = normalise(raw);
        if (quote.price === null || quote.price <= 0) continue; // unusable quote: treat as missing
        cache.set(raw.symbol, { at, quote });
      }
      state.lastSuccessAt = at;
      state.lastError = null;
    } catch (err) {
      state.lastError = err.message;
      state.lastErrorAt = now();
      state.backoffUntil = now() + failureBackoffMs;
      logger.warn(`[market] Yahoo request failed (${symbols.length} symbols): ${err.message}`);
    } finally {
      for (const s of symbols) inflight.delete(s);
    }
  }

  /**
   * Resolve quotes for a list of Yahoo symbols.
   * Returns Map<symbol, quote>; symbols that could not be resolved at all are simply absent.
   * Each quote carries `stale` (served from cache after a failed refresh) and `ageMs`.
   */
  async function getQuotes(symbols, { ttlMs: ttl = ttlMs } = {}) {
    const unique = [...new Set(symbols.filter(Boolean))];
    const waits = [];
    const toFetch = [];
    const t = now();

    for (const sym of unique) {
      const c = cache.get(sym);
      if (c && t - c.at < ttl) continue; // fresh enough
      if (inflight.has(sym)) {
        waits.push(inflight.get(sym));
        continue;
      }
      toFetch.push(sym);
    }

    if (toFetch.length && t >= state.backoffUntil) {
      for (const part of chunk(toFetch, CHUNK_SIZE)) {
        const p = fetchChunk(part); // never rejects
        for (const s of part) inflight.set(s, p);
        waits.push(p);
      }
    }

    await Promise.all(waits);

    const result = new Map();
    const after = now();
    for (const sym of unique) {
      const c = cache.get(sym);
      if (!c) continue;
      const fresh = after - c.at < ttl;
      if (fresh) result.set(sym, view(c, false));
      else if (after - c.at < MAX_STALE_MS) result.set(sym, view(c, true));
    }
    return result;
  }

  async function getQuote(symbol, opts) {
    return (await getQuotes([symbol], opts)).get(symbol) || null;
  }

  async function getWatchlist() {
    const symbols = WATCHLIST.map(toYahooSymbol);
    const quotes = await getQuotes(symbols);
    const stocks = [];
    let stale = false;
    for (let i = 0; i < WATCHLIST.length; i++) {
      const q = quotes.get(symbols[i]);
      if (!q) continue;
      if (q.stale) stale = true;
      const pct = q.percent ?? 0;
      stocks.push({
        name: WATCHLIST[i],
        price: q.price,
        percent: pct.toFixed(2) + "%",
        isDown: pct < 0,
      });
    }
    return { stocks, stale, missing: WATCHLIST.length - stocks.length };
  }

  async function getIndices() {
    const symbols = Object.values(INDEX_SYMBOLS);
    const quotes = await getQuotes(symbols, { ttlMs: config.market.indicesTtlMs });
    const pick = (sym) => {
      const q = quotes.get(sym);
      return q ? { price: q.price, change: q.change, percent: q.percent } : { price: null, change: null, percent: null };
    };
    const stale = symbols.some((s) => quotes.get(s)?.stale);
    const available = symbols.some((s) => quotes.has(s));
    return { data: { nifty: pick(INDEX_SYMBOLS.nifty), sensex: pick(INDEX_SYMBOLS.sensex) }, stale, available };
  }

  function health() {
    return {
      cachedSymbols: cache.size,
      lastSuccessAt: state.lastSuccessAt ? new Date(state.lastSuccessAt).toISOString() : null,
      lastError: state.lastError,
      upstreamCalls: state.upstreamCalls,
      backingOff: now() < state.backoffUntil,
    };
  }

  /** Pre-fill the cache at boot so the first visitor doesn't pay the cold-start cost. */
  function warmUp() {
    return Promise.all([getWatchlist(), getIndices()]).catch(() => {});
  }

  function clear() {
    cache.clear();
    inflight.clear();
    state.backoffUntil = 0;
  }

  return { getQuotes, getQuote, getWatchlist, getIndices, health, warmUp, clear, _state: state };
}

function createDefaultClient() {
  const YahooFinance = require("yahoo-finance2").default;
  return new YahooFinance({ suppressNotices: ["yahooSurvey"] });
}

// Lazily create the real Yahoo client so tests can inject a fake one without loading the library.
let singleton;
function getMarketData() {
  if (!singleton) singleton = createMarketData({ client: createDefaultClient() });
  return singleton;
}
function setMarketData(instance) {
  singleton = instance;
}

module.exports = { createMarketData, getMarketData, setMarketData };
