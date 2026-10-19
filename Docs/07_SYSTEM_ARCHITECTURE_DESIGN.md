# 🏛️ System Architecture Design Document (HLD) — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : High-Level Architecture Design Document (HLD)
VERSION          : 2.0.0
STATUS           : PRODUCTION ARCHITECTURE APPROVED
========================================================================================
```

---

## 1. Architectural Principles & System Topology

LinkPulse is engineered around four core architectural tenets:
1. **Zero-Blocking Redirect Latency:** The critical path of resolving a short code and emitting an HTTP 302 Found response must never be bottlenecked by database disk I/O or lock contention.
2. **Decoupled Asynchronous Persistence:** Visitor telemetry enrichment and aggregation run out-of-band via an in-memory micro-batch queue.
3. **Environment Portability (Dual-Dialect Storage):** Zero-friction local development on native `node:sqlite` combined with enterprise cloud scalability on PostgreSQL (Supabase / AWS RDS).
4. **Defense-in-Depth Edge Security:** Recursive domain blocklists, bcrypt password verification, signed tamper-proof cookies, and salted HMAC IP anonymization.

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                               LINKPULSE SYSTEM TOPOLOGY                               │
└───────────────────────────────────────────────────────────────────────────────────────┘

  [ Web Visitor / QR Scanner ]                     [ Marketing / Admin User ]
               │                                                │
               ▼                                                ▼
  ┌─────────────────────────┐                      ┌─────────────────────────┐
  │ Cloudflare / Edge CDN   │                      │ Single-Page App (SPA)   │
  │ • SSL Termination       │                      │ • React 18 + Vite 6     │
  │ • DDoS Shield           │                      │ • Tailwind CSS + Icons  │
  └────────────┬────────────┘                      │ • Chart.js Spline Wave  │
               │                                   └────────────┬────────────┘
               ▼                                                │
  ┌─────────────────────────────────────────────────────────────▼───────────────────────┐
  │                       EXPRESS.JS APPLICATION GATEWAY CORE                           │
  │                                                                                     │
  │  ┌───────────────────────────┐                 ┌───────────────────────────┐        │
  │  │   REDIRECT ROUTE ENGINE   │                 │      REST API ENGINE      │        │
  │  │  • LRU In-Memory Cache    │                 │  • Auth & Google GIS      │        │
  │  │  • 8-Step Pipeline Guard  │                 │  • Link & Bio Management  │        │
  │  │  • Device Routing Engine  │                 │  • Admin Abuse Monitor    │        │
  │  │  • Password Cookie Gate   │                 │  • Analytics Aggregator   │        │
  │  └─────────────┬─────────────┘                 └─────────────┬─────────────┘        │
  │                │                                             │                      │
  │                ▼                                             │                      │
  │  ┌───────────────────────────┐                               │                      │
  │  │   ASYNC CLICK QUEUE       │                               │                      │
  │  │  • 1s / 200 item buffer   │                               │                      │
  │  │  • Geolocation & UA parse │                               │                      │
  │  │  • Salted HMAC IP Hash    │                               │                      │
  │  │  • Bot Filtering (isbot)  │                               │                      │
  │  └─────────────┬─────────────┘                               │                      │
  └────────────────┼─────────────────────────────────────────────┼──────────────────────┘
                   │ (Async Batch Writes)                        │ (Sync Transactions)
                   ▼                                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                           DATABASE ABSTRACTION ADAPTER                              │
  │             (Translates Unified SQL Codebase across Dialects: ? ➔ $n)               │
  └───────────────────────────────┬───────────────────────────────┬─────────────────────┘
                                  │                               │
                 ┌────────────────┴──────────────┐ ┌──────────────┴────────────────┐
                 │ PRODUCTION CLOUD DEPLOYMENT   │ │ LOCAL DEVELOPMENT ENVIRONMENT  │
                 │ • Supabase / PostgreSQL 15+   │ │ • Native Node.js node:sqlite   │
                 │ • PgBouncer Pooler (Port 6543)│ │ • Zero external dependencies   │
                 │ • Transaction Mode Pooling    │ │ • File: linkpulse.db           │
                 └───────────────────────────────┘ └────────────────────────────────┘
```

---

## 2. Core Subsystem Architecture

### 2.1 The Edge Redirect Gateway Subsystem
* **Responsibility:** Handles incoming requests for `GET /:code`.
* **Execution Flow:**
  1. Requests bypass disk I/O by executing an immediate lookup against the in-memory LRU cache (`Map`-based cache with a maximum capacity of 10,000 links and TTL eviction).
  2. If the link is not in memory, the database is queried, and the result is cached. Negative caching (caching 404s for 30 seconds) prevents cache-stampede attacks on invalid codes.
  3. The link enters the **8-Step Enforcement Pipeline** (Status Guard ➔ Domain Blocklist ➔ Expiry Verification ➔ Click Quotas ➔ Password Verification ➔ Device Evaluation ➔ HTTP 302 Found).
  4. Response headers enforce `Cache-Control: no-store, no-cache, must-revalidate` to ensure browsers do not cache the redirect and bypass telemetry.

### 2.2 The Asynchronous Micro-Batch Event Queue Subsystem
* **Responsibility:** Captures, enriches, and persists click events without stalling user redirects.
* **Mechanism (`ClickQueue.js`):**
  * When a redirect succeeds, metadata (`code`, `userAgent`, `ip`, `referrer`, `timestamp`, `source`) is pushed to an in-memory array (`queue`).
  * A recurring timer fires every 1,000 milliseconds. If `queue.length >= 200` before the timer expires, an immediate batch flush triggers.
  * **Enrichment Pipeline:**
    * *Device & Browser:* Evaluated via `ua-parser-js` (Device Class: `mobile`, `tablet`, `desktop`; OS; Browser).
    * *Geolocation:* City and Country resolved via `geoip-lite`.
    * *Bot Detection:* Identified via `isbot`. Flagged records receive `is_bot = 1`.
    * *Privacy Anonymization:* IP address is hashed using SHA-256 HMAC combined with an internal rotating salt. Raw IPs are discarded immediately.
  * **Transactional Ingestion:** Events are committed in a single multi-row SQL `INSERT` transaction, accompanied by atomic CAS increment queries on parent link records.
  * **Shutdown Hook:** The process listens for `SIGTERM` and `SIGINT` signals, halting incoming requests and flushing all buffered events before process termination.

### 2.3 The Dual-Dialect Database Adapter Subsystem
* **Responsibility:** Provides seamless multi-engine SQL execution without ORM bloat or dual codebases.
* **Implementation (`server/src/db/index.js`):**
  * Evaluates environment variable `DATABASE_URL`.
  * If `DATABASE_URL` is set, initializes a connection pool (`pg.Pool`) connecting to PostgreSQL. Automatically translates SQL placeholders from SQLite style (`?`) to PostgreSQL positional parameters (`$1, $2, ...`).
  * If `DATABASE_URL` is unset, initializes `node:sqlite` reading from `linkpulse.db`.
  * Manages transaction life-cycles: `begin()`, `commit()`, and `rollback()`.
  * Runs idempotent schema migrations (`schema.pg.sql` or `schema.sqlite.sql`) automatically at boot.

### 2.4 Server-Rendered Bio-Page Subsystem
* **Responsibility:** Serves creator profiles at `GET /bio/:slug`.
* **Architecture:**
  * Uses pure server-side HTML synthesis (`pages.js`) without heavy template engines or client JavaScript dependencies.
  * Generates SEO-compliant HTML containing OpenGraph social metadata tags (`og:title`, `og:image`, `og:description`).
  * Injects pure-CSS gradient themes (Dark, Light, Brand, Sunset, Ocean).
  * Automatically filters out inactive or expired links while preserving them in the creator's management dashboard.
  * All outbound button clicks route through `/:code?src=bio`, integrating natively with the 8-Step pipeline and attribution logging.

---

## 3. Cross-Cutting Engineering Concerns

### 3.1 Concurrency & Race Condition Elimination
Under high-velocity traffic (e.g., flash sales or influencer shoutouts), thousands of visitors access the same short link concurrently. Standard read-modify-write patterns (`clicks = clicks + 1`) suffer catastrophic lost-update anomalies. LinkPulse solves this by executing atomic SQL updates:
```sql
UPDATE links
SET click_count = click_count + $batch_count,
    last_clicked_at = $timestamp
WHERE id = $link_id
  AND (max_clicks IS NULL OR click_count < max_clicks);
```
This guarantees that click limits cannot be oversubscribed regardless of concurrency levels.

### 3.2 Cache Invalidation Architecture
* In-memory LRU cache maintains an instant mapping of `code -> linkData`.
* Any mutation operation—including link updating (`PATCH /api/links/:id`), admin deactivation, or temporal expiration—triggers an explicit cache eviction hook: `lruCache.delete(code)`.
* This ensures administrative actions take effect within 1 millisecond globally.

### 3.3 Scalability & Capacity Planning
* **Edge Throughput:** A single t3.medium / standard serverless container processes ~2,500 redirects/sec from in-memory cache.
* **Database Scaling:** Utilizing PgBouncer transaction-mode pooling (port 6543) enables 1,000+ concurrent serverless lambda instances to share 15 database backend connections without connection exhaustion.
