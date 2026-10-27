# Troubleshooting

## "My orders/holdings/positions exist in MongoDB but the dashboard is empty"

Run the **read-only** diagnostic (it never writes):

```bash
cd backend
npm run diagnose -- --email you@example.com
```

It prints the database the app is using and, per collection, how many documents have `userId` as an ObjectId, as a string, or missing. Then:

| What you see | Cause | Fix |
|---|---|---|
| Totals are all 0 / data is in another database | `MONGO_URL` has no database name (MongoDB uses `test`) or points at the wrong cluster | add `/<database>` to `MONGO_URL` |
| `userId=string` > 0 | records stored with a string `userId` (hand-inserted/imported) | nothing - **handled automatically**, no data is changed |
| `userId missing` > 0 | old single-user records with no owner | assign them: `npm run claim-legacy -- --email you@example.com` (dry run), add `--apply` to write. Back up first. |
| Health shows `"database":"connecting"` forever | Atlas blocks the host, wrong password, bad URL | Atlas -> Network Access; check credentials; see server log |
| Login works but pages say "Session expired" | `JWT_SECRET` changed between login and now | log in again |

Records belonging to other accounts or without an owner are deliberately never shown to a user.

## Stocks / NIFTY / SENSEX not loading
- `curl https://<backend>/api/health` -> look at `market.lastError`. Yahoo can rate-limit or block cloud IPs; the app then serves the last known prices flagged "stale" and refuses new orders once quotes are older than 2 minutes.
- Watchlist shows fewer than 50 stocks (`X-Data-Missing` header): a ticker was renamed/delisted. Fix in `backend/config/symbols.js` (`ALIASES` maps old names, e.g. `ZOMATO -> ETERNAL`).
- Browser console says *"API returned a web page"*: `VITE_API_BASE_URL` is missing from the frontend build.

## Slow first load
Free hosting sleeps after inactivity; the first request can take 30-60 s. See `docs/DEPLOYMENT.md`.

## CORS errors in the browser
Add the exact frontend origin (scheme + host, no trailing slash) to the backend's `CORS_ORIGIN`.
