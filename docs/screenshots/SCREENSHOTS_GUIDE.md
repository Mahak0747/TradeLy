# Screenshots Guide

This folder is where README/documentation screenshots live. No screenshots have been captured yet — this guide tells you exactly what to capture, at what state, and where to save each file so the references already wired up in `README.md` resolve correctly.

**General guidance for every screenshot:**
- Use a realistic but non-sensitive demo account (don't screenshot a real email/password combination you use elsewhere)
- Browser window at a standard desktop width (~1440px) unless noted otherwise
- Light mode (the app's default styling)
- PNG format, filenames exactly as listed below (case-sensitive)

---

## `docs/screenshots/landing/`

| Filename | Page/state | What to capture |
|---|---|---|
| `home.png` | `/` | Full landing page hero section (top of page) |
| `pricing.png` | `/pricing` | Pricing/brokerage page |
| `support.png` | `/support` | Support/help page |
| `about.png` *(optional)* | `/about` | About/team page |
| `products.png` *(optional)* | `/product` | Products page |

## `docs/screenshots/auth/`

| Filename | Page/state | What to capture |
|---|---|---|
| `signup.png` | `/signup` | Signup form, empty state |
| `login.png` | `/login` | Login form, empty state |

## `docs/screenshots/dashboard/`

| Filename | Page/state | What to capture |
|---|---|---|
| `summary.png` | `/dashboard` | Dashboard home — Summary panel with funds + P&L, after at least one trade has been placed so figures are non-zero |
| `watchlist-buy-window.png` | `/dashboard` | Watchlist sidebar with the Buy modal open on a stock (hover a stock, click Buy) |
| `sell-window.png` *(optional)* | `/dashboard` | Sell modal open on a held stock |
| `holdings.png` | `/dashboard/holdings` | Holdings table + bar chart, with at least 2–3 holdings so the table/chart are meaningfully populated |
| `positions.png` | `/dashboard/positions` | Positions table with at least one open position |
| `orders.png` | `/dashboard/orders` | Orders table with a mix of BUY and SELL rows |
| `funds.png` | `/dashboard/funds` | Funds page showing available margin/cash after some trading activity |
| `topbar-indices.png` *(optional)* | any dashboard page | Close-up of the top bar showing live NIFTY/SENSEX values |

## `docs/screenshots/architecture/`

| Filename | What it's for |
|---|---|
| `video-thumbnail.png` *(optional)* | Thumbnail image used as the clickable placeholder for the demo video in `README.md`, once a demo video exists |

---

## How to capture

1. Run the app locally (see `README.md` → Getting Started) or use the live deployment.
2. Sign up a demo user, log in.
3. Place 2–3 BUY orders on different stocks (e.g. RELIANCE, TCS, INFY) so Holdings/Positions/Orders/Summary all have real, non-empty data to show.
4. Optionally place one SELL to show a completed round-trip in the Orders table.
5. Capture each screenshot listed above at the specified route.
6. Save into the matching subfolder using the **exact filename** given (this is what `README.md` links to).
7. Commit the images — `README.md` already references these paths, so once the files exist, the images will render automatically on GitHub.

## Why placeholders instead of fake/generated screenshots

Per this project's documentation policy, only real, actual screenshots of the running application should be used — no invented or simulated UI states. Until you capture them, the image links in `README.md` will simply appear broken on GitHub, which is expected and harmless.
