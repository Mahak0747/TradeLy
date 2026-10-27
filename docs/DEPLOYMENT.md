# Deployment

| Component | Where | Notes |
|---|---|---|
| Frontend (React/Vite) | Vercel (or Netlify, any static host) | `frontend/vercel.json` rewrites all paths to `index.html` for client-side routing |
| Backend (Express) | Render / Railway / any Node 20+ host | start command `npm start` (= `node index.js`) |
| Database | MongoDB Atlas (free tier is fine) | |

## 1. Database (Atlas)
1. Create a cluster and a database user.
2. **Network Access -> add `0.0.0.0/0`** (Render/Railway free tiers have no fixed IP). Without this the backend cannot connect and every data request fails.
3. Copy the connection string and **add your database name** after the host: `mongodb+srv://USER:PASS@cluster.mongodb.net/tradely?retryWrites=true&w=majority`.

Already have data? Run the read-only checker first (see [TROUBLESHOOTING](./TROUBLESHOOTING.md)): `cd backend && npm run diagnose`.

## 2. Backend (example: Render)
- Root directory `backend`, build `npm install`, start `npm start`.
- Environment: `MONGO_URL`, `JWT_SECRET` (>= 32 chars), `NODE_ENV=production`, `CORS_ORIGIN=https://<your-frontend>.vercel.app`.
- Health check path: `/api/health` (always 200 while the process is up; the body reports `database` and market-data state).
- Free tiers sleep when idle (30-60 s cold start). The frontend waits up to 30 s and retries GET requests twice; to avoid the delay use a paid instance or ping `/api/health` every ~10 minutes with an uptime monitor.

## 3. Frontend (Vercel)
- Root directory `frontend`, framework Vite, build `npm run build`, output `dist`.
- Environment: `VITE_API_BASE_URL=https://<your-backend-host>` (set it **before** building).
- After the first deploy, put the final frontend URL into the backend's `CORS_ORIGIN` and redeploy the backend.

## 4. Verify
```bash
curl https://<backend>/api/health            # {"status":"ok","database":"connected",...}
curl https://<backend>/api/stocks/watchlist  # 50 stocks
```
Then sign up, log in, place a buy, and check Orders/Holdings/Positions/Funds.

## Local full stack
```bash
# terminal 1
cd backend && npm install && cp .env.example .env   # fill it in
npm run dev                                          # http://localhost:3002
# terminal 2
cd frontend && npm install && npm run dev            # http://localhost:5173 (proxies the API)
```

## Checklist
- [ ] `MONGO_URL` includes the database name; Atlas allows the backend's IP
- [ ] `JWT_SECRET` is long and random (never the example value)
- [ ] `CORS_ORIGIN` = the real frontend URL
- [ ] `VITE_API_BASE_URL` was set before the frontend build
- [ ] Any credentials that were ever committed/shared have been rotated
