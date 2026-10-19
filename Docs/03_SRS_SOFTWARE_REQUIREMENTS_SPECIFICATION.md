# 📑 Software Requirements Specification (SRS) — LinkPulse

```
========================================================================================
STANDARD         : IEEE Std 830-1998 Compliant Specification
PRODUCT NAME     : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
VERSION          : 2.0.0
DATE             : October 2026
STATUS           : APPROVED & BASELINED
========================================================================================
```

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the complete functional and non-functional requirements for the **LinkPulse** platform. It provides a definitive engineering reference for software developers, system architects, QA verification teams, and infrastructure engineers.

### 1.2 Document Conventions
* **SHALL / MUST:** Signifies an absolute technical requirement.
* **SHOULD:** Signifies a highly recommended design practice.
* **MAY:** Signifies an optional or configurable feature.
* Requirements are uniquely identified using alphanumeric codes: `[REQ-FUNC-xxx]` for functional requirements and `[REQ-NFR-xxx]` for non-functional requirements.

### 1.3 Intended Audience
* **Core Development Engineers:** For backend, frontend, and database implementation.
* **Quality Assurance Engineers:** For creating test plans, integration scripts, and smoke test suites.
* **DevOps / SRE:** For server provisioning, connection pooler sizing, and CI/CD automation.

### 1.4 Product Scope
LinkPulse delivers an enterprise URL gateway providing sub-millisecond HTTP 302 redirections, an asynchronous in-memory event batch queue, multi-device routing, cryptographic access controls, dynamic link-in-bio creation, and high-performance cubic spline telemetry charts.

---

## 2. Overall Description

### 2.1 Product Perspective
LinkPulse operates as a high-concurrency cloud-native SaaS system. It resides between external web visitors (and QR scanners) and final web destinations, functioning as an intelligent edge proxy that evaluates link policies before dispatching an immediate HTTP 302 redirect.

```
       [ Client Browser / Mobile Device / QR Scanner ]
                             │
                             ▼
              [ Cloudflare / Vercel Edge CDN ]
                             │
                             ▼
         [ LinkPulse Express.js Gateway Application ]
             ├── In-Memory LRU Cache Tier
             ├── 8-Step Redirect Decision Engine
             ├── Asynchronous Micro-Batch Event Queue
             └── REST API & Server-Rendered Bio Pages
                    │                      │
       (Async Worker Writes)      (Sync Transaction Queries)
                    │                      │
                    ▼                      ▼
         [ PgBouncer Pooler (Port 6543 / 5432) ]
                             │
                             ▼
         [ PostgreSQL 15+ / Supabase Cloud DB ]
```

### 2.2 Product Functions (High-Level Summary)
* **High-Speed Link Redirection:** Resolves short codes to target URLs in under 1ms via memory caching.
* **Asynchronous Telemetry Enrichment:** Captures visitor metadata (country, city, device, browser, OS, referrer, QR/Bio attribution) without blocking HTTP responses.
* **Device Targeting:** Dynamically redirects visitors to platform-specific destinations (iOS App Store, Android Google Play, Desktop web application).
* **Gated Access Control:** Enforces bcrypt passwords with tamper-proof signed JWT cookies; enforces hard expiration dates and CAS atomic click limits.
* **Link-in-Bio Platform:** Generates responsive, server-rendered profile hubs (`/bio/:slug`) with customizable color schemes.
* **Dual-Dialect Storage Adapter:** Executes transparently across PostgreSQL (cloud production) and `node:sqlite` (local zero-dependency development).

### 2.3 User Classes & Roles
1. **Public Visitor / Scanner:** Unauthenticated user clicking a short link or scanning a QR code.
2. **Authenticated Creator / Marketer:** Manages campaigns, creates short links, configures device rules, generates QR codes, and views telemetry.
3. **System Administrator:** Oversees platform security, reviews abuse spikes, manages domain blocklists, and disables rogue links.

---

## 3. Specific Functional Requirements

### 3.1 Module: Identity & Access Management (IAM)
* `[REQ-FUNC-101]` The system **SHALL** authenticate users via email and password, hashing passwords using `bcryptjs` with a cost factor of at least 10 rounds.
* `[REQ-FUNC-102]` The system **SHALL** issue JSON Web Tokens (JWT) signed with HMAC-SHA256, carrying user ID, email, role, and a 7-day expiration timestamp (`exp`).
* `[REQ-FUNC-103]` The system **SHALL** provide Google OAuth 2.0 / GIS authentication, verifying ID tokens against Google public keys.
* `[REQ-FUNC-104]` The system **SHALL** enforce role-based access control (RBAC), restricting `/api/admin/*` endpoints strictly to users with `role = 'admin'`.
* `[REQ-FUNC-105]` The system **SHALL** enforce multi-tenant isolation, ensuring users can only read, update, or analyze links they own.

### 3.2 Module: Link Generation & Lifecycle Management
* `[REQ-FUNC-201]` The system **SHALL** validate destination URLs to ensure valid URI format and `http` or `https` schemes.
* `[REQ-FUNC-202]` The system **SHALL** generate unique short codes using Base62 characters (`[0-9a-zA-Z]`) with a minimum length of 6 characters and automated retry upon database collision.
* `[REQ-FUNC-203]` The system **SHALL** support custom user-defined aliases (length: 3 to 50 characters, regex: `^[a-zA-Z0-9_-]+$`).
* `[REQ-FUNC-204]` The system **SHALL** reject reserved aliases including `admin`, `api`, `bio`, `login`, `register`, `dashboard`, `settings`, `static`.
* `[REQ-FUNC-205]` The system **SHALL** reject self-referential links where destination domain matches the platform host.
* `[REQ-FUNC-206]` The system **SHALL** support non-destructive link deactivation (expired and disabled links retain all historical analytics records).

### 3.3 Module: 8-Step Redirect Decision Engine
* `[REQ-FUNC-301]` The redirection pipeline **SHALL** strictly execute the following sequential decision stages for `GET /:code`:
  1. **Cache Resolution:** Check in-memory LRU cache. If not found, query DB and populate cache.
  2. **Administrative Status Guard:** If link `status != 'active'`, return HTTP 410 Gone with customized reason.
  3. **Phishing & Domain Blocklist:** Verify destination domain against active blocked domains. If matched, return HTTP 403 Forbidden.
  4. **Temporal Expiration Guard:** If current UTC > `expires_at`, update database status to `expired`, bust LRU cache, and return HTTP 410 Gone.
  5. **Atomic Quota Guard:** Query current click count. If `click_count >= max_clicks`, return HTTP 410 Gone.
  6. **Cryptographic Password Gate:** If link has a password hash, verify `lp_pw` signed cookie. If absent or invalid, return HTTP 401 Unauthorized with form.
  7. **Device-Specific Target Evaluation:** Inspect `User-Agent` header via `ua-parser-js`. If visitor matches configured rule (`ios`, `android`, or `desktop`), substitute destination.
  8. **Dispatch:** Emit HTTP 302 Found response pointing to evaluated target with `Cache-Control: no-store`.

### 3.4 Module: Asynchronous Telemetry & Ingestion Queue
* `[REQ-FUNC-401]` The redirection response **SHALL NOT** wait for database logging. Telemetry ingestion must be executed asynchronously.
* `[REQ-FUNC-402]` The telemetry engine **SHALL** buffer click events into an in-memory queue (`ClickQueue`).
* `[REQ-FUNC-403]` The queue **SHALL** flush buffered events to database in a single transaction every 1,000 milliseconds or upon reaching 200 buffered items.
* `[REQ-FUNC-404]` The system **SHALL** update aggregate link click counts using an atomic CAS query:
  ```sql
  UPDATE links 
  SET click_count = click_count + $increment,
      last_clicked_at = $timestamp
  WHERE id = $link_id 
    AND (max_clicks IS NULL OR click_count < max_clicks);
  ```
* `[REQ-FUNC-405]` The system **SHALL** detect search engine crawlers and automated bots using user-agent heuristics (`isbot`), setting `is_bot = 1` and excluding them from aggregate totals.
* `[REQ-FUNC-406]` The system **SHALL** anonymize visitor IPs by hashing with a private rotating salt using SHA-256 HMAC. Raw IP addresses must never be written to storage.

---

## 4. External Interface Requirements

### 4.1 User Interfaces (UI)
* **UI-01:** Modern, responsive dark-mode SaaS interface built with React 18, Vite 6, and Tailwind CSS.
* **UI-02:** Live Chart.js telemetry charts displaying monotone cubic spline wave interpolation (`tension: 0.45`), theme color `#FFE3B3`, with point radius 0 expanding to 6px on hover.
* **UI-03:** Mobile-responsive preview iframe for Link-in-Bio editor reflecting instant style adjustments.

### 4.2 Software & Database Interfaces
* **DB-01 (Production):** PostgreSQL 15+ hosted on Supabase, connected via PgBouncer connection pooler on port 6543 / 5432 with `sslmode=require`.
* **DB-02 (Local Development):** Zero-dependency Node.js native `node:sqlite` database stored in `linkpulse.db`.

### 4.3 Communications Interfaces
* **COM-01:** All web communication **SHALL** mandate HTTPS using TLS 1.3 encryption.
* **COM-02:** HTTP redirect responses **SHALL** carry `Cache-Control: no-store, no-cache, must-revalidate` to prevent browser cache poisoning.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance Requirements
* `[REQ-NFR-001]` **Cache-Hit Redirect Latency:** The system SHALL return an HTTP 302 response within 1.0 millisecond for cached links.
* `[REQ-NFR-002]` **Throughput:** A single server instance SHALL process at least 2,500 redirect requests per second under peak load.
* `[REQ-NFR-003]` **Database Write Optimization:** Batching SHALL reduce raw SQL write transactions by at least 95% during traffic spikes.

### 5.2 Security & Data Privacy Requirements
* `[REQ-NFR-004]` **Zero Raw PII Storage:** Raw IP addresses SHALL NEVER be written to disk. Only salted SHA-256 HMAC visitor hashes may be stored.
* `[REQ-NFR-005]` **Cookie Security:** The `lp_pw` password unlock cookie SHALL be marked `HttpOnly`, `SameSite=Lax`, and `Secure` in production environments.
* `[REQ-NFR-006]` **Rate Limiting:** Authentication endpoints SHALL throttle attempts to a maximum of 20 requests per 15-minute window per IP. Link creation SHALL be capped at 30 requests per minute per authenticated user.

### 5.3 Reliability & Fault Tolerance
* `[REQ-NFR-007]` **Graceful Shutdown:** Upon receiving `SIGTERM` or `SIGINT`, the server SHALL halt incoming requests, immediately flush all remaining in-memory click events to database, and terminate cleanly within 5 seconds.
* `[REQ-NFR-008]` **Batch Queue Retry:** If a batch database write fails, the queue SHALL retry up to 3 times before logging an error to prevent event loss.
