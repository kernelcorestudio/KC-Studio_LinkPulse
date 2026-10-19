# ⚖️ Feasibility Study & Risk Management Analysis — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : Enterprise Engineering Feasibility & Risk Register
LIFECYCLE STAGE  : Pre-Project Feasibility & Production Resilience Governance
VERSION          : 2.0.0
========================================================================================
```

---

## 1. Feasibility Study

### 1.1 Technical Feasibility
The LinkPulse architecture was subjected to rigorous technical assessment across four core dimensions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TECHNICAL FEASIBILITY                           │
├───────────────────────┬────────────────────────────────────────────────┤
│ DIMENSION             │ TECHNICAL EVALUATION & VERIFICATION RESULT     │
├───────────────────────┼────────────────────────────────────────────────┤
│ Runtime Performance   │ Node.js 24 LTS + V8 JIT engine handles 50,000+ │
│                       │ lightweight async operations/sec. In-memory    │
│                       │ LRU cache delivers < 0.2ms microsecond lookup. │
├───────────────────────┼────────────────────────────────────────────────┤
│ Storage Decoupling    │ Transactional micro-batch queue (1s / 200 items│
│                       │ eliminates DB locking from redirect latency.   │
├───────────────────────┼────────────────────────────────────────────────┤
│ Network & Serverless  │ Fully compatible with Vercel Serverless and    │
│                       │ persistent Node.js runtimes (Render, Fly.io). │
├───────────────────────┼────────────────────────────────────────────────┤
│ Dual Database Engine  │ Dialect translation layer supports Postgres    │
│                       │ and built-in `node:sqlite` with zero code fork.│
└───────────────────────┴────────────────────────────────────────────────┘
```

* **Vercel Serverless Compatibility:** The application cleanly encapsulates API endpoints, server-rendered Bio routes, and edge redirect logic into a single serverless entrypoint (`api/index.js`), meeting Vercel's 10-second serverless execution limits.
* **Database Driver Portability:** The internal database abstraction layer (`server/src/db/index.js`) auto-detects environment variables (`DATABASE_URL`). When present, it instantiates `pg.Pool`; when absent, it defaults to Node.js's native `node:sqlite`. Both engines execute unified schema migrations idempotently.

### 1.2 Operational Feasibility
* **Developer Velocity:** By eliminating complex local Docker or external database requirements (using native `node:sqlite` locally), new engineers can clone the repository and launch a fully functional, seeded development environment in under 60 seconds (`npm run seed && npm start`).
* **Operational Overhead:** Decoupling the write queue minimizes operational maintenance. The system does not require external message broker infrastructure (like Apache Kafka or RabbitMQ) for moderate-to-high scale (up to 10M clicks/month), dramatically simplifying operations.

### 1.3 Economic Feasibility (Total Cost of Ownership - TCO)
* **Compute Costs:** Deployable within Vercel's Hobby / Pro tiers ($0–$20/mo) and Supabase's Free / Pro tier ($0–$25/mo).
* **Database IOPS Savings:** By batching click events (200 clicks = 1 SQL transaction), database write operations are reduced by **99.5%**, avoiding high IOPS billing charges on cloud databases.

---

## 2. Enterprise Risk Register & Mitigation Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                          RISK SEVERITY MATRIX                          │
│                                                                        │
│     HIGH    │  [R-02: DB Pool]  │  [R-01: IPv6 Vercel]                 │
│             │  [R-05: Phishing] │  [R-03: CAS Race]                    │
│  IMPACT     ├───────────────────┼──────────────────────────────────────┤
│             │  [R-06: Bot Crawl]│  [R-04: Stale LRU]                   │
│     LOW     │  [R-07: Bio Dirty]│  [R-08: Queue Mem]                   │
│             └───────────────────┴──────────────────────────────────────┘
│                   LOW                      HIGH                        │
│                               LIKELIHOOD                               │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Risk Assessment

| Risk ID | Risk Description | Likelihood | Impact | Severity | Preventive & Remedial Mitigation Strategy |
|:---|:---|:---:|:---:|:---:|:---|
| **R-01** | **Vercel Serverless IPv6 Resolution Failure** (`ENOTFOUND db.xxxx.supabase.co`) | HIGH | CRITICAL | **CRITICAL** | **Strategy:** Supabase direct host (`db.xxx.supabase.co`) is IPv6-only and fails on Vercel's IPv4 network. **Mitigation:** Mandate IPv4 connection pooler endpoints (`aws-0-[region].pooler.supabase.com:5432` / `:6543`) with `sslmode=require` in all production configs. |
| **R-02** | **Database Pool Exhaustion** under viral traffic surges (`EMAXCONNSESSION`) | MED | CRITICAL | **CRITICAL** | **Strategy:** Connecting to port 5432 in session mode creates a dedicated backend process per serverless lambda, exhausting max client slots. **Mitigation:** Route `DATABASE_URL` strictly through PgBouncer on port `6543` (transaction mode), multiplexing thousands of requests across a pool of 15 connections. |
| **R-03** | **Click Limit Quota Oversell / CAS Race Condition** under 100+ concurrent clicks | HIGH | HIGH | **HIGH** | **Strategy:** Traditional `SELECT clicks; UPDATE clicks + 1;` suffers race conditions. **Mitigation:** Implement strict atomic SQL Compare-And-Swap (CAS): `WHERE click_count < max_clicks`. Evaluated directly inside DB transaction engine; verified with 8 parallel worker test suite. |
| **R-04** | **Stale Redirect Cache after Admin Deactivation** | MED | HIGH | **HIGH** | **Strategy:** In-memory LRU cache serving disabled/expired link after admin blocks it. **Mitigation:** Active cache invalidation hooks (`cache.del(code)`) trigger synchronously on any link update/disable; all redirect responses send `Cache-Control: no-store`. |
| **R-05** | **Platform Abuse for Phishing & Malware Distribution** | MED | CRITICAL | **HIGH** | **Strategy:** Rogue actors shortening phishing sites to damage platform IP reputation. **Mitigation:** Autonomous domain blocklist with recursive subdomain inheritance (`evil.com` blocks `*.evil.com`); real-time URL validation on creation; instant HTTP 403 shield page. |
| **R-06** | **Analytics Inflation via Search Engine & Social Bots** | HIGH | MED | **MED** | **Strategy:** Googlebot, Twitterbot, and web scrapers artificially inflating marketing counts. **Mitigation:** Evaluate User-Agent with `isbot` engine. Flag bot visits with `is_bot = 1` in storage; completely exclude bots from customer dashboard aggregates and click limits. |
| **R-07** | **Memory Leak in Asynchronous Event Queue** | LOW | HIGH | **MED** | **Strategy:** Memory bloat if database stalls and in-memory queue accumulates millions of events. **Mitigation:** Implement hard queue backpressure limit (5,000 items). If exceeded, triggers emergency batch write and drops lowest-priority bot telemetry while preserving link counters. |
| **R-08** | **Cross-Tenant Data Leak in Campaign/Tag Joins** | LOW | HIGH | **MED** | **Strategy:** Link updates referencing a campaign ID belonging to another user. **Mitigation:** Enforce composite tenant checks in SQL: `WHERE id = $id AND owner_id = $owner_id`. Verified via automated smoke invariant test suite. |

---

## 3. Failure Mode and Effects Analysis (FMEA)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FMEA RESOLUTION PROTOCOL                        │
├───────────────────────┬───────────────────┬────────────────────────────┤
│ POTENTIAL FAILURE     │ SYMPTOM DETECTED  │ SYSTEM AUTOMATED RESPONSE  │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ Database Network Drop │ ClickQueue DB     │ Queue initiates 3x retry   │
│                       │ connection error  │ with exponential backoff;  │
│                       │                   │ memory buffer preserved.   │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ Cloud Provider SIGTERM│ Vercel / Render   │ Process listener captures  │
│                       │ container recycle │ signal, stops HTTP ingest, │
│                       │                   │ and flushes queue to DB.   │
├───────────────────────┼───────────────────┼────────────────────────────┤
│ Inactive Link Click   │ Expired / Disabled│ Serves branded 410 page;   │
│                       │ link accessed     │ skips DB write; analytics  │
│                       │                   │ remains intact.            │
└───────────────────────┴───────────────────┴────────────────────────────┘
```
