# TradeLy

> A full-stack, Zerodha-Kite-style paper trading platform built on the MERN stack — real NSE market data, a virtual funds ledger, and a live order/holdings/positions engine, without touching real money.

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react"/>
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-success?logo=mongodb"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white"/>
  <img src="https://img.shields.io/badge/Version-v1.0-blue"/>
</p>

---

## 📖 Overview

TradeLy is a simulated stock trading web application modeled on the look and workflow of Zerodha Kite. It lets a signed-up user browse a live NSE watchlist, view live NIFTY 50 / SENSEX index data, place simulated BUY/SELL orders against a virtual cash balance, and track the results across **Holdings**, **Positions**, **Orders**, and **Funds** — all backed by a real Node.js/Express API and MongoDB database.

There is **no real brokerage, payment gateway, or money movement involved anywhere in this project.** All prices are real (fetched live from Yahoo Finance for NSE-listed symbols); all trades are paper trades settled against a virtual fund balance seeded per user.

This repository contains:
- A **React (Vite) frontend** — public marketing site + authenticated trading dashboard
- A **Node/Express backend** — REST API, JWT auth, MongoDB persistence, live market-data proxy

📚 Full engineering documentation lives in [`docs/`](./docs) — architecture, API reference, database schema, auth/order/market-data flows, deployment notes, technical decisions, and challenges faced.

---
### 🌐 Live Demo

**Frontend:** https://stocktrading-flame.vercel.app

**Backend API 1:** https://stocktrading-api-jdym.onrender.com/marketIndices

**Backend API 2:** https://stocktrading-api-jdym.onrender.com/api/stocks/watchlist


**Technical Documentation:** [`docs/`](https://github.com/Mahak0747/TradeLy/tree/main/docs)

## ✨ Features

### 🌍 Public Site

- Landing page
- About
- Products
- Pricing
- Support pages (React Router)
- Signup / Login forms backed by real API calls

---

### 🔐 Trading dashboard (authenticated)

- **Live watchlist** of 50 NSE large-cap stocks with price, % change, and a distribution doughnut chart, auto-refreshed every 30s
- **Live market indices** bar (NIFTY 50, SENSEX) in the top bar, auto-refreshed every 15s
- **Buy / Sell order windows** with client-side quantity/price validation
- **Order placement engine** that atomically updates Funds, Holdings, Positions, and the Orders ledger
- **Holdings** page — instrument-wise average cost, LTP, current value, P&L, and a bar chart, all computed from a fresh live quote at request time
- **Positions** page — live P&L per open position
- **Orders** page — full order history per user, most recent first
- **Funds** page — available margin, used margin, available cash, opening balance
- **Summary (dashboard home)** — quick snapshot of margin available and portfolio P&L

---

### 🛡️ Platform
- JWT-based authentication with bcrypt password hashing
- Per-user data isolation on every trading collection (`userId` foreign key + auth middleware)
- 30-second in-memory caching on all Yahoo Finance calls to stay under rate limits
- Route-level auth guarding on the frontend (`ProtectedRoute`) and backend (`authMiddleware`)

---

## 🏗 Architecture

```
              ┌─────────────────────┐
              │   Browser (User)    │
              └─────────┬───────────┘
                        │ HTTPS
                        │ 
                        ▼
           ┌───────────────────────────┐
           │  React Frontend (Vite)    │
           │  Landing site + Dashboard │
           │  Deployed on Vercel       │
           └────────────┬──────────────┘
                        │ Axios (JWT in Authorization header)
                        │ 
                        ▼
           ┌───────────────────────────┐
           │  Express.js Backend API   │
           │  Deployed on Render/Node  │
           ├───────────────────────────┤
           │ /api/auth   (signup/login)│
           │ /api/stocks (watchlist)   │
           │ /orders /funds            │
           │ /allHoldings /allPositions│
           │ /newOrder /marketIndices  │
           └─────┬──────────────┬──────┘
                 │              │
                 ▼              ▼
       ┌───────────────┐  ┌──────────────────────┐
       │  MongoDB      │  │  Yahoo Finance API   │
       │  (Mongoose)   │  │  (yahoo-finance2)    │
       │  Users        │  │  Live NSE quotes +   │
       │  Funds        │  │  NIFTY/SENSEX index  │
       │  Holdings     │  │  30s in-memory cache │
       │  Positions    │  └──────────────────────┘
       │  Orders       │
       └───────────────┘
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
│   ├── controllers/               # authController.js
│   ├── middleware/                # authMiddleware.js (JWT verification)
│   ├── model/                     # Mongoose models (Funds, Holdings, Orders, Positions, User)
│   ├── schemas/                   # Mongoose schemas backing each model
│   ├── routes/                    # authRoutes.js, stockRoutes.js
│   ├── services/                  # yahooService.js (live quotes, caching)
│   ├── index.js                   # Express app entry point + trading endpoints
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── landing_page/          # Public marketing site (home, about, pricing, support, products)
│   │   ├── dashboard/             # Authenticated trading dashboard (Watchlist, Orders, Holdings, ...)
│   │   ├── context/               # AuthContext (token state)
│   │   ├── api.js                 # Axios instance with JWT interceptor
│   │   ├── Login.jsx / Signup.jsx
│   │   └── main.jsx               # Router + route guards
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── docs/                          # Engineering documentation (this task's deliverable)
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
│   └── screenshots/               # See "Screenshots" section below
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
cp .env.example .env     # fill in MONGO_URL and JWT_SECRET
npm start                # runs `nodemon index.js`
```

Backend runs on `http://localhost:3002` by default (override with `PORT`).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env     # set VITE_API_BASE_URL to the backend URL above
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

---

## 📸 Screenshots

### Landing page

<img width="1898" height="863" alt="Image" src="https://github.com/user-attachments/assets/6b35d9f7-97d1-46d8-92c5-cfd72b239da5" />

### Authentication

<img width="350" height="350" alt="Image" src="https://github.com/user-attachments/assets/f95a8c48-e3eb-4ae5-9d66-ff4ed9e85d5f" />

<img width="350" height="350" alt="Image" src="https://github.com/user-attachments/assets/b3912c01-4cfc-416e-ba8b-8c16af44a17e" />

### Dashboard

<img width="1912" height="857" alt="Image" src="https://github.com/user-attachments/assets/37802eff-23bb-4054-8d4b-ccfdace1d611" />

<img width="1516" height="780" alt="Image" src="https://github.com/user-attachments/assets/51bed4a4-5de1-4552-bdc4-9793a51b264e" />

<img width="1532" height="537" alt="Image" src="https://github.com/user-attachments/assets/2a7a96ed-568c-43d7-a67e-da8c9ebbcd8f" />

---

## 🎯 Current Status

### ✅ Version 1.0
- Signup / login with JWT auth
- Live NSE watchlist (50 symbols) and NIFTY/SENSEX indices via Yahoo Finance
- Simulated BUY/SELL order placement with fund-balance validation
- Holdings, Positions, Orders, Funds views backed by real persisted data
- Per-user data isolation

### 🚧 Possible future enhancements
- WebSocket-based live price streaming instead of polling
- Limit orders / order book instead of instant fills
- Historical P&L / portfolio performance charts
- CI pipeline

---

## 🤝 Contributing

This is primarily a personal/portfolio project. Issues and pull requests are welcome if you'd like to suggest improvements.

## 📄 License

This project is licensed under the MIT License.