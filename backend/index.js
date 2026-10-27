const dns = require("dns");
const mongoose = require("mongoose");

const { config, assertConfig } = require("./config/env");
const { createApp } = require("./app");
const { getMarketData } = require("./services/yahooService");

// Atlas "mongodb+srv://" URLs need SRV lookups; some ISPs/routers break them, so the original forced
// public resolvers. Still the default - set DNS_SERVERS=system to use the OS resolver instead.
if (config.dnsServers && config.dnsServers !== "system") {
  dns.setServers(config.dnsServers.split(",").map((s) => s.trim()).filter(Boolean));
}

async function connectWithRetry() {
  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 10 });
      const { host, name } = mongoose.connection;
      console.log(`MongoDB connected (host: ${host}, database: "${name}")`);
      return;
    } catch (err) {
      const wait = Math.min(30_000, 2_000 * attempt);
      console.error(
        `MongoDB connection failed (attempt ${attempt}): ${err.message}\n` +
          `  -> check MONGO_URL, and (Atlas) Network Access must allow this server's IP. Retrying in ${wait / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function main() {
  assertConfig();
  if (config.isProd && config.corsOrigins.length === 0) {
    console.warn("WARNING: CORS_ORIGIN is not set - any website can call this API from a browser. Set it to your frontend URL.");
  }

  const app = createApp();
  // Listen first so the host's port check passes; DB routes answer 503 until MongoDB is connected.
  const server = app.listen(config.port, () => console.log(`Server running on port ${config.port}`));

  getMarketData().warmUp(); // independent of the DB: pre-fill the quote cache while MongoDB connects
  connectWithRetry();

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.disconnect().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
