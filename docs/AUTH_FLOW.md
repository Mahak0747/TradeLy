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

`AuthContext.logout()` removes the JWT from `localStorage` and resets the authentication state maintained by the context.

The current application primarily uses `localStorage` directly for authentication checks and route protection, while `AuthContext` provides a separate authentication-state abstraction.

This means `AuthContext` is not the sole source of truth for authentication in the current implementation.

### Implementation Note

The project currently contains two authentication access patterns:

- Direct `localStorage` access in the login/route-guard flow
- Authentication state exposed through `AuthContext`

The application currently functions with this arrangement, so it has been documented rather than refactored as part of the documentation work.

A future cleanup could consolidate authentication state and token handling into a single approach to reduce duplication and improve maintainability.

## Security properties

- Passwords are never stored or logged in plaintext (bcrypt, 10 salt rounds)
- JWT payload contains only `id`/`email` — no password or sensitive data
- Token expiry is 7 days; there is no refresh-token mechanism, so users must re-login after expiry
- `JWT_SECRET` is required at runtime from the environment — never hardcoded
- CORS is enabled backend-wide (`app.use(cors())`) with default (permissive) settings, appropriate for a public API with no cookies/sessions to protect against CSRF
