# API Documentation

Base URL: `VITE_API_BASE_URL` (frontend env) → points at the deployed/local backend, e.g. `http://localhost:3002`.

All endpoints return JSON. Endpoints marked 🔒 require an `Authorization: Bearer <JWT>` header (validated by `authMiddleware`).

---

## Auth

### `POST /api/auth/signup`
Creates a new user and seeds a default `Fund` document for them.

**Body**
```json
{
  "username": "mahak",
  "email": "mahak@example.com",
  "password": "plaintext-password"
}
```

**Success — 201**
```json
{ "message": "Signup successful" }
```

**Errors**
- `400` — `{ "message": "User already exists" }` (email already registered)
- `500` — `{ "error": "<message>" }`

**Side effects:** creates a `User` document (password hashed with bcrypt, 10 rounds) and a `Fund` document with `availableMargin`, `availableCash`, `openingBalance` all set to `100000` and `usedMargin`/`payin` set to `0`.

---

### `POST /api/auth/login`
Verifies credentials and issues a JWT.

**Body**
```json
{ "email": "mahak@example.com", "password": "plaintext-password" }
```

**Success — 200**
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": { "id": "...", "username": "mahak", "email": "mahak@example.com" }
}
```

**Errors**
- `404` — `{ "message": "User not found" }`
- `401` — `{ "message": "Invalid password" }`
- `500` — `{ "error": "<message>" }`

**Token:** signed with `JWT_SECRET`, payload `{ id, email }`, expires in `7d`.

---

## Market data

### `GET /api/stocks/watchlist`
Returns live quotes for a fixed universe of 50 NSE large-cap symbols. Not authenticated.

**Success — 200**
```json
[
  { "name": "RELIANCE", "price": 2945.6, "percent": "1.24%", "isDown": false },
  { "name": "TCS", "price": 4100.15, "percent": "-0.32%", "isDown": true }
]
```

Served from a 30-second in-memory cache — see [`MARKET_DATA_FLOW.md`](./MARKET_DATA_FLOW.md).

**Error — 500** `{ "error": "<message>" }`

---

### `GET /marketIndices`
Returns live NIFTY 50 and SENSEX index values. Not authenticated.

**Success — 200**
```json
{
  "nifty":  { "price": 24812.35, "change": 112.4,  "percent": 0.46 },
  "sensex": { "price": 81523.10, "change": -45.2, "percent": -0.06 }
}
```

Served from a 30-second in-memory cache. If Yahoo Finance fails and a previous cached value exists, the stale cached value is returned rather than erroring.

**Error — 500** `{ "error": "<message>" }` (only if there is no cached value to fall back on)

---

## Trading (all 🔒 authenticated)

### `GET /orders` 🔒
Returns the current user's full order history, most recent first.

**Success — 200**
```json
[
  {
    "_id": "...",
    "userId": "...",
    "name": "RELIANCE",
    "qty": 5,
    "price": 2945.6,
    "mode": "BUY",
    "status": "COMPLETED",
    "createdAt": "2026-08-15T10:12:00.000Z"
  }
]
```

---

### `GET /funds` 🔒
Returns the current user's fund ledger. Lazily creates one (seeded with ₹100,000) if it doesn't exist yet.

**Success — 200**
```json
{
  "_id": "...",
  "userId": "...",
  "availableMargin": 85271.4,
  "usedMargin": 14728.6,
  "availableCash": 85271.4,
  "openingBalance": 100000,
  "payin": 0
}
```

---

### `GET /allHoldings` 🔒
Returns the current user's holdings, each repriced against a **live** quote fetched at request time.

**Success — 200**
```json
[
  {
    "name": "RELIANCE",
    "qty": 5,
    "avg": 2900.0,
    "price": 2945.6,
    "curValue": 14728.0,
    "profit": 228.0,
    "net": "1.24%",
    "day": "+1.24%"
  }
]
```

If the live quote fetch for a symbol fails, that holding falls back to its last-saved `price` (from the database) with `net`/`day` reported as `"0%"`, rather than failing the whole response.

---

### `GET /allPositions` 🔒
Returns the current user's open positions, similarly repriced with a live quote.

**Success — 200**
```json
[
  {
    "_id": "...",
    "product": "CNC",
    "name": "RELIANCE",
    "qty": 5,
    "avg": 2900.0,
    "price": 2945.6,
    "net": "1.24%",
    "day": "+1.24%",
    "isLoss": false,
    "userId": "..."
  }
]
```

If the live quote fetch fails, the raw saved document is returned unchanged.

---

### `POST /newOrder` 🔒
Places a simulated BUY or SELL order. This is the single most important endpoint — see [`ORDER_TRADING_FLOW.md`](./ORDER_TRADING_FLOW.md) for the full step-by-step behavior.

**Body**
```json
{ "name": "RELIANCE", "qty": 5, "price": 2945.6, "mode": "BUY" }
```
`mode` must be `"BUY"` or `"SELL"`.

**Success — 200**
```json
{ "success": true, "message": "Order Placed Successfully" }
```

**Validation errors — 400**
- `{ "message": "Invalid request" }` — missing `name` or `mode`
- `{ "message": "Quantity must be greater than 0" }`
- `{ "message": "Price must be greater than 0" }`
- `{ "message": "Missing required fields" }`
- `{ "message": "Insufficient Balance" }` — BUY exceeds available cash
- `{ "message": "No Holdings Found" }` — SELL with nothing held
- `{ "message": "Not enough quantity" }` — SELL qty exceeds held qty

**Error — 500** `{ "error": "<message>" }`

---

## Error format summary

| Status | Meaning | Body shape |
|---|---|---|
| 400 | Bad request / business-rule violation | `{ "message": "..." }` |
| 401 | Missing/invalid/expired JWT, or wrong password | `{ "message": "..." }` |
| 404 | Resource not found (e.g. user on login) | `{ "message": "..." }` |
| 500 | Unhandled server/database/upstream error | `{ "error": "..." }` |