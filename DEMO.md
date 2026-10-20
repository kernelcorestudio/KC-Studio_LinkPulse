# LinkPulse — Demo Script (~5–7 min)

Four scenarios: **Scenarios A & B** form the core 5-minute walkthrough; **Scenarios C & D** cover Phase 2 & 4 deep dives.

### Quick setup before starting:
```bash
# 1. Seed demo data (creates Ada, Admin, 20 links & realistic 30-day click events)
cd server && npm run seed

# 2. Run the application (serves API + full UI at http://localhost:3001)
npm start
```
> Open **http://localhost:3001** (or **http://localhost:5173** if running `npm run dev` in `client/`).  
> Sign in as **`ada@example.com`** / **`password123`** (User) or **`admin@linkpulse.dev`** / **`admin1234`** (Admin).

---

## Scenario A — Link creation → share → clicks → analytics (~2.5 min)

1. **Dashboard (15s)** — Land on the dashboard. Point out it's **live data**: the
   30-day click count, unique visitors, the clicks-over-time line, top countries
   donut and top-links table all come straight from the click-events table. Toggle
   **Today / 7d / 30d** to show the period filter re-querying.

2. **Create link (45s)** — Click **Create Link**.
   - Step 1: paste a long URL (e.g. `https://en.wikipedia.org/wiki/URL_shortening`).
     Type a custom alias like `demo-wiki` and show the **live availability check**
     ("Available ✓"). Then type a taken/reserved alias like `admin` to show it's
     rejected.
   - Continue → Step 2: add a title + tags, show the **review + validation warnings**
     panel, then **Publish**.
   - The success screen shows the short URL → click **Copy**, then **View analytics**.

3. **Clicks → analytics (60s)** — Open the new short link in a new tab (it 302-redirects
   to Wikipedia). Reload a couple of times, and open it with a fake referrer by pasting
   `…/demo-wiki` from another page. Back on **Link detail → Analytics**: hit **Refresh**
   and watch total clicks, unique visitors and the timeseries update — proving the
   **async click queue** landed the events without slowing the redirect.

4. **Bot filtering + QR source (20s)** — Mention: bot user-agents are stored but excluded
   from counts; QR scans (`?src=qr`) are broken out in the analytics "QR scans" card.

---

## Scenario B — Bulk import → QR → admin disables → redirect stops → analytics survive (~2.5 min)

1. **CSV bulk import (40s)** — As `ada`, open **Bulk Import** 📥. Click **Load sample
   CSV** (or pick a real file) → **Validate rows**: show the preview table — good rows
   ✓, the broken URL row flagged with its exact error, nothing written yet. Click
   **Import N valid** → only valid rows are created; the report lists failed rows with
   reasons + a **Download error report (CSV)** button.

2. **QR code (20s)** — Open any link → **Overview**: the QR card renders live; switch
   size to 640px, hit **⬇ PNG / ⬇ SVG**. Mention the QR encodes `?src=qr`, so phone
   scans show up in the "QR scans" analytics card.

3. **Admin moderation (40s)** — Log in as **`admin@linkpulse.dev` / `admin1234`** →
   **Admin** 🛡️: platform stats (users/links/clicks/bot ratio), abuse alerts, top
   destination domains. **Links** tab → search `d1000` → **Disable** with a reason →
   open `/d1000` in a new tab: instant **410 page showing that reason** (redirect LRU
   cache busted; pages are `no-store` so nobody sees a stale page). **Enable** → the
   302 is live again in one click. **Blocklist** tab: block a domain, show that new
   links to it (and its subdomains) are refused; un-block to clean up.

4. **Close (20s)** — Recap the architecture: JWT auth, validation wizard, cache-first
   redirect engine with a documented rule order, and an async click queue that keeps
   redirects fast while capturing device / geo / referrer / bot signals — with the same SQL
   running on Postgres in production and SQLite locally.

---

## Scenario C — Guardrails: expiry, click limit, password (Phase 2, ~1 min)

1. Open `/d1007` → branded **"Link expired"** page (410) — point out the row was
   auto-marked, never deleted, its analytics remain queryable.
2. Open `/d1011` → **"This link is protected"** form (401). Enter `opensem3` →
   redirects, and a 12-hour signed cookie means **no re-ask** on refresh. Wrong
   password re-shows the form with an error.
3. Dashboard → **campaign dropdown**: pick "Summer Launch" — every metric, chart
   and top-link row re-scopes to that campaign. Open **Campaigns** → *Analytics*
   on any card for its own trend + period toggle.
4. Link detail → **Settings** tab: set an expiry date or click limit and show the
   change is instant (redirect cache busted) — no restart, no delay.

---

## Scenario D — Bio page + device targeting + alerts (Phase 4, ~1 min)

1. **Link-in-bio (30s)** — Open **Bio Pages** 🔖 → select ada's `ada` page. Show the
   theme picker (dark/light/brand/sunset/ocean) and the ordered button list with custom
   labels. Switch theme → **Save page** → open **`/bio/ada`** in a new tab: a themed,
   server-rendered public page. Click a button — it goes through the **redirect engine**
   (`?src=bio`), so the tap is tracked and any link rule (password/expiry) still applies.
   Back on that link's Analytics, the "Bio" source card now shows traffic.

2. **Device targeting (20s)** — Open `/d1005` on a phone-emulated tab (or just explain):
   iPhone → App Store, Android → Play Store, desktop → GitHub, all from one short link.
   Show the **Settings → 📱 Device targeting** inputs and that the Overview reads
   "📱 3 rules". Mention the create wizard's optional device panel builds the same rule.

3. **Alerts (10s)** — Dashboard **Alerts** panel: severity-ranked, each row explains
   *why* it fired ("Disabled by an admin · …", "Stops redirecting in 5h", "Expired
   …"), deep-linking to the affected link. The stat card summarizes "N need action now".

---

### Seeded links to use during the demo
| Code | What it shows |
|------|---------------|
| `/d1000` | normal active link (302) |
| `/d1003` | **disabled** → 410 page |
| `/d1005` | **device-targeted** → ios/android/desktop destinations |
| `/d1007` | **expired** (past expiry) — still traceable |
| `/d1011` | **password-protected** — live unlock form; password `opensem3` |
| `/d1015` | **click-limited** (near its cap) |
| `/bio/ada` | public **link-in-bio** page (5 themed buttons, `?src=bio`) |
