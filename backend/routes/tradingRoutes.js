const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const dbReady = require("../middleware/dbReady");
const { getMarketData } = require("../services/yahooService");
const { getHoldings, getPositions, getOrders, getOrCreateFund, serializeFund } = require("../services/portfolioService");
const { placeOrder } = require("../services/tradingService");

const router = express.Router();

function setDataHeaders(res, { stale, unpriced }) {
  if (stale) res.set("X-Data-Stale", "true");
  if (unpriced) res.set("X-Data-Unpriced", String(unpriced));
}

// Public: NIFTY 50 / SENSEX
router.get("/marketIndices", async (req, res) => {
  const { data, stale, available } = await getMarketData().getIndices();
  if (!available) {
    return res.status(503).json({ message: "Market data is temporarily unavailable", error: "Market data is temporarily unavailable" });
  }
  if (stale) res.set("X-Data-Stale", "true");
  res.json(data);
});

// Everything below needs a valid JWT and a live database connection
router.use(["/orders", "/funds", "/allHoldings", "/allPositions", "/newOrder"], dbReady, authMiddleware);

router.get("/orders", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 1000);
  const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
  res.json(await getOrders(req.user.id, { limit, skip }));
});

router.get("/funds", async (req, res) => {
  res.json(serializeFund(await getOrCreateFund(req.user.id)));
});

router.get("/allHoldings", async (req, res) => {
  const result = await getHoldings(req.user.id);
  setDataHeaders(res, result);
  res.json(result.items);
});

router.get("/allPositions", async (req, res) => {
  const result = await getPositions(req.user.id);
  setDataHeaders(res, result);
  res.json(result.items);
});

router.post("/newOrder", async (req, res) => {
  res.json(await placeOrder(req.user.id, req.body));
});

module.exports = router;
