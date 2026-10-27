process.env.JWT_SECRET = process.env.JWT_SECRET || "unit-test-secret-unit-test-secret-1234";
process.env.NODE_ENV = "test";

/** Fake Yahoo client: records every upstream request; can fail, hang or omit symbols. */
function makeFakeYahoo(prices = {}) {
  const client = {
    calls: [],
    prices,
    mode: "ok", // "ok" | "fail" | "hang"
    percent: 1.5,
    async quote(symbols) {
      client.calls.push([].concat(symbols));
      if (client.mode === "fail") throw new Error("simulated Yahoo outage");
      if (client.mode === "hang") return new Promise(() => {});
      const list = [].concat(symbols)
        .filter((s) => client.prices[s] !== undefined)
        .map((s) => ({
          symbol: s,
          regularMarketPrice: client.prices[s],
          regularMarketChange: 1,
          regularMarketChangePercent: client.percent,
          regularMarketPreviousClose: client.prices[s] - 1,
          regularMarketTime: Date.now(),
        }));
      return Array.isArray(symbols) ? list : list[0];
    },
  };
  return client;
}

const silentLogger = { warn() {}, error() {}, log() {} };

module.exports = { makeFakeYahoo, silentLogger };
