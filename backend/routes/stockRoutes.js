const express = require("express");
const router = express.Router();
const YahooFinance = require("yahoo-finance2").default;

// create instance
const yahooFinance = new YahooFinance();
const symbols = [
    "TCS.NS",
    "INFY.NS",
    "RELIANCE.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "SBIN.NS"
];

router.get("/watchlist", async (req, res) => {
    try {
        const stocks = await Promise.all(symbols.map(async (symbol) => {
            const quote = await yahooFinance.quote(symbol);
            return {
                name: symbol.replace(".NS", ""),
                price:Number(quote.regularMarketPrice || 0),
                percent: quote.regularMarketChangePercent?
                        quote.regularMarketChangePercent.toFixed(2) + "%" : "0.00%",
                isDown: quote.regularMarketChangePercent < 0
            };
        }));
        console.log("Yahoo Data:", stocks);
        res.json(stocks);
    }
    catch (err) {
        console.log("YAHOO ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;