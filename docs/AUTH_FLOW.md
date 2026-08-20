# Authentication Flow

TradeLy uses stateless JWT authentication with `localStorage` token storage on the client. No sessions, cookies, or refresh tokens are involved.

## 1. Signup

```
User fills Signup form (frontend/src/Signup.jsx)
        │
        ▼
POST /api/auth/signup { username, email, password }
        │
        ▼
backend/routes/authRoutes.js
  ├─ check email not already registered → 400 if it is
  ├─ bcrypt.hash(password, 10)
  ├─ create User document
  └─ create Fund document (₹100,000 seed) for the new user
        │
        ▼
201 { message: "Signup successful" }
        │
        ▼
frontend shows an alert, navigate("/login")
```

No token is issued at signup — the user must log in afterward.

## 2. Login

```
User fills Login form (frontend/src/Login.jsx)
        │
        ▼
POST /api/auth/login { email, password }
        │
        ▼
backend/routes/authRoutes.js
  ├─ find User by email → 404 if not found
  ├─ bcrypt.compare(password, user.password) → 401 if mismatch
  └─ jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })
        │
        ▼
200 { message, token, user: { id, username, email } }
        │
        ▼
frontend:
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
  window.location.href = `/dashboard?token=${token}`
```

**Why the token is also passed as a `?token=` query param on redirect:** the login handler does a hard `window.location.href` redirect (not a React Router `navigate`) to force a full reload into the dashboard shell. `AuthLoader` (mounted around the dashboard route) reads that query param on mount as a second write path for the token, then strips it from the URL via `window.history.replaceState`. In practice `localStorage.setItem` in `Login.jsx` already runs before the redirect, so this is a redundant/defensive second path — but it does mean the dashboard can also be entered directly via a `?token=` link.

## 3. Route protection (frontend)

```
Navigate to /dashboard/*
        │
        ▼
<AuthLoader>          — persists ?token= from URL to localStorage if present
        │
        ▼
<ProtectedRoute>       — reads localStorage.token
        │
   token present? ──── no ───▶ <Navigate to="/login" />
        │ yes
        ▼
<DashboardHome> renders
```

`ProtectedRoute` (`frontend/src/landing_page/ProtectedRoute.jsx`) only checks for the **presence** of a token in `localStorage` — it does not verify expiry or validity client-side. An expired/invalid token will pass this check and only fail once an authenticated API call is made (see below).

## 4. Authenticated requests (frontend → backend)

Every request made through the shared `api` Axios instance (`frontend/src/api.js`) has an interceptor that reads `localStorage.token` and sets:

```
Authorization: Bearer <token>
```

## 5. Route protection (backend)

```
Incoming request to a 🔒 route
        │
        ▼
backend/middleware/authMiddleware.js
  ├─ read Authorization header
  ├─ missing / not "Bearer <token>" → 401 "Access denied. No token provided."
  ├─ jwt.verify(token, JWT_SECRET)
  │     invalid/expired → 401 "Invalid or expired token"
  └─ valid → req.user = decoded payload ({ id, email }); next()
        │
        ▼
route handler uses req.user.id to scope all DB queries
```

Every trading endpoint (`/orders`, `/funds`, `/allHoldings`, `/allPositions`, `/newOrder`) is mounted with `authMiddleware` as route-level middleware in `backend/index.js`. `/api/stocks/watchlist` and `/marketIndices` are intentionally public (market data, not user data).

## 6. Logout

`AuthContext.logout()` clears `localStorage.token` and resets in-memory state. Note: `AuthContext` is defined (`frontend/src/context/AuthContext.jsx`) but the app's actual login/route-guard flow reads `localStorage` directly rather than through this context in most places — see [`TECHNICAL_DECISIONS.md`](./TECHNICAL_DECISIONS.md) for why this is worth calling out, and [`CHALLENGES_AND_SOLUTIONS.md`](./CHALLENGES_AND_SOLUTIONS.md) for the broader "two auth code paths" note also flagged in `ARCHITECTURE.md`.

## Security properties

- Passwords are never stored or logged in plaintext (bcrypt, 10 salt rounds)
- JWT payload contains only `id`/`email` — no password or sensitive data
- Token expiry is 7 days; there is no refresh-token mechanism, so users must re-login after expiry
- `JWT_SECRET` is required at runtime from the environment — never hardcoded
- CORS is enabled backend-wide (`app.use(cors())`) with default (permissive) settings, appropriate for a public API with no cookies/sessions to protect against CSRF
