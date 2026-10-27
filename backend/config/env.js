require("dotenv").config({ quiet: true });

const isProd = process.env.NODE_ENV === "production";

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const config = {
  isProd,
  port: int("PORT", 3002),
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Comma-separated list of allowed browser origins, e.g. "https://my-app.vercel.app,http://localhost:5173".
  // Empty = allow any origin (OK for a Bearer-token API, but set it in production).
  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),

  // "1.1.1.1,8.8.8.8" (default, same as the original code) or "system" to use the OS resolver.
  dnsServers: process.env.DNS_SERVERS === undefined ? "1.1.1.1,8.8.8.8" : process.env.DNS_SERVERS,

  market: {
    quoteTtlMs: int("QUOTE_TTL_MS", 30_000),
    indicesTtlMs: int("INDICES_TTL_MS", 15_000),
    requestTimeoutMs: int("YAHOO_TIMEOUT_MS", 8_000),
    failureBackoffMs: int("YAHOO_BACKOFF_MS", 10_000),
    // A trade is only executed against a quote this fresh.
    tradeMaxQuoteAgeMs: int("TRADE_MAX_QUOTE_AGE_MS", 120_000),
  },
};

/** Throws a readable error if the server cannot run safely. */
function assertConfig(cfg = config) {
  const problems = [];
  if (!cfg.mongoUrl) problems.push("MONGO_URL is not set");
  if (!cfg.jwtSecret) problems.push("JWT_SECRET is not set");
  else if (cfg.isProd && cfg.jwtSecret.length < 32) problems.push("JWT_SECRET must be at least 32 characters in production");
  if (problems.length) {
    throw new Error(`Invalid server configuration:\n  - ${problems.join("\n  - ")}\nSee backend/.env.example`);
  }
}

module.exports = { config, assertConfig };
