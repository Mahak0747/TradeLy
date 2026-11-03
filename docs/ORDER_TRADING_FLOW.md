# Order / Trading Flow

This document walks through exactly what happens when a user places a BUY or a SELL order — the core business logic of TradeLy, all implemented in a single handler: `POST /newOrder` in `backend/index.js`.

## Entry points (frontend)

A trade can be initiated from two places, both of which open the same modal components:
- **Watchlist row hover actions** (`WatchListActions` in `dashboard/WatchList.jsx`) → `Buy`/`Sell` buttons
- Both route through `GeneralContext` (`dashboard/GeneralContext.jsx`), which holds `isBuyWindowOpen` / `isSellWindowOpen` / `selectedStock` state and renders `BuyActionWindow` / `SellActionWindow` accordingly

`BuyActionWindow` and `SellActionWindow` are pre-filled with the stock's current watchlist price but allow the user to edit both **quantity** and **price** before submitting — this is a paper-trading simulator, so there's no live order book matching; whatever price the user submits is the price the trade executes at.

## BUY flow

```
BuyActionWindow.handleBuyClick()
  ├─ client-side check: qty > 0, price > 0
  └─ POST /newOrder { name, qty, price, mode: "BUY" }
        │
        ▼ (backend/index.js)
1. Validate name/mode present, qty > 0, price > 0
2. Load req.user.id's Fund doc (create with ₹100,000 seed if missing)
3. cost = qty * price
4. if fund.availableCash < cost → 400 "Insufficient Balance"
5. fund.availableCash -= cost
   fund.availableMargin -= cost
   fund.usedMargin += cost
   fund.save()
6. Holding for this (user, name):
     exists?  → recompute weighted average:
                  avg = (oldAvg * oldQty + price * qty) / (oldQty + qty)
                  qty += qty ; price = price ; save()
     missing? → create new Holding { qty, avg: price, price, net: "0%", day: "0%" }
7. Position for this (user, name):
     exists?  → qty += qty ; price = price ; save()
     missing? → create new Position { product: "CNC", qty, avg: price, price, isLoss: false }
8. Create Order { name, qty, price, mode: "BUY", status: "COMPLETED" }
9. Respond { success: true, message: "Order Placed Successfully" }
        │
        ▼
BuyActionWindow: alert("Stock Bought Successfully")
  → generalContext.closeBuyWindow()
  → window.location.reload()
```

**Why a full page reload instead of local state updates?** Funds, Holdings, Positions, and Orders all need to reflect the trade, and those are all managed as independent `useEffect`-on-mount fetches in separate components (`Funds.jsx`, `Holdings.jsx`, `Positions.jsx`, `Orders.jsx`, `Summary.jsx`). A full reload is the simplest way to guarantee every one of them re-fetches fresh data without wiring up a shared global store. Trade-offs discussed in [`TECHNICAL_DECISIONS.md`](./TECHNICAL_DECISIONS.md).

## SELL flow

```
SellActionWindow.handleSellClick()
  ├─ client-side check: qty > 0, price > 0
  └─ POST /newOrder { name, qty, price, mode: "SELL" }
        │
        ▼ (backend/index.js)
1. Validate name/mode present, qty > 0, price > 0
2. Load req.user.id's Fund doc
3. Find Holding for (user, name) → 400 "No Holdings Found" if none
4. if holding.qty < qty → 400 "Not enough quantity"
5. holding.qty -= qty
     qty reaches 0? → delete the Holding document
     else           → save()
6. Position for (user, name), if it exists:
     position.qty -= qty
     qty <= 0? → delete the Position document
     else      → save()
7. amount = qty * price
   fund.availableCash += amount
   fund.availableMargin += amount
   fund.usedMargin = max(0, fund.usedMargin - amount)
   fund.save()
8. Create Order { name, qty, price, mode: "SELL", status: "COMPLETED" }
9. Respond { success: true, message: "Order Placed Successfully" }
        │
        ▼
SellActionWindow: alert("Stock Sold Successfully")
  → generalContext.closeSellWindow()
  → window.location.reload()
```

## Notable business rules / edge cases

- **No short selling** — a SELL is rejected outright if the user holds nothing (or not enough) of that symbol. There is no margin/derivatives short-selling path.
- **Average cost accounting** — repeated BUYs of the same symbol are averaged (standard weighted-average-cost accounting), not tracked as separate lots (no FIFO/LIFO lot tracking).
- **Positions vs Holdings** — every trade updates both `Holding` and `Position` in lockstep; in this app they always represent the same underlying quantity (all trades are `CNC`/delivery). There is currently no intraday-vs-delivery distinction.
- **Order record is always written** — even though only Fund/Holding/Position differ between BUY and SELL, an `Order` document is inserted on every successful call, giving a complete, append-only audit trail regardless of trade direction.
- **No transactional guarantee across the 4 writes** — the Fund update, Holding upsert, Position upsert, and Order insert are four separate, sequential Mongoose operations, not wrapped in a MongoDB multi-document transaction. See [`CHALLENGES_AND_SOLUTIONS.md`](./CHALLENGES_AND_SOLUTIONS.md) for the reasoning and the risk this carries.
- **No order cancellation or partial fills** — every order that passes validation executes immediately and completely; there's no pending/open order state.

## Reading holdings/positions after a trade

`GET /allHoldings` and `GET /allPositions` don't just return the saved documents — they re-fetch a **live quote** for each symbol at request time (via `services/yahooService.js#fetchQuote`) and compute `curValue`, `profit`, `net`, `day` on the fly. This means P&L shown on those pages is always current as of the last request, not stale data from the moment of purchase. See [`MARKET_DATA_FLOW.md`](./MARKET_DATA_FLOW.md).
