# Database Schema

TradeLy uses MongoDB via Mongoose. There are 5 collections. Every collection except `User` carries a `userId` reference back to `User`, which is how per-user data isolation is enforced (every query in `index.js` filters by `req.user.id`).

## Entity relationship overview

```
User (1) ──────< Fund (1)         one fund ledger per user
User (1) ──────< Holding (many)    one document per stock currently held
User (1) ──────< Position (many)   mirrors Holdings for the day view
User (1) ──────< Order (many)      append-only trade log
```

There are no `$lookup`/populate relationships actively used in the read paths — each collection is queried independently and joined client-side implicitly by the fact that they share `name` and `userId`.

---

## `User` — `schemas/UsersSchema.js`

| Field | Type | Notes |
|---|---|---|
| `username` | String | required, trimmed |
| `email` | String | required, unique, lowercase, trimmed |
| `password` | String | required — bcrypt hash, never the plaintext |
| `createdAt` | Date | default `Date.now` |

Model: `model/UserModel.js` → Mongoose model name `"User"`.

---

## `Fund` — `schemas/FundsSchema.js`

One document per user; the virtual cash/margin ledger.

| Field | Type | Default | Notes |
|---|---|---|---|
| `availableMargin` | Number | `100000` | Margin available to trade with |
| `usedMargin` | Number | `0` | Margin currently tied up in holdings |
| `availableCash` | Number | `100000` | Cash available (mirrors margin in this simplified model) |
| `openingBalance` | Number | `100000` | Starting balance shown on the Funds page |
| `payin` | Number | `0` | Not currently written to by any endpoint — always `0` in practice |
| `userId` | ObjectId → `User` | required | |

Model: `model/FundsModel.js` → Mongoose model name `"Fund"`.

**Created:** once at signup (`routes/authRoutes.js`), and lazily again by `GET /funds` or `POST /newOrder` if somehow missing (defensive fallback).

---

## `Holding` — `schemas/HoldingsSchema.js`

One document per (user, stock symbol) the user currently owns any quantity of. Deleted when quantity reaches 0.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required — NSE symbol without `.NS` suffix, e.g. `"RELIANCE"` |
| `qty` | Number | required |
| `avg` | Number | required — weighted average buy price |
| `price` | Number | default `0` — last known price (used as a fallback if a live quote fails) |
| `net` | String | default `"0%"` — not actively recalculated on write, recalculated on read in `/allHoldings` |
| `day` | String | default `"0%"` — same as above |
| `userId` | ObjectId → `User` | required |

Model: `model/HoldingsModel.js` → Mongoose model name `"Holding"`.

---

## `Position` — `schemas/PositionsSchema.js`

One document per (user, stock symbol) currently open, functionally parallel to `Holding` — the app treats every trade as a `CNC` (delivery/cash-and-carry) position. Deleted when qty drops to 0 or below.

| Field | Type | Notes |
|---|---|---|
| `product` | String | default `"CNC"` |
| `name` | String | |
| `qty` | Number | |
| `avg` | Number | |
| `price` | Number | |
| `net` | String | |
| `day` | String | |
| `isLoss` | Boolean | recomputed on read in `/allPositions` (`price < avg`) |
| `userId` | ObjectId → `User` | required |

Model: `model/PositionsModel.js` → Mongoose model name `"Position"`.

---

## `Order` — `schemas/OrdersSchema.js`

Append-only trade log. Never updated or deleted — every successful `/newOrder` call inserts exactly one document here regardless of BUY or SELL.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `qty` | Number | required |
| `price` | Number | required |
| `mode` | String | required, enum `["BUY", "SELL"]` |
| `status` | String | default `"COMPLETED"` — no other status is ever set today |
| `createdAt` | Date | default `Date.now` |
| `userId` | ObjectId → `User` | required |

Model: `model/OrdersModel.js` → Mongoose model name `"Order"`.

---

## Indexing notes

The schemas as written rely only on MongoDB's default `_id` index plus the unique index Mongoose creates for `UsersSchema.email` (`unique: true`). There are **no explicit compound indexes** on `userId` fields. For a real deployment at scale, `{ userId: 1 }` (and `{ userId: 1, name: 1 }` on `Holding`/`Position`) would be worth adding to keep the per-user queries in `index.js` fast as data grows — see [`TECHNICAL_DECISIONS.md`](./TECHNICAL_DECISIONS.md).

## Data lifecycle summary

| Action | `Fund` | `Holding` | `Position` | `Order` |
|---|---|---|---|---|
| Signup | created (₹100,000 seed) | — | — | — |
| BUY | cash/margin debited | created or averaged up | created or qty incremented | inserted (`mode: BUY`) |
| SELL | cash/margin credited | qty decremented, deleted at 0 | qty decremented, deleted at ≤0 | inserted (`mode: SELL`) |
