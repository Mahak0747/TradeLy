// Single source of truth for the watchlist (previously duplicated in two files).
//
// NSE tickers change over time. A symbol that Yahoo no longer serves is silently
// dropped from batch quotes, which is why the old watchlist showed 48/50 stocks:
//   ZOMATO     -> ETERNAL (renamed 9 Apr 2025)
//   TATAMOTORS -> TMPV    (passenger-vehicle business after the Oct 2025 demerger)
// ALIASES keeps *existing* holdings/orders that were saved under the old name priced
// correctly without touching the stored records.

const WATCHLIST = [
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "HINDUNILVR", "ITC", "SBIN", "BHARTIARTL", "KOTAKBANK",
  "LT", "AXISBANK", "BAJFINANCE", "ASIANPAINT", "MARUTI", "SUNPHARMA", "TITAN", "ULTRACEMCO", "WIPRO", "NESTLEIND",
  "HCLTECH", "ADANIENT", "ADANIPORTS", "ONGC", "NTPC", "POWERGRID", "M&M", "TMPV", "TATASTEEL", "JSWSTEEL",
  "COALINDIA", "TECHM", "BAJAJFINSV", "GRASIM", "CIPLA", "DRREDDY", "EICHERMOT", "HEROMOTOCO", "BRITANNIA", "APOLLOHOSP",
  "DIVISLAB", "BPCL", "IOC", "HINDALCO", "TATACONSUM", "INDUSINDBK", "SHRIRAMFIN", "BEL", "TRENT", "ETERNAL",
];

const ALIASES = {
  ZOMATO: "ETERNAL",
  TATAMOTORS: "TMPV",
};

const INDEX_SYMBOLS = { nifty: "^NSEI", sensex: "^BSESN" };

const NAME_PATTERN = /^[A-Z0-9&-]{1,20}$/;

/** "tcs", "TCS.NS" -> "TCS". Returns null if it is not a plausible NSE symbol. */
function normalizeName(input) {
  if (typeof input !== "string") return null;
  const n = input.trim().toUpperCase().replace(/\.NS$/, "");
  return NAME_PATTERN.test(n) ? n : null;
}

/** Display/stored name -> Yahoo symbol ("ZOMATO" -> "ETERNAL.NS"). */
function toYahooSymbol(name) {
  const n = normalizeName(name);
  if (!n) return null;
  return `${ALIASES[n] || n}.NS`;
}

const WATCHLIST_SET = new Set(WATCHLIST);

module.exports = { WATCHLIST, WATCHLIST_SET, ALIASES, INDEX_SYMBOLS, normalizeName, toYahooSymbol };
