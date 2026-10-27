# Environment Variables

Two separate `.env` files - backend and frontend. Both have a `.env.example` template. **Never commit a real `.env`** (both `.gitignore` files already exclude it).

## Backend - `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | **Yes** | MongoDB connection string. **Include the database name** (`...mongodb.net/<database>?...`). Without it MongoDB silently uses a database called `test` - a classic reason for "my data is in Atlas but the app shows nothing". |
| `JWT_SECRET` | **Yes** | Signing key for login tokens. In production it must be at least 32 characters (the server refuses to start otherwise). Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Changing it logs everyone out. |
| `NODE_ENV` | Recommended | Set `production` on the host (hides internal error details, enforces the secret length check). |
| `CORS_ORIGIN` | Recommended | Comma-separated list of allowed browser origins, no trailing slash, e.g. `https://my-app.vercel.app,http://localhost:5173`. Empty = any origin is allowed (the server logs a warning in production). |
| `PORT` | No | Defaults to `3002`. Most hosts inject their own - leave it alone there. |
| `JWT_EXPIRES_IN` | No | Default `7d`. |
| `DNS_SERVERS` | No | Default `1.1.1.1,8.8.8.8` (needed on some networks for `mongodb+srv://` lookups). Set `system` to use the OS resolver. |
| `QUOTE_TTL_MS` | No | How long a Yahoo quote is cached. Default `30000`. |
| `INDICES_TTL_MS` | No | Cache time for NIFTY/SENSEX. Default `15000`. |
| `YAHOO_TIMEOUT_MS` | No | Give up on a Yahoo request after this long. Default `8000`. |
| `TRADE_MAX_QUOTE_AGE_MS` | No | Orders are refused if the newest quote is older than this. Default `120000`. |

## Frontend - `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | **Production only** | Public URL of the backend, no trailing slash. Inlined **at build time** - change it, then rebuild/redeploy. **Not needed locally**: `npm run dev` proxies API calls to `http://localhost:3002`. |
| `VITE_DEV_API_TARGET` | No | Dev only: where the Vite dev server forwards API calls. Default `http://localhost:3002`. |

If `VITE_API_BASE_URL` is missing in a production build, the app calls its own origin, gets `index.html` back, and now reports *"The API returned a web page instead of data. Check VITE_API_BASE_URL"* instead of crashing.

## Quick setup

```bash
cd backend  && cp .env.example .env   # fill MONGO_URL (with db name) + JWT_SECRET
cd frontend && cp .env.example .env   # optional for local dev
```
