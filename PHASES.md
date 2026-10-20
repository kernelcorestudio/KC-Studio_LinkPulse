# LinkPulse — Phase-wise Progress Document

> Status snapshot of what has actually been **built, run and tested** — phase by phase.
> Last updated: after **Phase 4 completion — all four phases done ✅**.
> Legend: ✅ Done & verified · 🔧 Built, activates in later phase · ⏳ Pending

---

## 🚩 Phase 1 — CORE (COMPLETE ✅, deploy-ready)

Scope: auth, create link, redirect, async click tracking, basic link analytics + deploy.

### 1.1 Project setup ✅
| Item | Detail |
|------|--------|
| Repo structure | `server/` (Express ESM: `routes / controllers-logic / services / db / middleware / utils`) + `client/` (React Vite) |
| Stack | Node 24 + Express 4 · Postgres + built-in `node:sqlite` fallback · React 18 + Vite + Tailwind + Chart.js + React Router |
| Config | `server/src/config.js` — 100% env-based, `.env.example` both sides, secrets git-ignored |
| Deps installed | server 159 pkgs, client 137 pkgs, zero native-build failures |

### 1.2 Database & migrations ✅
- Full schema created upfront (Phase 1 → 4 tables all present): `users, workspaces, campaigns, tags, link_tags, links, click_events, blocked_domains, bio_pages, bio_page_links`
- Dual dialect: `schema.sqlite.sql` + `schema.pg.sql`, applied idempotently at startup (`CREATE TABLE IF NOT EXISTS`)
- Proper FKs (`ON DELETE CASCADE/SET NULL`) + indexes (`links.owner_id`, `links.campaign_id`, `click_events(link_id, clicked_at)`, visitor/ip-hash indexes)
- Dialect adapter `server/src/db/index.js`: one SQL codebase, `?` → `$n` translation, transactions
- **Expired/disabled links are never deleted** — analytics stay traceable ✅

### 1.3 Auth & roles ✅
- Register / Login / `me` — bcrypt hashing (10 rounds), JWT (7d), `zod` validation
- Role-based middleware (`requireAuth`, `requireAdmin`), first account = admin
- **Ownership check on every link/analytics query** (403 on cross-user access)
- Login/register rate-limited (20 / 15 min / IP)

### 1.4 Link creation ✅
- Two-step wizard (backend + UI): **Step 1** URL + alias, **Step 2** options + review + publish
- Live validation before publish: URL format, https-only scheme, **blocked domain**, **duplicate alias real-time check** (`/api/links/available`), **reserved aliases** (`api/admin/login/...`), alias format rules, **self-referencing URL block**
- Auto codes: base62 nanoid len 6→8, **collision retry** + DB unique-constraint fallback
- Rate limiting: per-user create limit (30/min) + global API limit → clear **429** messages

### 1.5 Redirect engine `GET /:code` ✅ (all rules 1–8 wired — 4–7 activated in Phase 2)
Order documented in `redirectRoutes.js` + README mermaid diagram:
1. ✅ Lookup — **LRU cache-first**, negative-cache, invalidation hook on update/disable
2. ✅ `disabled` → **410 branded page with reason**
3. ✅ destination on **blocklist** → blocked page
4. ✅ expiry → auto-marked `expired` (never deleted) → 410 expired page *(Phase 2)*
5. ✅ click-limit → 410 limit page, fresh atomic count read *(Phase 2; guard live since Phase 1)*
6. ✅ password — bcrypt check + **401 form**, 12 h **signed unlock cookie** *(Phase 2)*
7. ✅ device targeting — `device_rules` picks ios/android/desktop destination *(Phase 2)*
8. ✅ **302 redirect** (not 301) — analytics stay accurate

### 1.6 Async click tracking ✅
- `clickQueue.js`: in-memory queue → batched **transactional** inserts every 1 s / 200 events
- Redirect **never blocks** on DB (fire-and-forget after 302)
- **Durability:** flush on SIGTERM/SIGINT ✅, retry ×3 on failure, back-pressure early flush
- **Click-count bump is atomic SQL** (`WHERE max_clicks IS NULL OR click_count < max_clicks`) — no race ✅
- Captured per click: timestamp, referrer host, device/OS/browser (`ua-parser-js`), country/city (`geoip-lite`), source (`?src=qr` → qr)
- **Bot filtering** (`isbot`): stored with `is_bot=1`, excluded from all counts & limits ✅
- **Unique visitors:** first-party `lp_vid` cookie + ip-hash fallback; **raw IP never stored** (salted HMAC) ✅

### 1.7 Analytics API ✅ (all live from DB, nothing hardcoded)
- Per link: total clicks, unique visitors, timeseries (day/hour auto-bucket), top referrers, devices, OS, browsers, countries, cities, QR-vs-direct sources
- Dashboard summary: metrics + period filter (**today / 7d / 30d / custom from-to**) + top links
- Campaign analytics endpoint wired; Alerts API: expiring-soon / near-limit / disabled / **spike detection**

### 1.8 Frontend (React) ✅
Pages built: **Login, Register, Dashboard, Links list, Link detail (Overview + Analytics tabs), Create wizard** — single nav shell, responsive Tailwind, loading / empty / error states everywhere, Chart.js line + bar + doughnut, copy short-URL, JWT session handling, route guards.
(Pending pages — Campaigns, Tags/Folders, QR, Bulk Import, Bio, Settings, Admin — land in Phase 2–4.)

### 1.9 Quality & deliverables ✅
- **Tests:** 5/5 unit passing (alias validation, URL/self-ref safety, code uniqueness ×50, **click-limit atomicity under 8 concurrent bumps**, bot exclusion)
- **Smoke:** 14/14 end-to-end assertions (register → validate → create → 302 → 404 → analytics → dashboard → alerts)
- **Real browser E2E:** full UI flow PASS (login → dashboard 2,858 live clicks → filters → wizard with live alias check → publish → redirect to Wikipedia) — found & fixed a real CORS bug in single-service mode
- **Docs:** README (architecture + **ER mermaid** + **redirect flow mermaid** + API table + env vars + deploy steps), `DEMO.md`, `ROADMAP.md`
- **Seed:** 3 users (admin+2), 3 campaigns, 4 tags, 20 links (incl. disabled/expired/password/click-limited), **~4,300 realistic clicks over 30 days** ✅
- **Deploy configs:** `render.yaml` (single-service blueprint), `vercel.json`, `netlify.toml`, `.env.example` ✅ · git repo initialized, 55 files staged

### 1.10 How to run Phase 1
```bash
cd server && npm install && npm run seed && npm start   # http://localhost:3001 (API + SPA + redirects)
cd client && npm install && npm run dev                 # OR dev-mode UI on :5173 (proxied API)
cd server && npm test && node scripts/smoke.mjs         # verify
```
Logins: `admin@linkpulse.dev/admin1234` · `ada@example.com/password123` · `grace@example.com/password123`

---

## 🚩 Phase 2 — Redirect rules + organization (COMPLETE ✅)

Scope: redirect rules 4–7, full wizard options, campaigns, tags/folders, rate limiting (done in Phase 1), dashboard campaign filter.

### 2.1 Redirect rules 4–7 ✅ (`redirectRoutes.js`)
- **Rule 4 expiry:** past `expires_at` → link **auto-marked `expired`** (row never deleted, analytics traceable) → 410 branded expired page
- **Rule 5 click limit:** fresh indexed count read (cached count can lag the async queue) → 410 limit page the moment the guarded atomic counter reaches `max_clicks`; bots never count toward it
- **Rule 6 password:** GET → 401 unlock form (`POST /:code`, urlencoded) → **bcrypt** verify → **12 h JWT-signed httpOnly cookie** bound to the link id (no re-ask; tamper/expiry safe); wrong password re-shows form with error
- **Rule 7 device targeting:** `device_rules` JSON `{ios,android,desktop}` + `deviceClass(req)` from UA → per-device destination, falls back to default; only validated http(s) targets used
- Full pipeline order preserved: rules that ran in Phase 1 unchanged; verified by smoke (see 2.6)

### 2.2 Link settings — `PATCH /api/links/:id` ✅ (`linkService.updateLink`)
- Owner-only; updates destination (re-validated + blocklist-checked), title, campaign/folder (FK-verified), tags (replace), `expiresAt`, `maxClicks` (can't be set below current count), password (set **or** clear), device rules, status
- Future expiry on an `expired` link auto-revives it; activating a still-past-expiry link is rejected with a clear message
- Every update **busts the LRU redirect cache** → settings take effect instantly (proven in smoke)

### 2.3 Campaigns / tags / folders API ✅ (`orgService.js`, `orgRoutes.js`)
- `/api/campaigns` CRUD — list carries live **link_count / clicks / uniques** (bot-excluded); delete keeps links (FK `SET NULL`)
- `/api/tags` list w/ counts + rename + delete (tags created implicitly by the wizard); `/api/folders` (workspaces) CRUD
- Links list new filters: `?campaignId=&tagId=&folderId=`
- Dashboard summary `?campaignId=` now scopes **all** metrics incl. active/total link counts

### 2.4 Frontend ✅
- **Wizard Step 2 complete:** campaign + folder pickers **with inline "+ Add"**, tags, expiry (datetime-local, locale→UTC), max clicks, password; review panel echoes everything; publish sends all fields
- **Campaigns page:** stat cards, "top performer" badge, inline create/rename/delete, expandable analytics panel (7d/30d/90d toggle, click trend, top countries), "View links" deep filter
- **Tags & Folders page:** manage both, per-item link counts, one-click filtered link lists
- **Link detail: new Settings tab** (everything the PATCH supports + Reactivate button for expired links); Overview now shows Folder
- **Links list:** campaign/tag/folder filter chips with ✕ clear; **Dashboard:** campaign dropdown next to period toggle
- New nav: Campaigns 🎯, Tags & Folders 🏷️

### 2.5 Bug found & fixed during browser E2E ✅
- `Organize.jsx` crashed the SPA (`y.map is not a function`) — API returns `{tags:[]}`/`{folders:[]}` envelopes; hook now unwraps. Re-verified: no console errors anywhere.

### 2.6 Verification ✅
- **Unit tests 7/7** — added `deviceClass` UA mapping (ios/android/desktop) + `updateLink` suite (password set/clear, expire→revive, past-expiry activation guard, unknown campaign, ownership 403)
- **Smoke 33/33** — added 19 Phase-2 end-to-end assertions: past-expiry link → 410; 2-click limit enforced after queue flush → 410; password 401 form → wrong pw 401 → right pw 302 + `lp_pw` cookie → cookie revisit skips form; iPhone UA → ios rule / desktop → default; PATCH clear-password applies instantly; campaigns/folders/tags CRUD, filtered lists, campaign-scoped dashboard, campaign delete keeps links
- **Browser E2E (2 runs)** — 9/9 + 3/3 steps PASS: dashboard campaign filter (2,867→1,514 clicks, counts scoped), campaign analytics panel with chart, folder create/rename flows, wizard publish with options, live password gate on `uitest-p2-wiki`, protection removal + instant redirect, Folder shown on Overview — final run: **zero console errors**

## 🚩 Phase 3 — QR, bulk & admin (COMPLETE ✅)

Scope: QR codes, CSV bulk import, admin panel + blocklist, platform analytics & abuse alerts, bot/limit polish.

### 3.1 QR codes ✅ (`qrRoutes.js`, QR panel in Link detail)
- `GET /api/qr/:code.png` and `/:code.svg` — public (`<img>`/download-link friendly, no Bearer needed), `size` param (64–2048px), cached 1 day
- QR encodes `${BASE_URL}/${code}?src=qr` → **every scan is attributed to source "qr" in analytics** (tracking was already live from Phase 1)
- Detail Overview: QR preview card with size selector, PNG/SVG download buttons, live `<img>` re-render

### 3.2 CSV bulk import ✅ (`importService.js` + `Import.jsx`)
- Client parses CSV with **papaparse** (file picker or paste, flexible headers: url/destination/link…, alias/code…, title/name…) → posts rows to server
- `POST /api/links/import/preview` — per-row validation **without writes**: URL safety, blocklist (+subdomains), alias format/reserved, existing alias, in-batch duplicate alias/url → table with OK/issue badges
- `POST /api/links/import` — imports valid rows only (reuses `createLink`), report `{imported, failed[line,reason]}`; **error-report CSV download** (Blob)
- Guards: max 500 rows per run, `importLimiter` 10 runs/h/user, JSON body limit raised to 1 MB for big imports

### 3.3 Admin panel ✅ (`adminRoutes.js` all `requireAuth + requireAdmin`, `Admin.jsx`)
- **Links tab:** platform-wide search (url/code/owner email) + status filter + pagination, owner email shown; **disable with reason → instant** (DB + LRU cache bust, 410 page shows the reason) / **enable** restores redirect immediately
- **Users tab:** list with link counts + total clicks, search
- Client `/admin` route guarded (non-admin redirected to Dashboard; nav item hidden for non-admins)

### 3.4 Blocklist CRUD + enforcement ✅
- `GET/POST/DELETE /api/admin/blocklist` — input normalized to bare domain (`https://Spam.com/x?a=1` → `spam.com`), 409 on duplicate
- Enforcement already live and now fully wired: creation 400, redirect 403, **subdomains inherit** the parent block, un-block restores both instantly

### 3.5 Platform analytics & abuse alerts ✅ (`adminService.js`)
- `GET /api/admin/stats`: users/links/clicks totals, active/disabled/expired split, unique visitors, **bot ratio**, 14-day timeseries, top links (with owners), top destination domains
- `GET /api/admin/alerts`: **bot-heavy links** (>50% bots, ≥20 clicks), **click spikes** (≥10/24h and ≥3× previous), **new-user bulk creation** (>10 links in first 24h) — shown as amber cards in Admin Overview

### 3.6 Polish & bug found in E2E ✅
- **Click-limit batch clamp:** queue bump now `CASE WHEN … <= max_clicks THEN +n ELSE max_clicks` — a batch can never overshoot the limit (dialect-neutral SQL, no MIN/LEAST divergence)
- **All redirect interstitials + 302s send `Cache-Control: no-store`** — found by browser E2E: heuristic caching kept showing a stale 410 "disabled" page after admin re-enabled the link; pinned with a smoke assertion

### 3.7 Verification ✅
- **Unit tests 9/9** — added blocklist normalization + subdomain inheritance + un-block test, CSV row-validation test (6 malformed/valid row classes, proves preview writes nothing)
- **Smoke 52/52** — added 19 Phase-3 assertions: QR PNG magic bytes / SVG markup / 404, admin 403 for non-admins, blocklist add-dup-enforce(400)-remove, import preview 1-valid-4-invalid + blocked-domain flag + valid-only import + link exists, disable→410-with-reason→no-store→enable→302, admin links/users/stats/alerts endpoints
- **Browser E2E (10 steps)** — QR panel incl. 640px re-render, full CSV import flow via UI (sample → validate → 2 imported/1 failed → error report), admin moderation on seeded `d1000` incl. live 410 page with reason, blocklist add/remove, non-admin nav/guard checks — **zero console errors** (2 issues found & fixed: missing `requireAuth` on admin router, stale cached 410)

## 🚩 Phase 4 — Bio, polish & hardening (COMPLETE ✅)

Scope: link-in-bio pages, device-targeting UI, dashboard alerts polish, seed realism, expanded tests.

### 4.1 Link-in-bio pages ✅ (`bioService.js`, `bioRoutes.js`, `Bio.jsx`, `pages.js`)
- Schema extended: `bio_pages.theme` + `updated_at` (additive idempotent migration in `db/index.js` - works on live DBs, SQLite & Postgres)
- `/api/bio` CRUD (auth): slug validation (2–40 chars, lowercase, reserved-name safe), unique slug per platform (409), max 10 pages/user, link ordering with per-button custom label + emoji, FK-verified links (can't attach foreign links), owner checks everywhere
- **Public `GET /bio/:slug`** — server-rendered (no JS needed, indexable, `no-store`), 5 themes (dark/light/brand/sunset/ocean) as pure-CSS gradients, buttons point at `/{code}?src=bio` → every tap goes through the **full redirect engine** (password/expiry/limit rules still apply) and is tracked; inactive links auto-hidden from the page but kept in the editor
- `?src=` attribution whitelisted (`qr, bio, email, sms, social, ad`) - arbitrary query values can no longer pollute analytics
- Editor UI (`/bio`): page list + create, content/theme form, link picker, ▲▼ reorder with unsaved-order hint, live public-page preview iframe, open/copy buttons

### 4.2 Device-targeting UI ✅ (wizard + Settings)
- Create wizard Step 2: collapsible "📱 Device targeting" panel (ios/android/desktop), client-side http(s) validation, only filled targets sent, review + success screen show the rules ("📱 N device targets")
- Link Settings tab: same three inputs prefilled from `device_rules`, cleared = falls back to main destination; Overview shows "📱 N rules"
- Seeded `d1005` ships 3 live rules (iPhone → App Store, Android → Play, desktop → GitHub) for the demo

### 4.3 Dashboard alerts polish ✅ (`analyticsService.getAlerts` + `Dashboard.jsx`)
- Every alert now carries a human `message` + `severity` (info/warn/critical): expiring soon ("Stops redirecting in 5h"), near/at click limit (2 classes), expired (with date), disabled (with admin reason), spikes
- Panel: severity-ranked (critical first), coloured ring per severity, "Show all / Collapse" beyond 5, each row deep-links to the affected link; stat card shows "N need action now"

### 4.4 Seed realism ✅
- Folders attached to seeded links, device rules on d1005, ada's `/bio/ada` page with 5 labelled buttons, a slice of its clicks attributed to `source='bio'` so the analytics "Bio" source card is non-empty out of the box

### 4.5 Bugs found & fixed during browser E2E ✅
- **Cross-owner seed leak (real):** seed assigned grace's "Conference 2026" campaign + `event` tag to ada's links → Settings save for ada 400'd ("Unknown campaign") on **every** save (form PATCHed the invisible foreign id back), and another user's campaign name leaked through the list/detail joins. Fixed: owner-matched seed arrays + defensive `forOwner()` filter, client drops prefill ids not in the user's own list, and a **new smoke invariant** asserts no link references a campaign its owner doesn't own
- **Tags-only PATCH silently dropped:** `updateLink` early-returned before the tags block when no column changed - tags now applied first; unit test pins set→replace→clear behaviour
- Minor: wizard success screen lacked any options indicator - now shows password/expiry/max-clicks/device badges

### 4.6 Verification ✅
- **Unit tests 12/12** — added: bio pages (slug rules, ordering, ownership, public view hides inactive), **redirect rule-ORDER integration over HTTP** (disabled > expiry > limit > password > device on one live server), foreign-campaign rejection + tags-only PATCH
- **Smoke 73/73** — added 21 Phase-4 assertions: alert messages/severity, ownership invariant, bio slug 400/409, foreign-link attach rejected, ordered PUT, public page render (theme css, button order, inactive hidden), `?src=bio` click attribution through the redirect, device-targeted seeded link, rename/theme PATCH, delete → 404
- **Browser E2E (2 runs)** — first run: 6 steps, found the seed-leak bug (step 5 FAIL with exact PATCH body); after fix + reseed: **6/6 PASS, zero console errors** — Settings save 200, tags-only save persists after reload, d1005 Overview shows own campaign, success-screen badges render, bio theme change goes live, public page clicks redirect through `?src=bio`

---

## Known decisions / deviations (simplest sensible option chosen)
1. `bcrypt` → **`bcryptjs`** (API-identical, no native compiler on Windows/CI/Render).
2. Spec'd SQLite lib → **Node built-in `node:sqlite`** (better-sqlite3 has no Node-24 Windows prebuilds; zero deps).
3. Timestamps stored as **ISO-8601 TEXT** → same SQL runs on SQLite & Postgres.
4. Deploy shape: **single Render service** (server serves built SPA + API + redirects) — `VITE_API_BASE` only needed for the Vercel/Netlify split.
5. First registered user becomes admin (seed script creates the real admin account).
6. CSV import parses **client-side (papaparse)** + JSON rows to the API instead of multer multipart upload — simpler, no file storage, same UX (preview → import → error report).
7. **No link-delete endpoint by design** — links are disabled/expired, never deleted (analytics stay traceable; matches the "never delete expired/disabled" rule).

## Verification evidence
**Phase 1 gate:** `npm test` 5/5 · smoke 14/14 · browser E2E PASS (fixed CORS bug) · seeded server live locally
**Phase 2 gate:** `npm test` → **7/7** · `node scripts/smoke.mjs` → **33/33 "SMOKE: ALL PASSED"** (rules 4–7, PATCH, org CRUD) · browser E2E: 9/9 + 3/3 steps, **zero console errors**
**Phase 3 gate:** `npm test` → **9/9** · `node scripts/smoke.mjs` → **52/52 "SMOKE: ALL PASSED"** (QR, import, admin, blocklist, no-store) · browser E2E: 10 steps, 9 PASS + 1 fixed-and-repinned, **zero console errors**
**Phase 4 gate:** `npm test` → **12/12** · `node scripts/smoke.mjs` → **73/73 "SMOKE: ALL PASSED"** (bio pages, `?src=bio`, alert messages, ownership invariant) · browser E2E: seed-leak bug found → fixed → re-run **6/6, zero console errors**
Local server: running & seeded at `http://localhost:3001` · Live URL: ⏳ pending your `git push` + Render Blueprint click (steps in README → Deployment)
