const express = require("express");
const router = express.Router();
const {
  fetchWatchlist
} = require("../services/yahooService");

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
    const stocks = await fetchWatchlist();

    res.json(stocks);

  } catch (err) {
    console.log("WATCHLIST ERROR:", err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;