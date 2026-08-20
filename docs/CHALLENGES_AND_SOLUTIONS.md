# Challenges and Solutions

Concrete engineering problems visible in the codebase, and how they were addressed (or, where relevant, flagged as still-open) — useful both as project history and as interview talking points.

## 1. Yahoo Finance rate limiting / reliability on a 50-symbol watchlist

**Problem:** fetching live quotes for 50 symbols on every watchlist request — potentially from many browser tabs polling every 30 seconds — risks hitting Yahoo Finance's informal rate limits and causing failures across the whole watchlist.

**Solution:** `services/yahooService.js` implements a 30-second in-memory cache shared across all requests to the process (`fetchWatchlist`, `fetchIndices`). Within any 30s window, only the first request triggers real upstream calls; every other request (from any user) is served the cached array. This cuts upstream call volume dramatically while keeping data close to real-time.

**Further mitigation:** each symbol is fetched in its own `try/catch` inside the loop, so one failing symbol doesn't take down the other 49 — see point 2.

## 2. Partial failure handling for batch quote fetches

**Problem:** a single symbol failing (delisted, temporarily unavailable, malformed response) shouldn't break the entire watchlist or holdings view.

**Solution:** every per-symbol fetch is wrapped individually:
- In `fetchWatchlist()`, a failed symbol is logged and simply skipped — the returned array just has 49 entries instead of 50 that cycle.
- In `/allHoldings` and `/allPositions` (`backend/index.js`), each holding/position's reprice is wrapped in its own `try/catch` inside the `Promise.all`, falling back to the last-saved DB price rather than rejecting the whole request.

This "degrade gracefully" pattern is applied consistently everywhere the app talks to Yahoo Finance — see [`MARKET_DATA_FLOW.md`](./MARKET_DATA_FLOW.md).

## 3. DNS resolution failures for Yahoo Finance in some hosting environments

**Problem:** some Node hosting environments' default DNS resolver was unreliable when resolving Yahoo Finance's API hosts, producing intermittent `ENOTFOUND`/timeout errors that had nothing to do with Yahoo Finance itself being down.

**Solution:** `backend/index.js` explicitly forces Cloudflare and Google public DNS at process startup:

```js
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
```

This bypasses whatever the host's default resolver does and makes quote fetching noticeably more reliable in production.

## 4. Insufficient balance / overselling validation

**Problem:** without server-side checks, a user could submit a BUY that exceeds their available cash, or a SELL for more shares than they hold — both of which would corrupt the fund ledger and holdings data (e.g. negative quantities, negative cash).

**Solution:** `POST /newOrder` validates before any writes happen:
- BUY: rejects with `400 "Insufficient Balance"` if `fund.availableCash < qty * price`
- SELL: rejects with `400 "No Holdings Found"` if there's no holding at all, and `400 "Not enough quantity"` if the held quantity is less than the sell quantity
- Both: reject `qty <= 0` and `price <= 0` with dedicated messages, both client-side (immediate UX feedback in the Buy/Sell modals) and server-side (source of truth, since client-side checks can be bypassed)

## 5. Keeping multiple dashboard views consistent after a trade

**Problem:** Funds, Holdings, Positions, Orders, and the dashboard Summary are all independent components with their own data fetching — after placing an order, all five need to reflect the new state, but they share no common store.

**Solution (current):** a full `window.location.reload()` after a successful order guarantees every view re-fetches fresh data from the API, trading UX polish for correctness-by-construction. See [`TECHNICAL_DECISIONS.md`](./TECHNICAL_DECISIONS.md) for the trade-off discussion and the suggested improvement path (shared data layer / global state).

## 6. Duplicated auth logic between `authRoutes.js` and `authController.js`

**Observation:** the backend contains two separate implementations of signup/login — one inline in `routes/authRoutes.js` (the one actually mounted and used by the app, which also seeds a default `Fund`), and a near-identical, unused implementation in `controllers/authController.js` that isn't imported by any route.

**Why this is flagged rather than silently left undocumented:** this is exactly the kind of drift that happens when a controller layer is scaffolded early (`authController.js`) and then routing logic is written inline instead (`authRoutes.js`) without going back to remove the now-redundant file. It's harmless today (dead code, not a bug) but worth knowing about — a future refactor to fully adopt the controller pattern (already used correctly for `stockRoutes.js` → `yahooService.js`) would consolidate this into one source of truth. **No code was changed as part of this documentation task**, per the project's explicit "preserve existing functionality" requirement.

## 7. No database transactions across the 4 writes in `/newOrder`

**Open risk, not yet solved:** a BUY/SELL performs a Fund update, a Holding upsert, a Position upsert, and an Order insert as four sequential, independent MongoDB writes. If the process crashes or a later write throws after an earlier one has already committed, the user's Fund/Holding/Position/Order data can end up inconsistent.

**Why it hasn't been fixed:** MongoDB multi-document transactions require a replica set, which isn't available on every free-tier or local MongoDB setup — adding a hard `mongoose.startSession()` requirement would raise the bar for anyone trying to run this project locally with a single standalone `mongod`. This is a deliberate, documented trade-off for a project at this stage rather than an oversight — see [`TECHNICAL_DECISIONS.md`](./TECHNICAL_DECISIONS.md) point 5 for the fuller discussion and the upgrade path.

## 8. Missing explicit indexes on `userId`

**Open risk, not yet solved:** none of the `Fund`/`Holding`/`Position`/`Order` schemas declare an explicit index on `userId`, even though every read in `backend/index.js` filters by it (`{ userId: req.user.id }`). At current (demo-scale) data volumes this is invisible; at real scale it would mean full collection scans on every dashboard load. Adding `{ userId: 1 }` (and `{ userId: 1, name: 1 }` on `Holding`/`Position`) is a low-risk, high-value addition — flagged here rather than applied, since this task's scope is documentation only.
