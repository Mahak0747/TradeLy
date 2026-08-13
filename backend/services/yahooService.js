const YahooFinance = require("yahoo-finance2").default;

const yahooFinance = new YahooFinance();

const symbols = [
  "RELIANCE.NS",
  "TCS.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "INFY.NS",
  "HINDUNILVR.NS",
  "ITC.NS",
  "SBIN.NS",
  "BHARTIARTL.NS",
  "KOTAKBANK.NS",
  "LT.NS",
  "AXISBANK.NS",
  "BAJFINANCE.NS",
  "ASIANPAINT.NS",
  "MARUTI.NS",
  "SUNPHARMA.NS",
  "TITAN.NS",
  "ULTRACEMCO.NS",
  "WIPRO.NS",
  "NESTLEIND.NS",
  "HCLTECH.NS",
  "ADANIENT.NS",
  "ADANIPORTS.NS",
  "ONGC.NS",
  "NTPC.NS",
  "POWERGRID.NS",
  "M&M.NS",
  "TATAMOTORS.NS",
  "TATASTEEL.NS",
  "JSWSTEEL.NS",
  "COALINDIA.NS",
  "TECHM.NS",
  "BAJAJFINSV.NS",
  "GRASIM.NS",
  "CIPLA.NS",
  "DRREDDY.NS",
  "EICHERMOT.NS",
  "HEROMOTOCO.NS",
  "BRITANNIA.NS",
  "APOLLOHOSP.NS",
  "DIVISLAB.NS",
  "BPCL.NS",
  "IOC.NS",
  "HINDALCO.NS",
  "TATACONSUM.NS",
  "INDUSINDBK.NS",
  "SHRIRAMFIN.NS",
  "BEL.NS",
  "TRENT.NS",
  "ZOMATO.NS"
];

let watchlistCache = [];
let indicesCache = null;

let lastWatchlistFetch = 0;
let lastIndicesFetch = 0;

const CACHE_TIME = 30000; // 30 seconds

async function fetchWatchlist() {
  const now = Date.now();

  // Return cached data if it is still fresh
  if (
    watchlistCache.length > 0 &&
    now - lastWatchlistFetch < CACHE_TIME
  ) {
    return watchlistCache;
  }

  console.log("Fetching fresh watchlist data from Yahoo...");

  const stocks = [];

  for (const symbol of symbols) {
    try {
      const quote = await yahooFinance.quote(symbol);

      if (!quote) {
        console.log(`No quote returned for ${symbol}`);
        continue;
      }

      stocks.push({
        name: symbol.replace(".NS", ""),
        price: Number(quote.regularMarketPrice || 0),
        percent:
          quote.regularMarketChangePercent != null
            ? quote.regularMarketChangePercent.toFixed(2) + "%"
            : "0.00%",
        isDown:
          (quote.regularMarketChangePercent || 0) < 0
      });

    } catch (error) {
      console.log(
        `Failed to fetch ${symbol}:`,
        error.message
      );
    }
  }

  if (stocks.length > 0) {
    watchlistCache = stocks;
    lastWatchlistFetch = Date.now();
  }

  console.log(
    `Yahoo returned ${stocks.length}/${symbols.length} stocks`
  );

  return watchlistCache;
}

async function fetchIndices() {
  const now = Date.now();

  if (
    indicesCache &&
    now - lastIndicesFetch < CACHE_TIME
  ) {
    return indicesCache;
  }

  console.log("Fetching fresh market indices from Yahoo...");

  try {
    const nifty = await yahooFinance.quote("^NSEI");
    const sensex = await yahooFinance.quote("^BSESN");

    indicesCache = {
      nifty: {
        price: nifty?.regularMarketPrice ?? null,
        change: nifty?.regularMarketChange ?? null,
        percent: nifty?.regularMarketChangePercent ?? null
      },

      sensex: {
        price: sensex?.regularMarketPrice ?? null,
        change: sensex?.regularMarketChange ?? null,
        percent: sensex?.regularMarketChangePercent ?? null
      }
    };

    lastIndicesFetch = Date.now();

    return indicesCache;

  } catch (error) {
    console.log(
      "Failed to fetch market indices:",
      error.message
    );

    // Return old data if Yahoo temporarily fails
    if (indicesCache) {
      return indicesCache;
    }

    throw error;
  }
}

async function fetchQuote(symbol) {
  return await yahooFinance.quote(symbol);
}

module.exports = {
  fetchQuote,
  fetchWatchlist,
  fetchIndices
};