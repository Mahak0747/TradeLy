const express = require("express");
const router = express.Router();
const YahooFinance = require("yahoo-finance2").default;

// create instance
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

router.get("/watchlist", async (req, res) => {
  try {
    const stocks = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);

          if (!quote) {
            console.log(`No quote returned for: ${symbol}`);
            return null;
          }

          return {
            name: symbol.replace(".NS", ""),
            price: Number(quote.regularMarketPrice || 0),
            percent:
              quote.regularMarketChangePercent != null
                ? quote.regularMarketChangePercent.toFixed(2) + "%"
                : "0.00%",
            isDown: (quote.regularMarketChangePercent || 0) < 0,
          };
        } catch (error) {
          console.log(`Failed to fetch ${symbol}:`, error.message);
          return null;
        }
      })
    );

    const validStocks = stocks.filter(Boolean);

    console.log(
      `Yahoo returned ${validStocks.length}/${symbols.length} stocks`
    );

    console.log("Yahoo Data:", validStocks);

    res.json(validStocks);
  } catch (err) {
    console.log("YAHOO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;