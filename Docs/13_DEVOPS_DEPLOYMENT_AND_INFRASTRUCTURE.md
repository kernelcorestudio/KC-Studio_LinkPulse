# 🚀 DevOps, Infrastructure & Deployment Runbook — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : Infrastructure Topology, Serverless Config & Deployment Runbook
PRIMARY CLOUD    : Vercel (Edge & Serverless) + Supabase (PostgreSQL with PgBouncer)
ALTERNATIVE      : Render Single-Service Blueprint / Docker Container
VERSION          : 2.0.0
========================================================================================
```

---

## 1. Production Architecture Overview

The production deployment of LinkPulse leverages a **Serverless-Edge Hybrid Model**:
* **Frontend Assets & Static Shell:** Hosted on Vercel's Global Edge Network (CDN) with automatic Brotli/Gzip compression.
* **Backend API & Edge Redirect Gateway:** Executed via Vercel Serverless Functions (`api/index.js`), delivering automatic horizontal elasticity.
* **Relational Persistence Layer:** Hosted on Supabase (PostgreSQL 15+), connected exclusively through PgBouncer transaction-mode connection poolers.

```
                                  [ Production Traffic ]
                                             │
                                             ▼
                      ┌─────────────────────────────────────────────┐
                      │          VERCEL GLOBAL EDGE NETWORK         │
                      │  https://kcstudio-linkpluse.vercel.app      │
                      └──────┬───────────────────────────────┬──────┘
                             │                               │
             (Static Assets: JS, CSS, HTML)        (Dynamic API / Redirects)
                             │                               │
                             ▼                               ▼
                      ┌──────────────┐              ┌─────────────────┐
                      │ Edge Storage │              │ Serverless Func │
                      │ /dist (Vite) │              │  api/index.js   │
                      └──────────────┘              └────────┬────────┘
                                                             │
                                                    (TLS 1.3 / SSL Mode)
                                                             │
                                                             ▼
                                            ┌─────────────────────────────────┐
                                            │      SUPABASE CLOUD POOLER      │
                                            │ aws-0-ap-northeast-2.pooler...  │
                                            │  Port: 6543 (Transaction Mode)  │
                                            └────────────────┬────────────────┘
                                                             │
                                                             ▼
                                            ┌─────────────────────────────────┐
                                            │      POSTGRESQL 15+ DATABASE    │
                                            │ (Multi-tenant Tables & Indexes) │
                                            └─────────────────────────────────┘
```

---

## 2. The Critical IPv4 Connection Pooler Requirement

> [!CAUTION]
> **Vercel Network Limitation:** Vercel Serverless runtimes operate in an IPv4-only outbound network. Supabase direct database domains (`db.[project-ref].supabase.co`) resolve exclusively over IPv6. Connecting to the direct domain from Vercel causes fatal `getaddrinfo ENOTFOUND` crashes.

### The Proven Solution:
All production deployments **MUST** utilize Supabase's dedicated IPv4 connection pooler on **Port 6543** (PgBouncer Transaction Mode):

```ini
# Production DATABASE_URL Syntax (Mandatory)
DATABASE_URL=postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

#### Why Port 6543 over Port 5432?
* **Port 5432 (Session Mode):** Allocates a dedicated PostgreSQL connection per client lambda. High-traffic concurrency spawns hundreds of lambdas, exceeding Supabase's max client connection limit and throwing `FATAL: remaining connection slots are reserved for non-replication superuser connections` (`EMAXCONNSESSION`).
* **Port 6543 (Transaction Mode):** Multiplexes thousands of serverless requests across a small pool of 15 persistent database connections, ensuring rock-solid stability during viral traffic surges.

---

## 3. Environment Variables Configuration Matrix

### 3.1 Backend Environment (`server/.env` & Vercel Dashboard)

| Variable Name | Required | Default Value | Description |
|:---|:---:|:---|:---|
| `NODE_ENV` | Yes | `production` | Runtimes: `development`, `production`, `test`. |
| `PORT` | No | `3001` | HTTP listening port for persistent server mode. |
| `DATABASE_URL` | Yes (Prod) | `""` (Uses SQLite) | PostgreSQL connection string with `?sslmode=require`. |
| `JWT_SECRET` | Yes | High-entropy string | 64+ char secret used for signing authentication tokens. |
| `COOKIE_SECRET` | Yes | High-entropy string | Secret key for signing the `lp_pw` password gate cookie. |
| `HASH_SALT` | Yes | Random salt | Secret salt used for one-way SHA-256 HMAC visitor IP hashing. |
| `BASE_URL` | Yes | `https://...` | Public origin URL used for QR code generation and bio links. |
| `GOOGLE_CLIENT_ID`| No | `""` | Google OAuth 2.0 Web Client ID for GIS authentication. |

### 3.2 Frontend Environment (`client/.env`)

| Variable Name | Required | Example Value | Description |
|:---|:---:|:---|:---|
| `VITE_API_BASE` | Yes | `/api` | Base path for frontend API calls (`/api` in single-origin). |
| `VITE_GOOGLE_CLIENT_ID` | No | `...apps.googleusercontent.com` | Google OAuth Client ID loaded by Google GIS script. |

---

## 4. Step-by-Step Production Deployment Playbook

### Method A: Vercel Cloud Deployment (Recommended)
1. **Repository Setup:** Push the repository to GitHub (`main` branch).
2. **Import Project:** In Vercel Dashboard, select **Add New Project** ➔ Import `KCSTUDIO-LINKPLUSE`.
3. **Configure Project Settings:**
   * **Framework Preset:** Vite
   * **Root Directory:** `./` (Repository root)
   * **Build Command:** `npm --prefix client run build`
   * **Output Directory:** `client/dist`
4. **Configure Environment Variables:** Add `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `HASH_SALT`, `BASE_URL` in the Vercel Project Settings.
5. **Deploy:** Click **Deploy**. Vercel will build the React SPA and configure the serverless rewrite defined in `vercel.json`:
   ```json
   {
     "version": 2,
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/index.js" },
       { "source": "/bio/(.*)", "destination": "/api/index.js" },
       { "source": "/((?!assets|api|bio|favicon|logo|README_banner).*)", "destination": "/api/index.js" },
       { "source": "/(.*)", "destination": "/client/dist/$1" }
     ]
   }
   ```

### Method B: Single-Service Container Deployment (Render Blueprint)
1. The repository ships with a verified `render.yaml` infrastructure-as-code file.
2. In Render Dashboard, click **New ➔ Blueprint**, select the repository.
3. Render automatically builds both client and server into a unified Node.js instance:
   * Serves static frontend from `/client/dist`
   * Serves API endpoints from `/api/*`
   * Serves redirects directly from `/:code`

---

## 5. Rollback & Disaster Recovery Playbook

```
                                [ INCIDENT DETECTED ]
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
         [ Application-Level Bug ]                 [ Database Schema Issue ]
                     │                                         │
                     ▼                                         ▼
         [ Vercel Instant Rollback ]               [ Idempotent Hotfix SQL ]
         • Open Vercel Deployments                 • Run additive migration
         • Locate previous stable commit           • Zero-downtime column patch
         • Click "Promote to Production"           • Flush in-memory LRU cache
                     │                                         │
                     └────────────────────┬────────────────────┘
                                          ▼
                               [ VERIFY WITH SMOKE ]
                           node server/scripts/smoke.mjs
```
