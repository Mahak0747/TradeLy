# Deployment

> This document describes how the project is set up to be deployed based on the configuration files already present in the repo (`frontend/vercel.json`, `package.json` scripts, `.env.example` files). It does not change any of that configuration.

## Overview

| Component | Where it runs | Config file |
|---|---|---|
| Frontend (React/Vite) | Vercel | `frontend/vercel.json` |
| Backend (Express/Node) | Any Node host (Render, Railway, a VPS, etc.) | `backend/package.json` (`npm start` → `nodemon index.js`) |
| Database | MongoDB (local or MongoDB Atlas) | connection string via `MONGO_URL` |

Live deployment referenced by the repository: **https://stocktrading-flame.vercel.app** (frontend).

## Frontend (Vercel)

`frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This is a standard SPA rewrite rule — every path falls back to `index.html` so client-side routing (`react-router-dom`) works correctly on hard refreshes and direct-link navigation (e.g. a user bookmarking `/dashboard/holdings`).

**Build settings (Vercel project settings, not a file in this repo):**
- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build` (runs `vite build`)
- Output directory: `dist` (Vite default)
- Install command: `npm install`

**Required environment variable (set in Vercel project settings, not committed):**
- `VITE_API_BASE_URL` — the deployed backend's base URL (e.g. `https://your-backend-host.onrender.com`)

Because Vite inlines `import.meta.env.VITE_*` variables at build time, this variable must be set **before** the build runs on Vercel — changing it requires a redeploy, not just a restart.

## Backend (Node host)

The backend has no platform-specific config file (no `render.yaml`, no `Procfile`) — it's a plain Node/Express app started with:

```bash
npm install
npm start   # -> nodemon index.js
```

For a production process manager, `node index.js` (without `nodemon`) or a process supervisor (PM2, the host's own restart-on-crash behavior) would typically replace `npm start` — this repo's `package.json` `start` script uses `nodemon`, which is normally a dev-time convenience for auto-restart on file changes rather than a production launcher. This is noted here as an observation, not changed, per the "no config changes" constraint of this task.

**Required environment variables:**
- `MONGO_URL` — MongoDB connection string
- `JWT_SECRET` — secret used to sign/verify JWTs
- `PORT` — optional, defaults to `3002` if unset

**CORS:** the backend enables `cors()` with default (permissive) options — it does not restrict allowed origins to the deployed frontend domain specifically. This is standard for a project at this stage, but is worth tightening (`cors({ origin: "https://stocktrading-flame.vercel.app" })`) if this were hardened for a stricter production posture.

## Database (MongoDB)

Any MongoDB instance reachable from the backend host works — MongoDB Atlas's free tier is the typical choice for a project like this. The backend connects on server startup:

```js
app.listen(PORT, async () => {
  await mongoose.connect(uri);
});
```

Note: the server starts listening for HTTP requests **before** the MongoDB connection is confirmed — a request that hits a DB-backed route in the brief window before `mongoose.connect` resolves would fail. In practice this window is milliseconds and not user-visible in normal operation.

## Local full-stack setup

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env    # fill in MONGO_URL, JWT_SECRET
npm start                 # http://localhost:3002

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:3002
npm run dev                # http://localhost:5173
```

## Deployment checklist

- [ ] `MONGO_URL` set on the backend host, pointing at a reachable MongoDB instance (whitelist the backend host's IP if using Atlas)
- [ ] `JWT_SECRET` set on the backend host — a long, random value, not the placeholder from `.env.example`
- [ ] `VITE_API_BASE_URL` set in Vercel (or wherever the frontend is built) to the backend's public URL, **before** triggering a build
- [ ] Backend `PORT` matches what the host expects (many PaaS hosts inject their own `PORT` env var, which this app already respects via `process.env.PORT || 3002`)
- [ ] CORS origin tightened if deploying beyond a demo/portfolio context

Full variable reference: [`ENV_VARIABLES.md`](./ENV_VARIABLES.md).
