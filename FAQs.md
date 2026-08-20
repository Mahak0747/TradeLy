# FAQs

---

## Project overview / elevator pitch

**Q: Walk me through what TradeLy is in 30 seconds.**

A: TradeLy is a full-stack paper-trading platform styled after Zerodha Kite. Users sign up, get a virtual ₹100,000 balance, and can buy/sell real NSE-listed stocks at live market prices without any real money changing hands. It's a MERN app — React/Vite frontend, Express/Node backend, MongoDB for persistence, and Yahoo Finance for live quotes. It demonstrates full-stack CRUD, JWT auth, third-party API integration with caching, and financial-domain business logic (fund/holding/position/order accounting).

**Q: What's real and what's simulated?**

A: The market data is real — live prices for 50 NSE stocks and the NIFTY/SENSEX indices, fetched from Yahoo Finance. The trading itself is entirely simulated: no broker, no payment gateway, no real money. Orders are recorded and settle instantly against a virtual fund balance stored in MongoDB.

---

## Architecture

**Q: Describe the system architecture.**

A: Two-tier: a React SPA (Vite, deployed on Vercel) talks over HTTPS/JSON to a single Express API process, which talks to MongoDB via Mongoose and to Yahoo Finance via the `yahoo-finance2` package. No microservices, no message queue — deliberately, given the project's scope (see `docs/TECHNICAL_DECISIONS.md` §1). Full diagram: `docs/ARCHITECTURE.md`.

**Q: Why didn't you split the backend into microservices (e.g. separate auth service, trading service)?**

A: At this scale, a monolith is the right call — it keeps request tracing simple, avoids inter-service network hops, and avoids the operational overhead (service discovery, multiple deploys, distributed logging) that would dwarf the actual feature work for a single-team, single-database app. I'd reconsider that if the trading logic needed independent scaling from the read-heavy market-data endpoints, or if a real payments/settlement system got added.

**Q: What would you change about the current architecture if you kept building this?**

A: Two things I'd prioritize: (1) pull the trading endpoints (`/orders`, `/funds`, `/allHoldings`, `/allPositions`, `/newOrder`) out of `index.js` into their own `routes/` + `controllers/` files, matching the pattern already used for auth and stocks; (2) wrap the four writes in `/newOrder` in a MongoDB transaction so a partial failure can't leave Fund/Holding/Position/Order data inconsistent. Both are covered in `docs/CHALLENGES_AND_SOLUTIONS.md`.

---

## Authentication

**Q: How does authentication work end-to-end?**

A: Signup hashes the password with bcrypt (10 rounds) and stores the user, plus seeds a default Fund document. Login verifies the password with `bcrypt.compare`, then issues a JWT (`jsonwebtoken`, `{ id, email }` payload, 7-day expiry) signed with a server-side `JWT_SECRET`. The frontend stores that token in `localStorage` and an Axios request interceptor (`frontend/src/api.js`) attaches it as `Authorization: Bearer <token>` on every request. On the backend, `authMiddleware` (`backend/middleware/authMiddleware.js`) verifies the token on protected routes and attaches `req.user`. Full flow: `docs/AUTH_FLOW.md`.

**Q: Why JWT + localStorage instead of sessions/cookies?**

A: Stateless — no server-side session store needed, which fits a stateless Express process. It also avoids cross-origin cookie configuration friction since the frontend (Vercel) and backend are deployed to different domains. The trade-off is XSS exposure (any script on the page can read `localStorage`) and no way to revoke a single token early — a production fintech app would likely use short-lived access tokens plus httpOnly refresh tokens instead. This exact trade-off is documented in `docs/TECHNICAL_DECISIONS.md` §2.

**Q: How is per-user data isolation enforced?**

A: Every trading collection (`Fund`, `Holding`, `Position`, `Order`) has a `userId` field, and every query in `backend/index.js` filters by `req.user.id` (taken from the verified JWT, not from client-supplied input) — e.g. `OrdersModel.find({ userId: req.user.id })`. A user can never query another user's data because the filter comes from the trusted, server-verified token payload, not the request body.

**Q: Is there anything imperfect about the auth implementation you'd flag in a code review?**

A: Yes — there are actually two implementations of signup/login: the one wired into the app (`routes/authRoutes.js`) and an unused, near-duplicate one in `controllers/authController.js` that isn't imported anywhere. It's dead code, not a bug, but it's exactly the kind of drift I'd clean up — consolidate on one, matching the controller pattern used correctly elsewhere (`stockRoutes.js` → `yahooService.js`). See `docs/CHALLENGES_AND_SOLUTIONS.md` §6.

---

## Order placement / trading logic

**Q: Walk me through what happens when a user clicks "Buy".**

A: `BuyActionWindow` does client-side validation (qty/price > 0), then `POST /newOrder` with `{ name, qty, price, mode: "BUY" }`. On the backend: validate again server-side, load (or create) the user's Fund, check `availableCash >= qty*price`, debit cash/margin and credit `usedMargin`, then upsert a `Holding` (recomputing a weighted average cost if one already exists for that symbol) and a `Position`, and finally insert an `Order` record. The frontend then reloads the page so every dashboard view re-fetches fresh data. Full walkthrough: `docs/ORDER_TRADING_FLOW.md`.

**Q: How do you calculate average cost when someone buys the same stock twice?**

A: Weighted average: `newAvg = (oldAvg * oldQty + price * qty) / (oldQty + qty)`. This mirrors how real brokerage "holdings" views (including Zerodha Kite, the UI's inspiration) present average cost — no FIFO/LIFO lot tracking, just a running weighted average per symbol.

**Q: What stops a user from selling stock they don't own, or buying more than they can afford?**

A: Server-side checks in `/newOrder`, which are the real source of truth (client-side checks are just UX — they can be bypassed). BUY checks `fund.availableCash < qty*price` → `400 Insufficient Balance`. SELL checks for an existing Holding at all (`400 No Holdings Found`) and that its quantity covers the sell (`400 Not enough quantity`).

**Q: Why does the frontend do a full page reload instead of updating state locally after a trade?**

A: Funds, Holdings, Positions, Orders, and the dashboard Summary are five separate components, each independently fetching its own data on mount — there's no shared store (Redux/React Query) wiring them together. A reload guarantees every one of them reflects the new state with zero risk of partial/stale updates, at the cost of a heavier UX than a targeted re-fetch. I'd fix this by introducing a shared data-fetching layer (React Query is the natural choice) so only the affected queries invalidate and re-fetch. Discussed in `docs/TECHNICAL_DECISIONS.md` §4.

**Q: Is order placement transactionally safe?**

A: Not currently — it's four sequential Mongoose writes (Fund, Holding, Position, Order), not wrapped in a MongoDB session transaction. If the process crashed mid-sequence, data could end up inconsistent. I didn't add a transaction because MongoDB multi-document transactions require a replica set, which isn't guaranteed on every local/free-tier setup — but it's the top item I'd address for production hardening (`mongoose.startSession()` / `withTransaction()`). This is a known, documented trade-off, not an oversight — see `docs/CHALLENGES_AND_SOLUTIONS.md` §7.

---

## Market data integration

**Q: Where does the price data come from, and how "live" is it?**

A: `yahoo-finance2`, an npm wrapper around Yahoo Finance's quote API, fetched server-side in `backend/services/yahooService.js`. The watchlist and market indices are cached in-memory for 30 seconds to avoid hammering the upstream API; holdings/positions reprice with a fresh, uncached quote on every request since P&L accuracy matters more there than avoiding an extra API call.

**Q: Why cache in-memory instead of something like Redis?**

A: The backend runs as a single Node process, so an in-memory cache (plain module-level variables) is zero-infrastructure and correct for that deployment shape. It wouldn't survive a restart or scale across multiple instances — Redis would be the right call if the backend needed to run horizontally scaled behind a load balancer. See `docs/TECHNICAL_DECISIONS.md` §3.

**Q: What happens if Yahoo Finance is slow or a symbol fails to resolve?**

A: The system degrades gracefully rather than failing outright, consistently in every place it talks to Yahoo Finance: a single failed symbol in the 50-stock watchlist is skipped, not fatal to the batch; if the entire watchlist fetch fails, the previous cached data is still served; if indices fail but a cache exists, the stale cache is returned instead of erroring; and if a specific holding/position fails to reprice, it falls back to its last-saved database price rather than breaking the whole response. Details: `docs/MARKET_DATA_FLOW.md`.

**Q: You explicitly set custom DNS servers in `index.js` — why?**

A: Some hosting environments' default DNS resolver was unreliable resolving Yahoo Finance's hosts, causing intermittent fetch failures unrelated to Yahoo Finance actually being down. Forcing `dns.setServers(["1.1.1.1", "8.8.8.8"])` (Cloudflare/Google public DNS) at startup fixed that reliability issue in production. `docs/CHALLENGES_AND_SOLUTIONS.md` §3.

---

## Database design

**Q: Walk me through the schema.**

A: Five Mongoose collections: `User` (credentials), `Fund` (one per user — the virtual cash ledger: availableMargin, usedMargin, availableCash, openingBalance), `Holding` (one per stock currently owned, with weighted average cost), `Position` (parallels Holdings for the day-view, always `CNC`/delivery-style in this app), and `Order` (append-only trade log). Every collection but `User` carries a `userId` foreign key. Full field list: `docs/DATABASE_SCHEMA.md`.

**Q: Why do Holdings and Positions exist as separate collections if they always mirror each other in this app?**

A: They model two conceptually different real-world views — Holdings represent what you own overall (delivery), Positions represent your trading activity for the current context (which, in a full-featured broker, would distinguish intraday vs. delivery trades, or futures/options positions). This app only implements the delivery (`CNC`) case, so today they move in lockstep — but keeping them separate leaves room to add intraday-specific position logic later without redesigning the Holdings model.

**Q: Any schema/indexing gaps you'd flag?**

A: No explicit index on `userId`, even though every query filters by it. Invisible at demo scale, but would mean full collection scans at real scale. I'd add `{ userId: 1 }` (and a compound `{ userId: 1, name: 1 }` on Holding/Position) as a low-risk, high-value fix. `docs/CHALLENGES_AND_SOLUTIONS.md` §8.

---

## Deployment

**Q: How is this deployed?**

A: Frontend on Vercel (Vite build, SPA rewrite rule in `vercel.json` so client-side routes survive a hard refresh); backend on a plain Node host, started with `npm start`. MongoDB is a standard connection string (`MONGO_URL`), most naturally MongoDB Atlas. `docs/DEPLOYMENT.md` has the full checklist.

**Q: What's `VITE_API_BASE_URL` and why does it need to be set before building, not after?**

A: Vite inlines `import.meta.env.VITE_*` variables into the built JS bundle at build time, not read at runtime — so changing the backend URL in production requires triggering a new Vercel build, not just an app restart.

---

## Testing / code quality (be ready to discuss honestly)

**Q: What's the test coverage like?**

A: There's no automated test suite in the project currently — that's a gap I'd address next: backend integration tests around `/newOrder`'s business rules (insufficient balance, overselling, average-cost math) would be highest-value first, followed by frontend component tests for the Buy/Sell modals. I chose to prioritize getting a complete, working feature set and documentation before test infrastructure, which is a defensible sequencing for a solo portfolio project but not one I'd repeat on a team project.

**Q: If you had one more week, what would you build?**

A: In priority order: (1) wrap `/newOrder`'s writes in a MongoDB transaction, (2) add `userId` indexes, (3) replace the full-page-reload pattern with React Query so the dashboard updates without a hard reload, (4) add a backend integration test suite around the trading logic, (5) consolidate the duplicate auth controller code.

---

## Quick code-reference map

| Topic | File(s) |
|---|---|
| Signup/login | `backend/routes/authRoutes.js` |
| JWT verification | `backend/middleware/authMiddleware.js` |
| Order placement logic | `backend/index.js` (`POST /newOrder`) |
| Live quotes + caching | `backend/services/yahooService.js` |
| Schemas | `backend/schemas/*.js` |
| Axios + auth header injection | `frontend/src/api.js` |
| Route guarding | `frontend/src/landing_page/ProtectedRoute.jsx`, `frontend/src/dashboard/AuthLoader.jsx` |
| Buy/Sell modals | `frontend/src/dashboard/BuyActionWindow.jsx`, `SellActionWindow.jsx` |
| Shared modal state | `frontend/src/dashboard/GeneralContext.jsx` |
| Watchlist polling | `frontend/src/dashboard/WatchList.jsx` |
| Market indices polling | `frontend/src/dashboard/TopBar.jsx` |
