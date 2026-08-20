# Environment Variables

TradeLy uses two separate `.env` files — one for the backend, one for the frontend. Both already have `.env.example` templates committed to the repo (no secrets in either); this document explains what each variable does. **No `.env` file itself is or should ever be committed** — both `backend/.gitignore` and `frontend/.gitignore` already exclude `.env`.

## Backend — `backend/.env` (from `backend/.env.example`)

```env
MONGO_URL=
JWT_SECRET=
```

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGO_URL` | Yes | MongoDB connection string. Read in `backend/index.js` and passed to `mongoose.connect(uri)`. | `mongodb+srv://user:pass@cluster.mongodb.net/tradely` |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWTs (`jsonwebtoken`). Used in `routes/authRoutes.js` (sign) and `middleware/authMiddleware.js` (verify). Must be identical across restarts or existing tokens become invalid. | a long random string, e.g. generated with `openssl rand -hex 32` |
| `PORT` | No | Port the Express server listens on. Not present in `.env.example` but read via `process.env.PORT`, defaulting to `3002` if unset — set this if your host requires a specific port. | `3002` |

## Frontend — `frontend/.env` (from `frontend/.env.example`)

```env
VITE_API_BASE_URL=
```

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL the frontend's Axios instance (`src/api.js`) prefixes onto every API call. Must point at the running backend. Vite only exposes variables prefixed `VITE_` to client code, and inlines them **at build time** — changing this in production requires a rebuild, not just a restart. | `http://localhost:3002` (dev) or `https://your-backend-host.onrender.com` (prod) |

## Setting them up locally

```bash
# backend
cd backend
cp .env.example .env
# then edit .env and fill in MONGO_URL and JWT_SECRET

# frontend
cd frontend
cp .env.example .env
# then edit .env and set VITE_API_BASE_URL to the backend's URL
```

## Setting them up in deployment

- **Vercel (frontend):** set `VITE_API_BASE_URL` under Project Settings → Environment Variables, then trigger a build/redeploy.
- **Backend host:** set `MONGO_URL` and `JWT_SECRET` (and optionally `PORT`) under that host's environment/secrets configuration UI — never commit them to source control.

## Security notes

- Rotating `JWT_SECRET` invalidates every currently-issued token — all users will be logged out and need to log in again.
- `MONGO_URL` typically embeds database credentials — treat it as a secret with the same care as a password.
- Neither `.env` file is tracked by git in this repository (see `.gitignore` in both `backend/` and `frontend/`); only the `.env.example` templates (with empty values) are committed.
