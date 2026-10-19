# 🗺️ Feature Roadmap & Release Governance — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
VERSIONING MODEL : Semantic Versioning 2.0.0 (MAJOR.MINOR.PATCH)
LIFECYCLE STATUS : v2.0.0 PRODUCTION ACTIVE
DOCUMENT OWNER   : Product Management & Architecture Guild
========================================================================================
```

---

## 1. Strategic Release Horizon

```
  2026 Q1                  2026 Q2                  2026 Q3–Q4               2027+
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│    VERSION 1.0     │   │    VERSION 1.5     │   │    VERSION 2.0     │   │    VERSION 3.0     │
│     (CORE MVP)     │   │(ROUTING & CONTROL) │   │ (PRO & HARDENING)  │   │(ENTERPRISE EDGE AI)│
├────────────────────┤   ├────────────────────┤   ├────────────────────┤   ├────────────────────┤
│ • Express + React  │   │ • Expiry & Limits  │   │ • Link-in-Bio      │   │ • Custom CNAME DNS │
│ • In-Memory Cache  │   │ • Bcrypt Passwords │   │ • Spline Wave Chart│   │ • Edge Workers CDN │
│ • Async Queue (1s) │   │ • Device Targeting │   │ • Vercel Deploy    │   │ • Real-time Webhook│
│ • Dual DB Adapter  │   │ • QR Code Engine   │   │ • Supabase IPv4    │   │ • AI Click Analysis│
│ • 14 Smoke Tests   │   │ • Admin Blocklist  │   │ • 73 Smoke Tests   │   │ • Multi-Region DB  │
└────────────────────┘   └────────────────────┘   └────────────────────┘   └────────────────────┘
       RELEASED                 RELEASED                 RELEASED                 PLANNED
```

---

## 2. Milestone Release Details

### 🟢 Version 1.0.0 — Core Infrastructure & Telemetry (Completed)
* **Goal:** Prove technical viability of sub-millisecond redirects decoupled from persistence logging.
* **Core Features:**
  * Two-tier storage adapter: PostgreSQL & `node:sqlite`.
  * In-memory LRU cache with sub-millisecond lookup.
  * Asynchronous micro-batch click queue flushing every 1s / 200 items.
  * JWT Bearer authentication and multi-tenant row isolation.
  * Basic timeseries and geographic click reporting.

### 🟢 Version 1.5.0 — Advanced Rules, QR & Admin Moderation (Completed)
* **Goal:** Expand link control, physical distribution, and brand safety.
* **Core Features:**
  * Automated temporal expiration without database row deletion.
  * CAS atomic click limits evaluated directly inside SQL transactions.
  * Bcrypt password gating with signed 12-hour `lp_pw` HTTP cookies.
  * Device-class smart routing (iOS App Store, Android Google Play, Desktop).
  * High-res PNG & SVG QR code synthesis with automated `?src=qr` tracking.
  * Client-side Papaparse CSV validation and bulk link importer.
  * Global domain blocklist with automatic subdomain inheritance.
  * Autonomous abuse heuristics (bot ratio, click velocity spikes).

### 🟢 Version 2.0.0 — Creator Suite, Spline Telemetry & Cloud Hardening (Current Production)
* **Goal:** Enterprise cloud readiness, creator monetization tools, and automated QA governance.
* **Core Features:**
  * Server-rendered Link-in-Bio platform (`/bio/:slug`) with 5 curated CSS gradient themes.
  * Monotone cubic spline wave telemetry chart (`#FFE3B3`) with dynamic period aggregation.
  * Production deployment to Vercel Serverless with Supabase PgBouncer pooler (port 6543 / 5432).
  * Comprehensive automated verification suite with 73 unit and smoke assertions.
  * Complete developer documentation suite and developer matrix visual index.

### 🟡 Version 2.5.0 — Multi-User Workspaces & Team RBAC (Upcoming)
* **Target Delivery:** Q1 2027
* **Planned Features:**
  * Workspace invitations and fine-grained team roles (`owner`, `editor`, `viewer`).
  * SSO / SAML integration for enterprise identity providers (Okta, Azure AD).
  * Outbound webhook dispatch on click events and threshold triggers.
  * REST API programmatic key generation with granular scope permissions.

### 🔵 Version 3.0.0 — Global Edge AI & Custom CNAME Domains (Future Horizon)
* **Target Delivery:** Q3 2027
* **Planned Features:**
  * Automatic SSL issuance and custom domain CNAME routing at the DNS edge.
  * Multi-region distributed active-active database replication.
  * Machine learning click anomaly detection and automated fraud scoring.
  * Smart A/B traffic split testing with automated multi-armed bandit optimization.

---

## 3. Release Governance & Versioning Policies

### 3.1 Semantic Versioning (SemVer 2.0.0)
* **MAJOR (x.0.0):** Breaking API schema alterations, fundamental architecture overhauls, or database schema incompatibility.
* **MINOR (0.x.0):** Backwards-compatible feature additions, new endpoints, or non-destructive database migrations.
* **PATCH (0.0.x):** Backwards-compatible bug fixes, security patches, or documentation updates.

### 3.2 Non-Destructive Storage Policy
To protect historical marketing attribution and client analytics, **LinkPulse maintains an absolute zero-delete policy on links and click events**. Links that expire or are disabled by administrators are updated in-place (`status = 'expired'` or `status = 'disabled'`), ensuring their click telemetry remains queryable indefinitely.

### 3.3 Database Migration Backward Compatibility
All database migrations executed in `server/src/db/index.js` **MUST** be strictly additive and idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Destructive schema modifications (such as dropping columns or altering foreign key constraints on live tables) are strictly prohibited.
