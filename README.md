# TradeLy

> A full-stack, Zerodha-Kite-style paper trading platform built on the MERN stack — real NSE market data, a virtual funds ledger, and a live order/holdings/positions engine, without touching real money.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Unspecified-lightgrey)](#license)

**Live app:** [stocktrading-flame.vercel.app](https://stocktrading-flame.vercel.app)
**Source:** [github.com/Mahak0747/TradeLy](https://github.com/Mahak0747/TradeLy)

---

## 📖 Overview

TradeLy is a simulated stock trading web application modeled on the look and workflow of Zerodha Kite. It lets a signed-up user browse a live NSE watchlist, view live NIFTY 50 / SENSEX index data, place simulated BUY/SELL orders against a virtual cash balance, and track the results across **Holdings**, **Positions**, **Orders**, and **Funds** — all backed by a real Node.js/Express API and MongoDB database.

There is **no real brokerage, payment gateway, or money movement involved anywhere in this project.** All prices are real (fetched live from Yahoo Finance for NSE-listed symbols); all trades are paper trades settled against a virtual fund balance seeded per user.

This repository contains:
- A **React (Vite) frontend** — public marketing site + authenticated trading dashboard
- A **Node/Express backend** — REST API, JWT auth, MongoDB persistence, live market-data proxy

📚 Full engineering documentation lives in [`docs/`](./docs) — architecture, API reference, database schema, auth/order/market-data flows, deployment notes, technical decisions, and challenges faced. Interview-style Q&A is in [`INTERVIEW_PREP.md`](./INTERVIEW_PREP.md).

---

## ✨ Features

### Public site
- Landing page, About, Products, Pricing, and Support pages (React Router)
- Signup / Login forms backed by real API calls

### Trading dashboard (authenticated)
- **Live watchlist** of 50 NSE large-cap stocks with price, % change, and a distribution doughnut chart, auto-refreshed every 30s
- **Live market indices** bar (NIFTY 50, SENSEX) in the top bar, auto-refreshed every 15s
- **Buy / Sell order windows** with client-side quantity/price validation
- **Order placement engine** that atomically updates Funds, Holdings, Positions, and the Orders ledger
- **Holdings** page — instrument-wise average cost, LTP, current value, P&L, and a bar chart, all computed from a fresh live quote at request time
- **Positions** page — live P&L per open position
- **Orders** page — full order history per user, most recent first
- **Funds** page — available margin, used margin, available cash, opening balance
- **Summary (dashboard home)** — quick snapshot of margin available and portfolio P&L

### Platform
- JWT-based authentication with bcrypt password hashing
- Per-user data isolation on every trading collection (`userId` foreign key + auth middleware)
- 30-second in-memory caching on all Yahoo Finance calls to stay under rate limits
- Route-level auth guarding on the frontend (`ProtectedRoute`) and backend (`authMiddleware`)

---

## 🏗 Architecture

```
                     ┌────────────────────┐
                     │   Browser (User)    │
                     └─────────┬───────────┘
                               │ HTTPS
                               ▼
                 ┌──────────────────────────┐
                 │  React Frontend (Vite)    │
                 │  Landing site + Dashboard │
                 │  Deployed on Vercel       │
                 └─────────┬─────────────────┘
                           │ Axios (JWT in Authorization header)
                           ▼
                 ┌──────────────────────────┐
                 │  Express.js Backend API   │
                 │  Deployed on Render/Node  │
                 ├──────────────────────────┤
                 │ /api/auth   (signup/login)│
                 │ /api/stocks (watchlist)   │
                 │ /orders /funds            │
                 │ /allHoldings /allPositions│
                 │ /newOrder /marketIndices  │
                 └──────┬───────────┬────────┘
                        │           │
                        ▼           ▼
              ┌──────────────┐  ┌────────────────────┐
              │  MongoDB      │  │  Yahoo Finance API   │
              │  (Mongoose)   │  │  (yahoo-finance2)    │
              │  Users        │  │  Live NSE quotes +   │
              │  Funds        │  │  NIFTY/SENSEX index  │
              │  Holdings     │  │  30s in-memory cache  │
              │  Positions    │  └────────────────────┘
              │  Orders       │
              └──────────────┘
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full request-flow breakdown, and the dedicated flow docs below.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, Axios, Chart.js / react-chartjs-2, MUI (icons + components) |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB |
| Auth | JWT (`jsonwebtoken`), `bcrypt` password hashing |
| Market data | `yahoo-finance2` (live NSE quotes, NIFTY/SENSEX indices) |
| Deployment | Frontend → Vercel · Backend → Node host (Render-style) |

---

## 📂 Project Structure

```
TradeLy/
├── backend/
│   ├── controllers/         # authController.js
│   ├── middleware/          # authMiddleware.js (JWT verification)
│   ├── model/                # Mongoose models (Funds, Holdings, Orders, Positions, User)
│   ├── schemas/              # Mongoose schemas backing each model
│   ├── routes/                # authRoutes.js, stockRoutes.js
│   ├── services/              # yahooService.js (live quotes, caching)
│   ├── index.js                # Express app entry point + trading endpoints
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── landing_page/      # Public marketing site (home, about, pricing, support, products)
│   │   ├── dashboard/          # Authenticated trading dashboard (Watchlist, Orders, Holdings, ...)
│   │   ├── context/             # AuthContext (token state)
│   │   ├── api.js                # Axios instance with JWT interceptor
│   │   ├── Login.jsx / Signup.jsx
│   │   └── main.jsx               # Router + route guards
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── docs/                        # Engineering documentation (this task's deliverable)
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── AUTH_FLOW.md
│   ├── ORDER_TRADING_FLOW.md
│   ├── MARKET_DATA_FLOW.md
│   ├── DEPLOYMENT.md
│   ├── TECHNICAL_DECISIONS.md
│   ├── CHALLENGES_AND_SOLUTIONS.md
│   ├── ENV_VARIABLES.md
│   └── screenshots/            # See "Screenshots" section below
│
├── INTERVIEW_PREP.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or MongoDB Atlas)

### 1. Clone

```bash
git clone https://github.com/Mahak0747/TradeLy.git
cd TradeLy
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URL and JWT_SECRET
npm start                # runs `nodemon index.js`
```

Backend runs on `http://localhost:3002` by default (override with `PORT`).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL to the backend URL above
npm run dev
```

Frontend runs on Vite's default dev port (`http://localhost:5173`).

Full variable-by-variable documentation: [`docs/ENV_VARIABLES.md`](./docs/ENV_VARIABLES.md).

---

## 📚 Documentation

| Doc | Covers |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System design, component responsibilities, request lifecycle |
| [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) | Every REST endpoint, request/response shape, auth requirements |
| [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) | Mongoose schemas, relationships, indexing notes |
| [`docs/AUTH_FLOW.md`](./docs/AUTH_FLOW.md) | Signup/login/JWT/route-guard flow, sequence diagram |
| [`docs/ORDER_TRADING_FLOW.md`](./docs/ORDER_TRADING_FLOW.md) | What happens end-to-end when a BUY/SELL order is placed |
| [`docs/MARKET_DATA_FLOW.md`](./docs/MARKET_DATA_FLOW.md) | Watchlist/indices data flow, caching strategy |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | How the app is deployed (Vercel frontend, Node backend) |
| [`docs/TECHNICAL_DECISIONS.md`](./docs/TECHNICAL_DECISIONS.md) | Key design decisions and trade-offs |
| [`docs/CHALLENGES_AND_SOLUTIONS.md`](./docs/CHALLENGES_AND_SOLUTIONS.md) | Real problems hit during development and how they were solved |
| [`docs/ENV_VARIABLES.md`](./docs/ENV_VARIABLES.md) | Every environment variable, what it's for, example values |
| [`INTERVIEW_PREP.md`](./INTERVIEW_PREP.md) | Project-specific interview questions, answers, and code references |

---

## 📸 Screenshots

Screenshots are organized under [`docs/screenshots/`](./docs/screenshots) in four subfolders: `landing/`, `auth/`, `dashboard/`, `architecture/`. They are not yet captured — see [`docs/screenshots/SCREENSHOTS_GUIDE.md`](./docs/screenshots/SCREENSHOTS_GUIDE.md) for the exact shot list, filenames, and what each one should show.

Once captured, they render below:

### Landing page
| Home | Pricing | Support |
|---|---|---|
| ![Home](./docs/screenshots/landing/home.png) | ![Pricing](./docs/screenshots/landing/pricing.png) | ![Support](./docs/screenshots/landing/support.png) |

### Authentication
| Signup | Login |
|---|---|
| ![Signup](./docs/screenshots/auth/signup.png) | ![Login](./docs/screenshots/auth/login.png) |

### Dashboard
| Summary | Watchlist + Buy/Sell |
|---|---|
| ![Summary](./docs/screenshots/dashboard/summary.png) | ![Watchlist](./docs/screenshots/dashboard/watchlist-buy-window.png) |

| Holdings | Positions | Orders | Funds |
|---|---|---|---|
| ![Holdings](./docs/screenshots/dashboard/holdings.png) | ![Positions](./docs/screenshots/dashboard/positions.png) | ![Orders](./docs/screenshots/dashboard/orders.png) | ![Funds](./docs/screenshots/dashboard/funds.png) |

> Until the image files above are added, these will show as broken images on GitHub — that's expected. Follow the guide in `docs/screenshots/SCREENSHOTS_GUIDE.md` to fill them in.

---

## 🎥 Demo Video

_No demo video has been recorded yet._

**Suggested outline (2–3 minutes):**
1. Landing page walkthrough (10s)
2. Signup → Login → land on dashboard (20s)
3. Live watchlist + market indices ticking (15s)
4. Place a BUY order → see it reflected in Holdings, Positions, and Orders (40s)
5. Place a partial SELL order → see Holdings/Positions/Funds update (30s)
6. Funds page walkthrough (15s)

Once recorded, embed it here as either a hosted link (YouTube/Loom) or a GitHub-uploaded `.mp4`/`.gif`:

```markdown
[![TradeLy demo video](./docs/screenshots/architecture/video-thumbnail.png)](https://your-video-link-here)
```

---

## 🎯 Current Status

**Working today:**
- Signup / login with JWT auth
- Live NSE watchlist (50 symbols) and NIFTY/SENSEX indices via Yahoo Finance
- Simulated BUY/SELL order placement with fund-balance validation
- Holdings, Positions, Orders, Funds views backed by real persisted data
- Per-user data isolation

**Known limitations (see [`docs/CHALLENGES_AND_SOLUTIONS.md`](./docs/CHALLENGES_AND_SOLUTIONS.md)):**
- No real brokerage/payment integration — this is a paper-trading simulator only
- No WebSocket/streaming price updates — the frontend polls on an interval
- No order types beyond an immediate market-style fill (no limit orders, no order cancellation)
- No automated test suite yet

### 🚧 Possible future enhancements
- WebSocket-based live price streaming instead of polling
- Limit orders / order book instead of instant fills
- Historical P&L / portfolio performance charts
- Automated tests (backend integration tests, frontend component tests)
- CI pipeline

---

## 🤝 Contributing

This is primarily a personal/portfolio project. Issues and pull requests are welcome if you'd like to suggest improvements.

## 📄 License

No license file is currently present in this repository. All rights reserved by the author unless a license is added.
