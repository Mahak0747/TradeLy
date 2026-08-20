# Architecture

## 1. High-level system design

TradeLy is a classic two-tier MERN application: a React SPA talking to a single Express API, backed by MongoDB and one external data provider (Yahoo Finance).

```
┌────────────┐      HTTPS/JSON         ┌──────────────────────┐        Mongoose      ┌────────────┐
│  React SPA │ ─────────────────────▶ │  Express API server   │────────────────────▶│   MongoDB  │
│  (Vite)    │◀─────────────────────  │  (index.js + routes)  │◀────────────────────│            │
└────────────┘                         └──────────┬───────────┘                      └────────────┘
                                                  │
                                                  │ yahoo-finance2
                                                  ▼
                                       ┌───────────────────────┐
                                       │  Yahoo Finance API    │
                                       │  (live NSE quotes)    │
                                       └───────────────────────┘
```

There is no separate API gateway, message queue, or microservice split — the entire backend is one Express process (`backend/index.js`) that mounts two router modules and defines the rest of the trading endpoints inline.

## 2. Frontend structure

`frontend/src/main.jsx` is the single router entry point. It renders a `Navbar`/`Footer` shell for every route **except** anything under `/dashboard`, and defines:

- Public routes: `/`, `/signup`, `/login`, `/about`, `/product`, `/pricing`, `/support`
- Protected route: `/dashboard/*`, wrapped in two layers:
  - `AuthLoader` — reads a `?token=` query param (used after redirect-based login) and persists it to `localStorage` before rendering children
  - `ProtectedRoute` — reads the token from `localStorage`; redirects to `/login` if absent

Inside the dashboard shell (`dashboard/Home.jsx` → `TopBar` + `Dashboard`):
- `TopBar` polls `/marketIndices` every 15s and renders the `Menu` (nav + profile)
- `Dashboard` renders a persistent `WatchList` sidebar (wrapped in `GeneralContextProvider`, which owns Buy/Sell modal state) plus a routed `content` area for `Summary` (`/dashboard`), `Orders`, `Holdings`, `Positions`, `Funds`

All authenticated API calls go through a single shared Axios instance (`frontend/src/api.js`) that:
- Sets `baseURL` from `VITE_API_BASE_URL`
- Attaches `Authorization: Bearer <token>` on every request via a request interceptor, reading the token from `localStorage`

## 3. Backend structure

```
backend/
├── index.js                     # app bootstrap + trading endpoints (orders, funds, holdings, positions, market indices)
├── routes/
│   ├── authRoutes.js            # POST /api/auth/signup, POST /api/auth/login
│   └── stockRoutes.js           # GET  /api/stocks/watchlist
├── middleware/
│   └── authMiddleware.js        # verifies JWT, attaches req.user
├── model/                       # Mongoose models (thin wrappers around schemas)
├── schemas/                     # Mongoose schema definitions
└── services/
    └── yahooService.js          # Yahoo Finance integration + in-memory caching
```

### Middleware chain

```
Request
  → cors()
  → body-parser (JSON)
  → route matcher (/api/auth, /api/stocks, or an inline route in index.js)
  → [authMiddleware]  (only on routes that require a logged-in user)
  → route handler (queries Mongoose models, optionally calls yahooService)
  → JSON response
```

### Data layer

Five Mongoose collections, all scoped to a `userId` foreign key except `User` itself:

- `User` — credentials
- `Fund` — one document per user, virtual cash/margin ledger
- `Holding` — one document per (user, stock) the user currently owns
- `Position` — mirrors Holdings for the "day" view (all positions are `CNC`/delivery-style in this app)
- `Order` — append-only trade history

Full schema field list: [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).

### External data

`services/yahooService.js` wraps the `yahoo-finance2` npm package and exposes three functions:
- `fetchWatchlist()` — fetches quotes for a fixed list of 50 NSE symbols, cached 30s
- `fetchIndices()` — fetches `^NSEI` (NIFTY 50) and `^BSESN` (SENSEX), cached 30s
- `fetchQuote(symbol)` — fetches a single symbol's quote on demand (used to reprice Holdings/Positions), **not cached**

This is the only outbound integration in the system — there is no payment gateway, no broker API, no SMS/email provider.

## 4. Request lifecycle example (place a BUY order)

1. User clicks **Buy** in `WatchListActions` → `GeneralContext.openBuyWindow(stock)` opens `BuyActionWindow`
2. User confirms qty/price → `POST /newOrder` with `{ name, qty, price, mode: "BUY" }` and JWT in the header
3. `authMiddleware` verifies the JWT, sets `req.user.id`
4. Handler in `backend/index.js`:
   - Validates qty/price
   - Loads (or lazily creates) the user's `Fund` document
   - Checks `availableCash >= qty * price`
   - Debits `availableCash`/`availableMargin`, credits `usedMargin`
   - Upserts a `Holding` (recomputing weighted average cost if one exists)
   - Upserts a `Position`
   - Appends an `Order` record with `status: "COMPLETED"`
5. Response `{ success: true, message: "Order Placed Successfully" }`
6. Frontend shows an alert, closes the modal, and does a full page reload — the dashboard re-fetches Holdings/Positions/Funds/Orders from scratch on mount

Full detail: [`ORDER_TRADING_FLOW.md`](./ORDER_TRADING_FLOW.md).