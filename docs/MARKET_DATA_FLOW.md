# Market Data Flow

TradeLy's only source of price data is Yahoo Finance, accessed through the `yahoo-finance2` npm package inside `backend/services/yahooService.js`. There is no WebSocket/streaming layer — the frontend polls REST endpoints on a timer.

## Where market data is used

| Frontend component | Endpoint | Poll interval | Purpose |
|---|---|---|---|
| `dashboard/TopBar.jsx` | `GET /marketIndices` | 15s | NIFTY 50 / SENSEX ticker |
| `dashboard/WatchList.jsx` | `GET /api/stocks/watchlist` | 30s | 50-stock watchlist + distribution chart |
| `dashboard/Holdings.jsx` (via `GET /allHoldings`) | live quote per holding | on mount only | Reprice each holding for P&L |
| `dashboard/Positions.jsx` (via `GET /allPositions`) | live quote per position | on mount only | Reprice each position for P&L |

## Backend caching strategy

`yahooService.js` maintains two **in-process, in-memory** caches (plain module-level variables — they reset on server restart and are not shared across multiple server instances):

```js
let watchlistCache = [];
let indicesCache = null;
let lastWatchlistFetch = 0;
let lastIndicesFetch = 0;
const CACHE_TIME = 30000; // 30 seconds
```

### `fetchWatchlist()`
```
now - lastWatchlistFetch < 30s AND cache non-empty?
   yes → return cached array immediately
   no  → sequentially call yahooFinance.quote(symbol) for all 50 symbols
           - each symbol fetched in its own try/catch; a failure for one
             symbol is logged and skipped, not fatal to the whole batch
         → if at least one stock succeeded, overwrite the cache and
           update lastWatchlistFetch
         → return the (possibly partially-updated) cache
```

### `fetchIndices()`
```
now - lastIndicesFetch < 30s AND cache present?
   yes → return cached object immediately
   no  → fetch ^NSEI and ^BSESN
         success → overwrite cache, update lastIndicesFetch, return
         failure → if a previous cache exists, return the stale cache
                    rather than erroring the request
                    (only throws if there is no cache to fall back on)
```

### `fetchQuote(symbol)`
Used by `/allHoldings` and `/allPositions` to reprice a specific held stock. **Not cached** — every call hits Yahoo Finance directly. This is intentional: holdings/positions need the freshest possible price for accurate P&L, and the number of symbols in a typical portfolio is small compared to the full 50-symbol watchlist.

## Why caching exists at all

Yahoo Finance's unofficial quote API is not designed for high-frequency polling of 50 symbols from many concurrent browser tabs. Caching for 30 seconds:
- Keeps the app well under any informal rate limits
- Means multiple users hitting `/api/stocks/watchlist` within the same 30s window share one upstream fetch instead of each triggering 50 new requests
- Trades a small amount of staleness (worst case ~30s old) for reliability

## DNS resilience

`backend/index.js` explicitly sets DNS resolvers on startup:

```js
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
```

This was added because some hosting environments' default DNS resolution was unreliable for resolving Yahoo Finance's endpoints, causing intermittent quote fetch failures. Forcing Cloudflare/Google public DNS resolves this. See [`CHALLENGES_AND_SOLUTIONS.md`](./CHALLENGES_AND_SOLUTIONS.md).

## Failure behavior summary

| Scenario | Behavior |
|---|---|
| Single symbol fails during watchlist fetch | Skipped; other 49 symbols still returned |
| Entire watchlist fetch fails (0 successes) | Old cache (even if stale) is still served — `watchlistCache` is simply not overwritten |
| Indices fetch fails, cache exists | Stale cached indices returned |
| Indices fetch fails, no cache exists | Error propagates → `500` from `/marketIndices` |
| Single holding/position reprice fails | That row falls back to its last-saved DB price (`/allHoldings`) or its raw saved document (`/allPositions`) — the whole list still returns successfully |

This "degrade gracefully, don't fail the whole request" pattern is used consistently across every market-data touchpoint.
