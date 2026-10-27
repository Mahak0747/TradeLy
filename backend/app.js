const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const { config } = require("./config/env");
const { getMarketData } = require("./services/yahooService");
const { notFound, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render/Railway/Vercel sit behind a proxy: needed for correct client IPs (rate limiting)

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin(origin, cb) {
        // no Origin header = curl / server-to-server / same-origin: allow
        if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      exposedHeaders: ["X-Data-Stale", "X-Data-Missing", "X-Data-Unpriced"],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: "10kb" }));

  // Light global limiter (dashboard polling is ~6 req/min/user) + a strict one for credential endpoints.
  app.use(rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: "draft-7", legacyHeaders: false }));
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in a few minutes." },
  });

  // Liveness/uptime probe: always 200 while the process is up; reports dependency state in the body.
  app.get(["/", "/api/health"], (req, res) => {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    res.json({
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      database: states[mongoose.connection.readyState] || "unknown",
      market: getMarketData().health(),
    });
  });

  app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
  app.use("/api/stocks", require("./routes/stockRoutes"));
  // Legacy root-level endpoints are kept as-is so the existing frontend/docs keep working.
  app.use("/", require("./routes/tradingRoutes"));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
