# Technical Decisions

Design choices made in TradeLy, and the reasoning/trade-offs behind each — written for interview and code-review context, not as a changelog.

## 1. Monolithic Express backend (no microservices)

**Decision:** one Express app (`backend/index.js`) handles auth, market data, and trading, rather than splitting into separate services.

**Why:** the project's scope — a single-team, single-database trading simulator — doesn't need independent scaling or deployment for different concerns. A monolith keeps request flow easy to trace, avoids inter-service network calls/latency, and avoids the operational overhead (service discovery, distributed tracing, multiple deploy targets) that would dominate the actual feature work at this scale.

**Trade-off:** as the app grows, `index.js` accumulates route handlers inline rather than in dedicated route/controller files (unlike `authRoutes.js`/`stockRoutes.js`, which are separated). A natural next step would be extracting `/orders`, `/funds`, `/allHoldings`, `/allPositions`, `/newOrder` into their own `routes/tradingRoutes.js` + `controllers/tradingController.js`, mirroring the pattern already used for auth and stocks.

## 2. JWT + localStorage, not sessions/cookies

**Decision:** stateless JWT stored in `localStorage`, sent as `Authorization: Bearer <token>`.

**Why:** no server-side session store needed (works cleanly with a stateless Express process and no sticky-session requirement), and it's simple to implement against a decoupled SPA + API architecture where the frontend and backend are deployed to different domains (Vercel + a separate Node host) — cookies would need extra `SameSite`/`credentials` configuration to work cross-origin.

**Trade-off:** JWTs in `localStorage` are readable by any JavaScript running on the page, which is a real XSS exposure surface (vs. an `httpOnly` cookie). There's also no refresh-token/rotation mechanism, so a stolen 7-day token is valid for the full 7 days with no way to revoke it server-side short of rotating `JWT_SECRET` (which would invalidate every user's session). This is an acceptable trade-off for a portfolio/demo project; a production fintech app would want short-lived access tokens + httpOnly refresh tokens.

## 3. In-memory caching for market data (not Redis)

**Decision:** `yahooService.js` caches watchlist/indices data in plain module-level JS variables with a 30s TTL, rather than an external cache like Redis.

**Why:** the backend runs as a single Node process; in-memory caching is zero-infrastructure, zero-latency, and trivially correct for that deployment shape. Adding Redis would introduce a new dependency and a new failure mode for a caching need that a single `Map`-like variable already solves completely at this scale.

**Trade-off:** this cache does **not** survive a process restart, and does **not** share state across multiple backend instances (if the app were horizontally scaled behind a load balancer, each instance would maintain its own cache and independently poll Yahoo Finance). Redis (or a similar shared cache) would be the right upgrade if/when the backend needs to run more than one instance.

## 4. Full page reload after placing an order

**Decision:** `BuyActionWindow`/`SellActionWindow` call `window.location.reload()` after a successful order instead of updating React state or re-fetching individual components.

**Why:** Funds, Holdings, Positions, Orders, and Summary are each independent components that fetch their own data in a `useEffect` on mount — there's no shared global store (Redux/Zustand/React Query) wiring them together. A reload is the simplest way to guarantee every affected view reflects the new state, with zero risk of stale/inconsistent partial updates across components.

**Trade-off:** it's a noticeably heavier UX than an optimistic or targeted re-fetch — the whole dashboard flashes and reloads for what is otherwise a fast API call. The natural improvement path is introducing a shared data-fetching layer (React Query/SWR) or lifting Funds/Holdings state into a context that all dashboard views subscribe to, so only the affected data re-fetches.

## 5. No database transactions on order placement

**Decision:** placing an order performs four sequential, independent Mongoose writes (Fund update, Holding upsert, Position upsert, Order insert) rather than wrapping them in a MongoDB session/transaction.

**Why:** this mirrors how the project evolved feature-by-feature rather than being designed transactionally from day one, and MongoDB transactions require a replica set (not available on every free-tier/local setup) which would add deployment friction for a project intended to be easy to run locally.

**Trade-off:** if the process crashes or a write fails partway through the sequence (e.g. the Fund updates but the Holding write throws), the user's data can end up inconsistent (money debited but no holding recorded, or vice versa). This is the most significant correctness risk in the codebase and is the top candidate for a `mongoose.startSession()`/`withTransaction()` wrap if this were hardened further — see [`CHALLENGES_AND_SOLUTIONS.md`](./CHALLENGES_AND_SOLUTIONS.md).

## 6. Live-repricing on read, not on a background job

**Decision:** `/allHoldings` and `/allPositions` fetch a fresh quote per symbol at request time rather than running a scheduled job that periodically updates stored prices.

**Why:** simpler to reason about (no cron/scheduler infrastructure needed), and guarantees the P&L shown is as fresh as possible whenever the user actually looks at the page, rather than being up to N minutes stale depending on job frequency.

**Trade-off:** if a user has many distinct holdings, `/allHoldings` makes that many sequential upstream calls per request (via `Promise.all`, so at least parallelized) — this doesn't scale indefinitely, but is entirely reasonable for a typical individual portfolio size (a handful to a few dozen symbols).

## 7. Fixed 50-symbol watchlist (not user-customizable)

**Decision:** the watchlist symbol list is a hardcoded array (duplicated in `stockRoutes.js` and `yahooService.js`) of 50 well-known NSE large-caps, rather than a per-user configurable list stored in the database.

**Why:** keeps the market-data feature simple and fast to ship — no watchlist-management UI/API/schema needed.

**Trade-off:** users can't add/remove symbols; every user sees the same universe. A `Watchlist` collection (userId → array of symbols) would be the natural extension. The duplication of the symbol array between `stockRoutes.js` and `yahooService.js` is also worth consolidating into one shared constant.

## 8. Weighted-average-cost accounting (no lot tracking)

**Decision:** repeated buys of the same symbol are merged into a single `Holding` with a recomputed weighted average price, rather than tracked as separate purchase lots.

**Why:** this matches how most retail brokerage "holdings" views (including Zerodha Kite, which this UI is modeled on) present average cost, and is far simpler to store/query than lot-level tracking.

**Trade-off:** no FIFO/LIFO-specific P&L or tax-lot reporting is possible with this model — that would require a redesign to store individual lots rather than a running average.
