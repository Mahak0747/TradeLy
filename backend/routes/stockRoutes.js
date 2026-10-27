const express = require("express");
const { getMarketData } = require("../services/yahooService");

const router = express.Router();

router.get("/watchlist", async (req, res) => {
  const { stocks, stale, missing } = await getMarketData().getWatchlist();
  if (stocks.length === 0) {
    return res.status(503).json({ message: "Market data is temporarily unavailable", error: "Market data is temporarily unavailable" });
  }
  if (stale) res.set("X-Data-Stale", "true");
  if (missing) res.set("X-Data-Missing", String(missing));
  res.json(stocks);
});

module.exports = router;
