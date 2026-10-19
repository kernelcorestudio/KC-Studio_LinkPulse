# 📋 Product Requirements Document (PRD) — LinkPulse

```
========================================================================================
PRODUCT NAME     : LinkPulse
DOCUMENT VERSION : 2.0.0
AUTHORS          : Product Management & Architecture Guild
TARGET AUDIENCE  : Engineers, UI/UX Designers, Product Managers, QA Leads
STATUS           : APPROVED & FULLY IMPLEMENTED (Production Release v2.0.0)
========================================================================================
```

---

## 1. Product Overview & Vision

LinkPulse is a next-generation URL shortening, dynamic traffic routing, and real-time click telemetry platform. It bridges the gap between raw edge infrastructure and user-friendly digital marketing tools, empowering businesses, marketers, and creators to deploy smart links that automatically adapt based on visitor hardware, enforce granular access controls, and capture real-time analytics without degrading redirection speeds.

---

## 2. Target User Personas

### Persona A: Sarah — Senior Growth Marketer
* **Profile:** Runs multi-channel paid acquisition campaigns across Meta, TikTok, Google Ads, and influencer networks.
* **Goals:** Deploy short links with custom branded aliases; direct mobile traffic to native app stores and desktop traffic to landing pages; analyze live click timelines by geographic region.
* **Pain Points with Existing Tools:** Stale analytics data with 1-hour delays; inability to route iOS vs. Android users from a single link; high subscription fees for basic features.

### Persona B: Alex — Digital Content Creator & Influencer
* **Profile:** Has 250,000+ followers across Instagram, YouTube, and X; requires a central bio hub to showcase sponsorships, merchandise, and latest videos.
* **Goals:** Create a customizable mobile landing page (`/bio/alex`); view which specific links drive the most clicks; generate printable QR codes for event merchandise.
* **Pain Points with Existing Tools:** Cookie-cutter bio platforms charge monthly fees for simple custom themes; lack of detailed click source attribution (`?src=qr` vs `?src=bio`).

### Persona C: David — Enterprise Infrastructure Administrator
* **Profile:** Responsible for brand safety, cyber compliance, and platform uptime.
* **Goals:** Prevent bad actors from using the platform for malware or phishing; enforce domain blocklists that cascade to subdomains; identify bot-driven click spikes immediately.
* **Pain Points with Existing Tools:** URL shorteners frequently get flagged on global blacklists because administrative moderation is manual and reactive.

---

## 3. User Journey Maps

### Journey 1: Creating a Device-Targeted & Password-Gated Link
```
[ Marketer Dashboard ]
        │
        ▼
[ Click "Create Link" Wizard ]
        │
        ├─► Step 1: Input Destination URL (e.g., https://myapp.com)
        │           Enter Custom Alias (e.g., "spring-drop")
        │           System triggers real-time debounce check (GET /api/links/available)
        │
        └─► Step 2: Advanced Capabilities
                    ├── Device Rules: iOS ➔ App Store | Android ➔ Google Play
                    ├── Expiration: Select UTC timestamp
                    ├── Quota: Set Maximum Click Limit (CAS CAS-protected)
                    └── Password Gate: Enter plaintext password (auto-hashed with bcrypt)
        │
        ▼
[ Click "Publish Link" ] ──► Instant Cache Warming ──► Link Live in < 5ms
```

### Journey 2: Visitor Resolving a Password-Protected Short Link
```
[ Visitor enters: https://pulse.to/spring-drop ]
        │
        ▼
[ Edge Engine: Rule 6 (Password Required) ]
        │
        ├─► Visitor has valid "lp_pw" cookie? ──► YES ──► Continue to Device Target
        │
        └─► NO: Render HTTP 401 Protected Link Form
                    │
                    ▼
            [ Visitor enters password ]
                    │
                    ▼
            [ POST /spring-drop ] ──► bcrypt.compare()
                    │
                    ├── Success ──► Set Signed 12-Hour httpOnly Cookie ──► HTTP 302 Found
                    └── Failure ──► Re-render 401 Form with "Invalid Password" error
```

---

## 4. Detailed Functional Requirements Matrix

### Epic 1: Authentication & Workspace Identity
* **FR-1.1:** The system shall support secure user registration and login utilizing email and password credentials, with passwords hashed via `bcryptjs` (salt rounds: 10).
* **FR-1.2:** The system shall issue standard JSON Web Tokens (JWT) with a 7-day validity period, stored securely and sent via `Authorization: Bearer <token>` headers.
* **FR-1.3:** The system shall support Google Identity Services (GIS) / OAuth 2.0 single-click sign-in.
* **FR-1.4:** The initial registered user shall automatically receive system `admin` privileges; subsequent registrations shall default to standard `user` status.
* **FR-1.5:** Strict row-level ownership checks shall be enforced on all CRUD operations (returns HTTP 403 Forbidden on unauthorized cross-tenant requests).

### Epic 2: Two-Step Link Creation & Validation Wizard
* **FR-2.1:** **Step 1 (Basic Details):** Users can input a destination URL and an optional custom alias.
* **FR-2.2:** Real-time alias availability checks (`GET /api/links/available?alias=...`) shall validate against collision, format constraints (alphanumeric, dashes, underscores, length 3–50), and reserved system keywords (`admin`, `api`, `bio`, `login`, `register`, `dashboard`).
* **FR-2.3:** The system shall reject self-referencing loops (destination URL pointing back to the LinkPulse platform host).
* **FR-2.4:** Automated short codes shall be generated using Base62 Nanoid (6 to 8 characters) with recursive collision retry logic.
* **FR-2.5:** **Step 2 (Advanced Rules):** Users can configure Campaigns/Folders, Tags, UTC expiration timestamps, maximum click caps, bcrypt passwords, and device routing rules (iOS, Android, Desktop).

### Epic 3: 8-Step Edge Redirection Engine
* **FR-3.1:** Incoming `GET /:code` requests must be evaluated in a deterministic 8-step state machine:
  1. *Cache Lookup:* In-memory LRU cache retrieval (< 1ms). Negative caching for non-existent links.
  2. *Status Check:* Disabled links immediately serve a branded HTTP 410 Gone page detailing the administrative reason.
  3. *Blocklist Filter:* Destination domain checked against active blocklist; blocks render an HTTP 403 Shield page.
  4. *Expiry Guard:* If current UTC > `expires_at`, link status is auto-updated to `expired` and serves an HTTP 410 Expired page (link is never deleted).
  5. *Click Limit Guard:* Fresh atomic database count evaluated. If `click_count >= max_clicks`, serves an HTTP 410 Quota Reached page.
  6. *Password Gate:* If password is set, validates `lp_pw` signed cookie or renders HTTP 401 unlock form.
  7. *Device Routing:* Evaluates User-Agent. Dispatches to `ios_url`, `android_url`, or `desktop_url` if configured.
  8. *Dispatch:* Emits HTTP 302 Found redirect with `Cache-Control: no-store` headers.

### Epic 4: Asynchronous Telemetry & Analytics Engine
* **FR-4.1:** Redirect execution shall never block on database writes. Click events are buffered into an in-memory queue and flushed in transactional micro-batches every 1 second or upon accumulating 200 items.
* **FR-4.2:** Each click event must capture: Timestamp, Referrer domain, Device family, OS, Browser engine, Country, City, and Attribution Source (`?src=qr`, `?src=bio`, `?src=email`, etc.).
* **FR-4.3:** Known search engine crawlers and web bots (`isbot`) must be flagged with `is_bot = 1` and excluded from all click totals and quota caps.
* **FR-4.4:** Visitor uniqueness must be tracked using a first-party `lp_vid` cookie with fallback to salted SHA-256 IP hashing. Raw IP addresses must never be stored.
* **FR-4.5:** The dashboard shall render a monotone cubic spline wave chart (`#FFE3B3`) with dynamic period aggregation (Today, 7 Days, 30 Days, Custom Range).

### Epic 5: Link-in-Bio Landing Page Creator
* **FR-5.1:** Authenticated users can create up to 10 branded bio landing pages accessible via `GET /bio/:slug`.
* **FR-5.2:** Bio pages must be server-rendered HTML for maximum speed and SEO indexing, requiring zero client-side JavaScript execution.
* **FR-5.3:** The platform must provide 5 curated CSS gradient themes: *Dark Cyber*, *Clean Light*, *Brand Orange*, *Sunset Horizon*, and *Ocean Deep*.
* **FR-5.4:** Users can attach links, customize button labels and emojis, and re-order links via intuitive drag/reorder controls.
* **FR-5.5:** Every bio link tap routes through `/:code?src=bio`, ensuring full security rule enforcement and dedicated source tracking.

### Epic 6: Administration, Security & Abuse Prevention
* **FR-6.1:** Administrators can search all platform links, inspect destination URLs, view creator emails, and globally disable links with custom reasons.
* **FR-6.2:** Domain blocklist management (`/api/admin/blocklist`) shall automatically normalize domains and recursively inherit subdomains (e.g., blocking `evil.com` automatically blocks `phishing.evil.com`).
* **FR-6.3:** Real-time abuse heuristics must identify:
  * *Bot-Heavy Links:* Links where > 50% of traffic is automated bots (min 20 clicks).
  * *Click Velocity Spikes:* Links experiencing a 3x traffic acceleration over a 24-hour baseline.
  * *New User Bulk Spikes:* Accounts creating > 10 links within their first 24 hours.

---

## 5. Non-Functional Requirements (NFRs)

| Category | Requirement Metric | Validation Method |
|:---|:---|:---|
| **Performance** | Internal cache-hit redirect latency < 1.0ms; uncached < 15ms | Automated latency benchmarks |
| **Throughput** | Support 2,500+ redirects/sec on single Node.js instance | Load testing via Autocannon / k6 |
| **Availability** | 99.99% redirect uptime; graceful queue drain on SIGTERM | Chaos testing & automated signal tests |
| **Scalability** | Support 10,000,000+ total click events without query degradation | Composite B-Tree indexing on `(link_id, clicked_at)` |
| **Security** | Zero raw IP storage; bcrypt password storage; JWT signature check | Security audit & automated STRIDE review |
| **Usability** | 100% responsive interface across mobile, tablet, and desktop | Mobile viewport testing |
