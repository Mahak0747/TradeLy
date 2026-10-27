# Debugging & optimisation report

Each item below was reproduced against the original code (same seeded MongoDB, Yahoo simulated at 300 ms/request) before being fixed.

## Root causes and fixes

| # | Problem (original) | Fix |
|---|---|---|
| 1 | Watchlist fetched **50 symbols one at a time** (15 s cold) | one batched Yahoo request + per-symbol TTL cache + in-flight de-duplication (`services/yahooService.js`); cold ~0.2 s, warm ~2 ms |
| 2 | Holdings/positions made one uncached Yahoo call per row | same shared cache, one batch for all rows |
| 3 | Delisted/renamed tickers (`ZOMATO`, `TATAMOTORS`) silently dropped -> 48/50 | `config/symbols.js` single source of truth + `ALIASES`; old holdings are still priced |
| 4 | Records with a **string `userId`** never matched (Mongoose casts the query to ObjectId) -> empty dashboard | owner filter matches both forms using the raw driver; nothing is modified |
| 5 | `GET /funds` **created a duplicate default fund** when the lookup missed | fixed by #4; covered by a test |
| 6 | MongoDB failures only logged; every DB route then hung ~10 s | fail-fast 503, connect-with-retry, `/api/health` |
| 7 | Client could send any `price` to `/newOrder` | server uses the live quote; refuses when no fresh quote exists |
| 8 | Balance check and debit were separate steps (overdraw race); no rollback; positions kept a stale average; SELL subtracted proceeds from used margin | atomic guarded debit, optimistic updates, compensating rollback, weighted average, cost-basis release |
| 9 | "Net chg." showed the *day* change | now return on cost; Day chg. is the day move |
| 10 | Frontend: no timeout, 401 only `console.log`'d (silent empty dashboard), `.map` on non-array crashed the page, `<Link>` without `to` used as buttons, hardcoded "Margin required 140.65", full page reload after each order | axios timeout + retry + global 401 handling, array guards, error boundary, real buttons, computed margin, in-place refresh |
| 11 | No loading/error states | spinner / error + Retry / "stale prices" notice |
| 12 | MUI barrel imports (very slow dev server), `TransitionComponent` (removed in MUI 9), "up" arrow styled as down | path imports, `slots`, fixed |
| 13 | Security: open CORS, no rate limit, user enumeration, NoSQL operator injection on login, `nodemon` as start command, unused deps | allowlist, rate limits, generic errors, type checks, `node index.js`, deps pruned |

## Behaviour changes to be aware of
- The price field in the order window is display-only; orders execute at the server's live price.
- New passwords must be 8-72 characters. Unknown tickers are rejected on BUY.
- API errors keep `message` and still include `error` for old clients.

## Verification performed
See the README "Testing" section for commands. Honest limits: live Yahoo Finance and a real MongoDB server were **not** available in the build sandbox (a Yahoo stub and a MongoDB-compatible server were used), so run the checks in `docs/DEPLOYMENT.md` (section 4) after deploying.
