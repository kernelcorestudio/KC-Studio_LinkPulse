<p align="center">
  <img src="client/public/README_banner.jpg" alt="LinkPulse - Next-Gen URL Infrastructure & Telemetry Route Engine" width="100%" style="border-radius: 12px;" />
</p>

<h1 align="center">⚡ LinkPulse</h1>

<p align="center">
  <strong>Next-Gen URL Infrastructure · Sub-Millisecond Redirect Engine · Real-Time Deep Telemetry · Smart Routing · Link-in-Bio Builder</strong>
</p>

<p align="center">
  <a href="https://kcstudio-linkpluse.vercel.app"><img src="https://img.shields.io/badge/Vercel-Production%20Live-10b981?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Deployment" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Node.js%2024-LTS-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 24" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/React%2018-Vite%206-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 18" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Tailwind-3.4%20SaaS-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="#testing"><img src="https://img.shields.io/badge/Tests-73%2F73%20Passing-emerald?style=for-the-badge&logo=checkmarx&logoColor=white" alt="Test Suite" /></a>
  <a href="#security--privacy"><img src="https://img.shields.io/badge/Security-SHA--256%20+%20bcrypt-F88F22?style=for-the-badge&logo=auth0&logoColor=white" alt="Security" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-EA6113?style=for-the-badge" alt="License MIT" /></a>
</p>

<p align="center">
  <a href="https://kcstudio-linkpluse.vercel.app"><strong>🌐 Launch Live Production App</strong></a> ·
  <a href="#platform-preview--visual-tour"><strong>🖼️ Screenshots</strong></a> ·
  <a href="#interactive-demo-access--test-credentials"><strong>🔑 Demo Access</strong></a> ·
  <a href="#system-architecture"><strong>🏛️ Architecture</strong></a> ·
  <a href="#data-flow-diagrams-dfd"><strong>🔄 Data Flow (DFD)</strong></a> ·
  <a href="#redirect-engine-flowchart"><strong>⚡ Redirect Engine</strong></a> ·
  <a href="#database-architecture--er-diagram"><strong>🗄️ Database ER</strong></a> ·
  <a href="#api-reference"><strong>📡 API Reference</strong></a> ·
  <a href="#local-development--quickstart"><strong>💻 Quickstart</strong></a>
</p>

---

<div align="center">

### 📋 TABLE OF CONTENTS
**NAVIGATION MATRIX · QUICK JUMP INDEX**

</div>

| 🏛️ Architecture & Foundations | ⚙️ Operations, Engine & QA |
| :--- | :--- |
| `01` &nbsp; [**Executive Overview**](#executive-overview) &nbsp; ![Overview](https://img.shields.io/badge/OVERVIEW-f97316?style=flat-square) <br> Sub-millisecond edge redirect engine, LRU caching & async micro-batch logging | `06` &nbsp; [**Core Workflow Flowcharts**](#core-workflow-flowcharts) ➔ &nbsp; ⚙️ <br> • [1. 8-Step Redirect Decision Pipeline](#1-8-step-redirect-decision-pipeline) ➔ <br> • [2. Google OAuth 2.0 & GIS Pipeline](#2-google-oauth-20--gis-pipeline) ➔ <br> • [3. Asynchronous Click Batch Queue](#3-asynchronous-click-batch-queue) ➔ |
| `02` &nbsp; [**Platform Preview & Visual Tour**](#platform-preview--visual-tour) ➔ &nbsp; 🖼️ <br> Full UI showcase: Glassmorphic landing page & real-time telemetry dashboard | `07` &nbsp; [**Database Architecture & ER Diagram**](#database-architecture--er-diagram) ➔ &nbsp; 🔗 <br> Dual-adapter schema (PostgreSQL / SQLite) with foreign-key cascades & indexes |
| `03` &nbsp; [**Interactive Demo Access & Credentials**](#interactive-demo-access--test-credentials) ➔ &nbsp; 🔑 <br> Pre-configured Admin & User test accounts with 1-click autofill & role matrix | `08` &nbsp; [**Telemetry & Analytics Visualization Engine**](#telemetry--analytics-visualization-engine) ➔ &nbsp; 📈 <br> Real-time cubic spline wave charts (`#FFE3B3`), timelines & geo metrics |
| `04` &nbsp; [**Key Features & Capabilities**](#key-features--capabilities) ➔ &nbsp; ✔️ <br> Device routing (iOS/Android), bcrypt protection, click limits & QR synthesis | `09` &nbsp; [**Security, Privacy & Edge Performance**](#security-privacy--edge-performance) ➔ &nbsp; 🛡️ <br> Bcrypt password hashing, signed HTTP cookies, CAS limits & domain blocklist |
| `05` &nbsp; [**Tech Stack & Architecture Matrix**](#tech-stack--architecture-matrix) &nbsp; ![JS](https://img.shields.io/badge/JS-ES6-yellow?style=flat-square) ![React](https://img.shields.io/badge/React-18-blue?style=flat-square) <br> Node.js 24 LTS, React 18, Vite 6, Supabase PostgreSQL, Tailwind CSS | `10` &nbsp; [**API Reference**](#api-reference) ➔ &nbsp; ![API](https://img.shields.io/badge/API-REST-f43f5e?style=flat-square) <br> Standardized RESTful endpoints for Auth, Links, Analytics & Bios |
| `06` &nbsp; [**System Architecture & Data Flow**](#system-architecture) ➔ &nbsp; 🌐 <br> Multi-tier decoupled edge redirect gateway, DFD Level 0 & Level 1 models | `11` &nbsp; [**Local Development & Quickstart**](#local-development--quickstart) ➔ &nbsp; 🚀 <br> • [Local Setup & Seed Accounts](#local-development--quickstart) <br> • [Production Deployment (Vercel + Supabase)](#production-deployment-vercel--supabase) |
| | `12` &nbsp; [**Testing & Quality Assurance**](#testing--quality-assurance) ➔ &nbsp; 🧪 <br> 73/73 Passing tests (unit, integration & edge-case test suites) |

<div align="center">
  <sub>POWERED BY KC STUDIO • COPYRIGHT © 2026</sub>
</div>

---

## 🌟 Executive Overview

**LinkPulse** is an enterprise-grade URL shortener, routing gateway, and real-time click telemetry platform designed to operate at sub-millisecond redirect latencies with high concurrency. 

Unlike traditional URL shorteners that block visitor redirects while synchronously querying databases, LinkPulse decouples the **Edge Redirect Engine** from **Persistence Logging** using an **in-memory LRU cache** and an **asynchronous micro-batch event queue**. It packs smart routing features including **device targeting (iOS/Android/Desktop)**, **bcrypt password protection**, **automated link expiry**, **atomic click quotas**, **link-in-bio landing pages**, and **instant high-res QR code synthesis**.

```
   [ Visitor / QR Click ]  ───────►  [ Edge Redirect Gateway ]  ───────►  [ 302 Immediate Jump ]
                                               │
                                               ├─► LRU In-Memory Cache (Sub-ms lookup)
                                               └─► Async Micro-Batch Queue (1s / 200 items)
                                                           │
                                                           ▼
                                                [ PostgreSQL / Supabase ]
                                                (Telemetry, Geolocation, Aggregations)
```

---

## 🖼️ Platform Preview & Visual Tour

<div align="center">
  <p>
    <a href="https://kcstudio-linkpluse.vercel.app">
      <img src="https://img.shields.io/badge/Live%20Demo-Explore%20LinkPulse-EA6113?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live Demo" />
    </a>
    <a href="#interactive-demo-access--test-credentials">
      <img src="https://img.shields.io/badge/Instant%20Access-Demo%20Credentials-F88F22?style=for-the-badge&logo=1password&logoColor=white" alt="Demo Credentials" />
    </a>
  </p>
</div>

### 1. 🌐 Modern SaaS Landing Page & Instant Link Shortener
The LinkPulse landing page combines a glassmorphic cyber-amber aesthetic with a live interactive shortening engine, real-time URL validation, and animated micro-interactions.

<p align="center">
  <a href="client/public/readme_landingpage.png" target="_blank">
    <img src="client/public/readme_landingpage.png" alt="LinkPulse - Modern SaaS Landing Page" width="100%" style="border-radius: 12px; border: 1px solid rgba(251, 185, 49, 0.25); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);" />
  </a>
</p>

*Key Highlights:*
- **Instant Edge Shortener**: Paste any destination URL with instant protocol verification and real-time custom alias availability check.
- **Glassmorphic Feature Cards**: High-contrast, theme-adaptive cards showcasing sub-millisecond redirection, deep telemetry, and smart device routing.
- **Dynamic Quick Action Bar**: Direct access to link generation, documentation, and the secure authentication gateway.

---

### 2. 📊 Real-Time Telemetry & Analytics Mission Control
The LinkPulse operations dashboard equips creators and enterprise teams with sub-second click stream data, cubic spline trend curves, and interactive geographic traffic mapping.

<p align="center">
  <a href="client/public/readme_dashboard.png" target="_blank">
    <img src="client/public/readme_dashboard.png" alt="LinkPulse - Real-Time Telemetry & Analytics Dashboard" width="100%" style="border-radius: 12px; border: 1px solid rgba(251, 185, 49, 0.25); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);" />
  </a>
</p>

*Key Highlights:*
- **Cubic Spline Wave Telemetry (`#FFE3B3`)**: Non-blocking real-time traffic chart with smooth monotone interpolation and responsive hover triggers.
- **Interactive 3D Geo Distribution Donut**: Multi-segment global traffic visualization with exploded slice physics and glowing focal state on hover.
- **Device & Platform Intelligence**: Granular breakdown of operating systems (iOS, Android, Windows, macOS) and browser user agents.
- **High-Velocity Metric Cards**: Real-time counter metrics for Total Clicks, Unique Human Visitors, Active Links, and Top Performing Endpoints.

---

## 🔑 Interactive Demo Access & Test Credentials

LinkPulse provides pre-configured sandbox accounts for evaluating both **creator workflows** and **system-wide administrative controls**. You can test the platform live on the production deployment or in your local development environment without registering a new email.

<div align="center">

| Account Type | Identity / Email | Password | Access Level | Primary Evaluation Features |
| :--- | :--- | :--- | :---: | :--- |
| <img src="https://img.shields.io/badge/ROLE-ADMIN-red?style=flat-square&logo=shield" alt="Admin" /> <br> **System Administrator** | `admin@linkpulse.dev` | `admin1234` | **Superuser** <br> (Full Platform) | • System-wide telemetry & click stream <br> • Global malicious domain blocklist <br> • Moderate & disable links (with 410 reason) <br> • User directory & audit inspection |
| <img src="https://img.shields.io/badge/ROLE-CREATOR-amber?style=flat-square&logo=user" alt="User" /> <br> **Standard User** | `ada@example.com` | `password123` | **Member** <br> (Workspace Level) | • Create short links & custom aliases <br> • Smart device rules (iOS / Android / Desktop) <br> • Password gating (bcrypt) & click quotas <br> • Link-in-Bio multi-theme builder <br> • Real-time QR code generation (PNG/SVG) |
| <img src="https://img.shields.io/badge/ROLE-ANALYST-blue?style=flat-square&logo=databricks" alt="Secondary User" /> <br> **Secondary User** | `grace@example.com` | `password123` | **Member** <br> (Independent) | • Multi-tenant workspace isolation testing <br> • Independent campaign tracking & tagging <br> • CSV bulk link import testing |

</div>

> [!TIP]
> ### ⚡ 1-Click Instant Autofill
> On the **Login / Register Page** (`/login`), click either the **`User Demo`** or **`Admin Demo`** quick-fill button below the social login options to instantly populate the credentials and test the platform with zero typing.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEMO ACCOUNT PERMISSIONS MATRIX                       │
├──────────────────────────────────────┬──────────────────┬───────────────────┤
│ FEATURE CAPABILITY                   │ USER (ADA)       │ ADMIN (SUPERUSER) │
├──────────────────────────────────────┼──────────────────┼───────────────────┤
│ Short Link Creation & Custom Alias   │ ✅ Yes           │ ✅ Yes            │
│ Real-Time Click Telemetry & Graphs   │ ✅ Own Links     │ ✅ Platform-Wide  │
│ Device Smart Routing (iOS / Android) │ ✅ Yes           │ ✅ Yes            │
│ Password Protection (Bcrypt Gating)  │ ✅ Yes           │ ✅ Yes            │
│ Atomic Max Clicks & Link Expiry      │ ✅ Yes           │ ✅ Yes            │
│ Dynamic Link-in-Bio Page Builder     │ ✅ Yes           │ ✅ Yes            │
│ High-Res QR Code Export (PNG / SVG)  │ ✅ Yes           │ ✅ Yes            │
│ CSV Bulk Link Import & Validation    │ ✅ Yes           │ ✅ Yes            │
│ Emergency Link Killswitch & 410 Gone │ ❌ Own Only      │ ✅ ANY User Link  │
│ Phishing / Domain Blocklist Engine   │ ❌ Restricted    │ ✅ Full Access    │
│ Platform User Directory & Moderation │ ❌ Restricted    │ ✅ Full Access    │
│ System Health & Bot Traffic Audits   │ ❌ Restricted    │ ✅ Full Access    │
└──────────────────────────────────────┴──────────────────┴───────────────────┘
```

> [!NOTE]
> **Sandbox Safety**: All test credentials run in isolated, safe environments. The database includes automated sanitization and rate limits to prevent abuse while allowing full inspection of all features.

---

## 🚀 Key Features & Capabilities

| Feature | Description | Technical Implementation |
|:---|:---|:---|
| **⚡ Sub-Millisecond Redirect Engine** | Evaluates rules in a strict 8-step pipeline without DB contention. | In-memory LRU cache + HTTP 302 `no-store` headers. |
| **📈 Live Telemetry & Spline Wave Graph** | Real-time traffic visualization with smooth cubic spline wave interpolation. | Chart.js with monotone interpolation, `#FFE3B3` theme & hover triggers. |
| **🛡️ 8-Step Enforcement Pipeline** | Granular link control before redirection. | Cache ➔ Status ➔ Blocklist ➔ Expiry ➔ Click Limit ➔ Password ➔ Device Rules ➔ 302 Found. |
| **📱 Device-Class Smart Routing** | Routes traffic dynamically to different targets based on OS. | `ua-parser-js` device classification (iOS vs. Android vs. Desktop). |
| **🔐 Password Protection** | Gated destination with bcrypt hash & signed 12-hour session cookies. | `bcryptjs` verification + JWT `lp_pw` signed HTTP-only cookies. |
| **⏱️ Expiry & Atomic Click Limits** | Automatic expiration timestamps and strict cap on max visits. | Atomic SQL conditional CAS updates (prevents oversell races). |
| **🎨 Link-in-Bio Multi-Theme Builder** | Public responsive creator profile pages (`/bio/:slug`) with ordered links. | Server-rendered HTML with 5 curated color presets & source tagging. |
| **🔲 Real-Time QR Generation** | Instant QR rendering for physical and omnichannel distribution. | PNG/SVG endpoints with `?src=qr` attribution tracking. |
| **📁 Workspaces, Folders & Tags** | Deep link organization for high-volume marketing teams. | Normalized relational schema with foreign key cascades and composite indexes. |
| **🚫 Phishing Blocklist & Moderation** | Autonomous malicious domain blocking and administrative killswitch. | Subdomain-inheriting domain matching + instant 403 shield pages. |
| **🌐 Dual-Engine Database Adapter** | Zero-friction local development with enterprise cloud persistence. | Automatic driver toggle between PostgreSQL (`pg.Pool`) and built-in `node:sqlite`. |

---

## 🛠️ Tech Stack & Architecture Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PRESENTATION TIER                               │
│     React 18 (SPA) · Vite 6 · Tailwind CSS 3.4 · Chart.js (Spline Theme)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON REST / JWT
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                           EDGE GATEWAY & BACKEND                            │
│     Node.js 24 (ESM) · Express 4 · Helmet · CORS · Express-Rate-Limit       │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
┌───────────────────▼────────────────┐   ┌────────────────▼───────────────────┐
│     REDIRECT ENGINE (HOT PATH)     │   │     ASYNC BATCH INGESTION QUEUE    │
│  LRU In-Memory Cache · Short Code  │   │  Buffer (1,000ms / 200 items)      │
│  8-Step Rule Pipeline · 302 Found  │   │  Unique Visitor Dedupe · Bot Check │
└───────────────────┬────────────────┘   └────────────────┬───────────────────┘
                    │                                     │
┌───────────────────▼─────────────────────────────────────▼───────────────────┐
│                              PERSISTENCE TIER                               │
│  PostgreSQL (Supabase IPv4 Pooler) · Fallback: Built-in `node:sqlite` WAL   │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Area | Technology | Purpose & Architectural Decision |
|:---|:---|:---|
| **Runtime** | Node.js 24 (LTS) | Native ES modules (`"type": "module"`), native `--env-file`, fast V8 engine. |
| **API Server** | Express 4.21 | Lightweight HTTP framework with custom `asyncHandler` error isolation. |
| **Frontend Framework** | React 18.3 + Vite 6 | Instant HMR development and code-split production bundles. |
| **Styling** | Tailwind CSS 3.4 | Curated dark SaaS color system with amber/gold accents (`#EA6113`, `#F88F22`, `#FFE3B3`). |
| **Visualization** | Chart.js 4.4 + react-chartjs-2 | Smooth monotone cubic spline interpolation with hover inspection markers. |
| **Cloud Database** | PostgreSQL (Supabase) | Multi-AZ scalable relational database connected via AWS IPv4 transaction pooler. |
| **Local Database** | `node:sqlite` (Built-in) | Zero-dependency synchronous/asynchronous hybrid fallback with WAL journal mode. |
| **Identity & Auth** | Google Identity Services + JWT | GIS native OAuth2 token client with fallback to local `bcryptjs` hashing. |
| **Intelligence** | `ua-parser-js`, `geoip-lite`, `isbot` | Enriched device detection, ISO country/city geolocation, and bot filtering. |
| **Validation** | Zod 3.24 | Strict compile-time and runtime payload schema enforcement. |
| **ID Generation** | NanoID 5.1 | High-entropy base62 URL-safe collision-resistant identifiers. |

---

## 🏛️ System Architecture

LinkPulse enforces strict separation of concerns across 5 architectural tiers:

```mermaid
graph TD
    subgraph Tier1["1. Presentation Tier (Client SPA)"]
        UI_Router["React Router v6"]
        UI_Views["Views: Dashboard · Links · CreateWizard · Campaigns · Bio · Admin"]
        UI_Charts["Chart Engine: Spline Waves (#FFE3B3) · Doughnuts · StatCards"]
        UI_State["AuthContext + API Request Layer (Relative /api Proxy)"]
    end

    subgraph Tier2["2. Edge Gateway & Security Middleware"]
        GW_Helmet["Helmet CSP & Security Headers"]
        GW_Cors["CORS Origin Validator (Same-origin & Whitelist)"]
        GW_RateLimit["Rate Limiting (300 req/min API · 20 req/15min Auth)"]
        GW_Cookies["Cookie Parser (Signed lp_pw & lp_vid)"]
        GW_Auth["JWT Guard Middleware (Role-Based Access Control)"]
    end

    subgraph Tier3["3. Business Logic & Core Services"]
        S_Redirect["redirectRouter: 8-Step Pipeline Evaluator"]
        S_Auth["authService: Google OAuth2 & Password Hashing"]
        S_Links["linkService: Link Lifecycle & NanoID Short Codes"]
        S_Analytics["analyticsService: Period Metrics & Spline Aggregation"]
        S_Org["orgService: Campaigns, Tags, and Workspaces"]
        S_Bio["bioService: Multi-Theme Bio Page Engine"]
        S_Admin["adminService: Metrics, Audit, Domain Blocklist"]
        S_Queue["clickQueue: Asynchronous Event Buffer Worker"]
    end

    subgraph Tier4["4. Caching & Context Intelligence"]
        C_LRU["In-Memory LRU Cache (Fast Metadata Lookup)"]
        C_Parser["UAParser: OS, Browser, Device Type"]
        C_Geo["GeoIP Lookup + Vercel Edge IP Geolocation"]
        C_Bot["Bot Detection: isbot + Crawlers Filter"]
        C_Crypto["HMAC-SHA256: Salted Anonymized IP Hasher"]
    end

    subgraph Tier5["5. Persistence & Storage Tier"]
        DB_Adapter["Dialect Adapter (query, queryOne, run, transaction)"]
        DB_PG["PostgreSQL (Supabase IPv4 Pooler :5432 / :6543)"]
        DB_SQLite["Local node:sqlite (WAL Mode, Zero Config)"]
    end

    %% Wiring connections
    UI_State -->|HTTPS REST| Tier2
    Tier2 --> Tier3
    S_Redirect --> C_LRU
    S_Redirect --> C_Parser
    S_Redirect --> C_Geo
    S_Redirect --> C_Bot
    S_Redirect --> C_Crypto
    S_Redirect --> S_Queue
    S_Queue -.->|Batched Flush (1s / 200 events)| DB_Adapter
    Tier3 --> DB_Adapter
    DB_Adapter --> DB_PG
    DB_Adapter --> DB_SQLite
```

---

## 🔄 Data Flow Diagrams (DFD)

### DFD Level 0 — System Context Diagram
<a id="level-0-context-diagram"></a>
The Level 0 Context Diagram displays the boundary of the LinkPulse system and its interactions with external entities.

```mermaid
flowchart TD
    Creator(["👤 Link Creator / Marketer"])
    Visitor(["🌐 Web Visitor / QR Scanner"])
    Admin(["👑 System Administrator"])
    GoogleAuth(["🔑 Google Identity Services"])
    DestSite(["🎯 Destination Website"])

    subgraph LinkPulsePlatform[" LinkPulse Central System "]
        Engine["LinkPulse Gateway, Redirect & Analytics Core"]
    end

    Creator -->|"1. Submit URL, tags, password & device rules"| Engine
    Engine -->|"2. Return short code, analytics & QR images"| Creator

    Visitor -->|"3. Request short link (GET /:code) or Bio (GET /bio/:slug)"| Engine
    Engine -->|"4. HTTP 302 Redirect + visitor cookie"| Visitor
    Visitor -->|"5. Follow HTTP 302 to destination"| DestSite

    Admin -->|"6. Inspect platform telemetry & add domain blocklist"| Engine
    Engine -->|"7. Return system health, abuse alerts & audit logs"| Admin

    GoogleAuth <-->|"8. Exchange OAuth2 access token for user profile"| Engine
```

---

### DFD Level 1 — Functional Decomposition Diagram
<a id="level-1-functional-decomposition"></a>
The Level 1 Diagram decomposes the central system into distinct sub-processes and data stores.

```mermaid
flowchart TD
    %% Entities
    User(["👤 User / Admin"])
    Visitor(["🌐 Public Visitor"])
    
    %% Processes
    P1["1.0 Authentication & Identity Engine"]
    P2["2.0 Link Management & Validation Engine"]
    P3["3.0 Redirect Pipeline & Rule Evaluator"]
    P4["4.0 Async Telemetry Enrichment & Batch Queue"]
    P5["5.0 Analytics Aggregation & Spline Engine"]
    P6["6.0 Admin Moderation & Blocklist Guard"]

    %% Data Stores
    D1[("D1: Users Store")]
    D2[("D2: Links Store")]
    D3[("D3: Click Events Log")]
    D4[("D4: In-Memory LRU Cache")]
    D5[("D5: Blocked Domains")]

    %% Authentication Flow
    User -->|Credentials / Google Token| P1
    P1 <-->|Read / Write Profile & JWT| D1
    P1 -->|Auth Token| User

    %% Link Creation Flow
    User -->|Target URL, Campaign, Expiry, Passwords| P2
    P2 -->|Check Blocked Domain| D5
    P2 -->|Persist Link Record| D2
    P2 -->|Invalidate / Update| D4
    P2 -->|Short Link Details| User

    %% Redirection Flow
    Visitor -->|GET /:code| P3
    P3 <-->|Check Cached Link| D4
    P3 <-->|Fallback Read| D2
    P3 <-->|Check Domain Safety| D5
    P3 -->|HTTP 302 Redirect| Visitor
    P3 -.->|Raw Event Data| P4

    %% Async Click Queue Flow
    P4 -->|Enrich UserAgent, GeoIP, SHA-256 IP| P4
    P4 -->|Batched INSERT Click Events| D3
    P4 -->|Atomic Click Count Increment| D2

    %% Analytics Flow
    User -->|Query Dashboard / Timeseries| P5
    P5 <-->|Read Aggregated Clicks & Uniques| D3
    P5 <-->|Read Link Metas| D2
    P5 -->|Spline Wave Dataset & Geo Breakdown| User

    %% Admin Moderation
    User -->|Add Phishing Domain / Kill Link| P6
    P6 -->|Write Blocklist| D5
    P6 -->|Update Status = disabled| D2
    P6 -->|Bust LRU Cache| D4
```

---

## ⚡ Core Workflow Flowcharts

### 1. 8-Step Redirect Decision Pipeline
Every visitor request (`GET /:code`) navigates an 8-rule pipeline executed in strict deterministic order:

```mermaid
flowchart TD
    Start(["Incoming Visitor Request: GET /:code"]) --> CheckReserved{"Is code reserved SPA word?<br>(login, dashboard, bio, etc.)"}
    CheckReserved -- Yes --> SPA["Pass through to Static SPA / Frontend Handler"]
    CheckReserved -- No --> Step1["Step 1: Cache Lookup (In-Memory LRU)"]

    Step1 --> CacheHit{"Found in LRU Cache?"}
    CacheHit -- Yes --> InspectLink["Evaluate Link Metadata"]
    CacheHit -- No --> QueryDB["Query DB: SELECT FROM links WHERE short_code = ?"]
    QueryDB --> Exists{"Link exists in DB?"}
    Exists -- No --> Page404["Return 404 Not Found Page (no-store)"]
    Exists -- Yes --> SetCache["Store in LRU Cache"] --> InspectLink

    InspectLink --> Step2{"Step 2: Status Check<br>Is status == 'disabled'?"}
    Step2 -- Yes --> Page410Disabled["Return 410 Gone: Blocked Page with Admin Reason"]
    Step2 -- No --> Step3{"Step 3: Domain Blocklist<br>Is destination domain blocked?"}

    Step3 -- Yes --> Page403["Return 403 Forbidden: Phishing / Blocked Domain Page"]
    Step3 -- No --> Step4{"Step 4: Expiration Check<br>Has expires_at passed?"}

    Step4 -- Yes --> AutoExpire["Update links SET status = 'expired'<br>(Analytics preserved, never deleted!)"]
    AutoExpire --> BustCache["Invalidate LRU Cache"] --> Page410Expired["Return 410 Gone: Link Expired Page"]
    Step4 -- No --> Step5{"Step 5: Max Clicks Limit<br>Is max_clicks configured?"}

    Step5 -- Yes --> FreshCount["Fresh atomic read: SELECT click_count FROM links"]
    FreshCount --> LimitReached{"click_count >= max_clicks?"}
    LimitReached -- Yes --> BustCache2["Invalidate LRU Cache"] --> Page410Limit["Return 410 Gone: Click Limit Exceeded Page"]
    LimitReached -- No --> Step6
    Step5 -- No --> Step6{"Step 6: Password Protection<br>Is password_hash present?"}

    Step6 -- Yes --> HasCookie{"Has valid signed 12h<br>'lp_pw' JWT cookie?"}
    HasCookie -- No --> IsPost{"Is request HTTP POST<br>with password?"}
    IsPost -- No --> Page401["Return 401 Unauthorized: Terminal Password Entry Page"]
    IsPost -- Yes --> CheckBcrypt{"bcrypt.compareSync(attempt, hash)?"}
    CheckBcrypt -- No --> Page401Error["Return 401 Unauthorized: Invalid Password Prompt"]
    CheckBcrypt -- Yes --> SetPwCookie["Set signed 'lp_pw' HTTP-only cookie (12h)"] --> Step7
    HasCookie -- Yes --> Step7
    Step6 -- No --> Step7["Step 7: Device Targeting Rules"]

    Step7 --> ParseDevice["Detect Client Device Class (iOS / Android / Desktop)"]
    ParseDevice --> MatchRule{"Device rule defined for client class?"}
    MatchRule -- Yes --> OverrideURL["Override target = device_rules[deviceClass]"] --> Step8
    MatchRule -- No --> DefaultURL["Target = destination_url"] --> Step8

    Step8["Step 8: Final Redirection & Non-Blocking Logging"] --> IssueVisitorCookie["Issue 1-year first-party 'lp_vid' cookie if new"]
    IssueVisitorCookie --> Redirect302["HTTP 302 Found redirect to target<br>(Cache-Control: no-store)"]
    Redirect302 --> PushQueue["Fire-and-forget: enqueueClick(event)<br>Redirect is NOT delayed!"]
    PushQueue --> End(["Visitor Lands on Destination Website"])
```

---

### 2. Google OAuth 2.0 & GIS Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant GIS as Google Identity Services (GIS)
    participant Client as React Client (AuthPage.jsx)
    participant API as Express API (/api/auth/google)
    participant GoogleAPI as Google OAuth2 API (userinfo)
    participant DB as Supabase PostgreSQL (users table)

    User->>Client: Click "Continue with Google"
    Client->>GIS: tokenClient.requestAccessToken({ prompt: 'select_account' })
    GIS-->>User: Open Google Native Account Chooser Popup
    User->>GIS: Select Account & Authorize
    GIS-->>Client: Return access_token
    Client->>API: POST /api/auth/google { access_token }
    API->>GoogleAPI: GET https://www.googleapis.com/oauth2/v3/userinfo
    GoogleAPI-->>API: Return { email, name, picture }
    API->>DB: SELECT * FROM users WHERE LOWER(email) = LOWER(?)
    alt User exists
        DB-->>API: Return existing user
    else User does not exist
        API->>DB: INSERT INTO users (id, name, email, password_hash, role, created_at)
        DB-->>API: User created
    end
    API-->>Client: Return { token: JWT, user: { id, name, email, role } }
    Client->>Client: localStorage.setItem('lp_token', token)
    Client-->>User: Redirect to /app Dashboard
```

---

### 3. Asynchronous Click Batch Queue

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Web / QR Visitor
    participant Engine as Redirect Engine (redirectRoutes.js)
    participant Context as Click Context Enricher (clickContext.js)
    participant Queue as In-Memory Click Queue (clickQueue.js)
    participant DB as PostgreSQL Database (click_events & links)

    Visitor->>Engine: GET /:code
    Engine->>Context: buildClickEvent(req, link)
    activate Context
    Context->>Context: ua-parser-js -> OS, Browser, Device
    Context->>Context: geoip-lite / x-vercel-ip -> Country & City
    Context->>Context: isbot -> Crawler vs Human
    Context->>Context: SHA-256(IP + salt) -> Anonymous IP Hash
    Context-->>Engine: Enriched Event Object
    deactivate Context

    Engine-->>Visitor: HTTP 302 Found (Instant Response!)
    Engine->>Queue: enqueueClick(event)

    Note over Queue: Events buffer in-memory array.<br>Flush triggers every 1,000ms OR when queue >= 200 items.

    rect rgb(26, 18, 10)
        Note over Queue,DB: Background Batch Worker Execution (flushOnce)
        Queue->>DB: BEGIN TRANSACTION
        loop For each event in batch
            Queue->>DB: SELECT 1 FROM click_events WHERE link_id=? AND (visitor_id=? OR ip_hash=?) LIMIT 1
            DB-->>Queue: Is Unique Flag (0 or 1)
        end
        Queue->>DB: Bulk INSERT INTO click_events (all batch rows)
        Queue->>DB: Atomic Counter UPDATE links SET click_count = CASE ... WHERE id=?
        Queue->>DB: COMMIT TRANSACTION
    end
```

---

## 🗄️ Database Architecture & ER Diagram

LinkPulse features a normalized relational schema with 10 tables supporting both PostgreSQL and SQLite:

```mermaid
erDiagram
    USERS ||--o{ LINKS : "owns"
    USERS ||--o{ CAMPAIGNS : "owns"
    USERS ||--o{ TAGS : "owns"
    USERS ||--o{ WORKSPACES : "owns"
    USERS ||--o{ BIO_PAGES : "owns"
    USERS ||--o{ BLOCKED_DOMAINS : "adds"
    CAMPAIGNS ||--o{ LINKS : "groups"
    WORKSPACES ||--o{ LINKS : "contains"
    LINKS ||--o{ CLICK_EVENTS : "records"
    LINKS }o--o{ TAGS : "link_tags"
    BIO_PAGES ||--o{ BIO_PAGE_LINKS : "includes"
    BIO_PAGE_LINKS }o--|| LINKS : "references"
    USERS ||--o{ LINKS : "disabled_by"

    USERS {
        string id PK "nanoid(21)"
        string name "User display name"
        string email UK "User email"
        string password_hash "bcryptjs hash"
        string role "admin | user"
        datetime created_at "ISO-8601 UTC"
    }

    LINKS {
        string id PK "nanoid(21)"
        string owner_id FK "References users(id)"
        string campaign_id FK "References campaigns(id)"
        string folder_id FK "References workspaces(id)"
        string short_code UK "Base62 unique code"
        string destination_url "Target URL"
        string title "Descriptive title"
        string status "active | expired | disabled"
        string password_hash "Optional bcrypt hash"
        datetime expires_at "Optional expiration"
        int max_clicks "Optional click quota"
        int click_count "Atomic click counter"
        string device_rules "JSON: ios, android, desktop"
        string disabled_reason "Admin disable notes"
        string disabled_by FK "References users(id)"
        datetime created_at "ISO-8601 UTC"
        datetime updated_at "ISO-8601 UTC"
    }

    CLICK_EVENTS {
        string id PK "nanoid(21)"
        string link_id FK "References links(id)"
        datetime clicked_at "ISO-8601 UTC"
        string ip_hash "Salted HMAC-SHA256"
        string visitor_id "Cookie or IP hash"
        string referrer "Host domain"
        string device_type "desktop | mobile | tablet"
        string os "Operating System"
        string browser "Browser name"
        string country "ISO Country Code"
        string city "City Name"
        int is_bot "0 = Human | 1 = Bot"
        int is_unique "1 = First visit | 0 = Return"
        string source "direct | qr | bio | social"
    }

    CAMPAIGNS {
        string id PK "nanoid(21)"
        string owner_id FK "References users(id)"
        string name "Campaign title"
        string description "Campaign description"
        datetime start_date "Start timestamp"
        datetime end_date "End timestamp"
        datetime created_at "ISO-8601 UTC"
    }

    TAGS {
        string id PK "nanoid(21)"
        string owner_id FK "References users(id)"
        string name "Tag label"
        datetime created_at "ISO-8601 UTC"
    }

    WORKSPACES {
        string id PK "nanoid(21)"
        string owner_id FK "References users(id)"
        string name "Folder title"
        datetime created_at "ISO-8601 UTC"
    }

    BLOCKED_DOMAINS {
        string id PK "nanoid(21)"
        string domain UK "FQDN or pattern"
        string reason "Phishing / Abuse description"
        string added_by FK "Admin user ID"
        datetime created_at "ISO-8601 UTC"
    }

    BIO_PAGES {
        string id PK "nanoid(21)"
        string owner_id FK "References users(id)"
        string slug UK "URL identifier"
        string title "Bio page headline"
        string bio "Short description"
        string theme "dark | sunset | neon | minimal"
        datetime created_at "ISO-8601 UTC"
        datetime updated_at "ISO-8601 UTC"
    }

    BIO_PAGE_LINKS {
        string id PK "nanoid(21)"
        string bio_page_id FK "References bio_pages(id)"
        string link_id FK "References links(id)"
        int position "Sort order index"
        string label "Custom button label"
    }
```

---

## 📊 Telemetry & Analytics Visualization Engine

The LinkPulse dashboard renders real-time telemetry through a custom **monotone cubic spline wave chart** configured with an elegant cyber-amber and cream theme (`#FFE3B3`):

```
 Clicks
  240 │                                          ╭────╮
  200 │                                    ╭─────╯    ╰─╮
  160 │                              ╭─────╯            ╰──╮
  120 │                        ╭─────╯                     ╰──╮
   80 │           ╭──╮   ╭─────╯                              ╰──╮
   40 │    ╭──────╯  ╰───╯                                       ╰────────
    0 └───┴───────┴───────┴───────┴───────┴───────┴───────┴───────┴────────► Date
        Oct 01  Oct 04  Oct 07  Oct 10  Oct 13  Oct 16  Oct 19  Oct 20
```

### Visual Specifications
- **Spline Wave Interpolation**: Powered by `cubicInterpolationMode: 'monotone'` with `tension: 0.45` to render organic curves that prevent unnatural overshoot spikes.
- **Micro-Interaction Markers**: Default state hides dense point markers (`pointRadius: 0`) for an uninterrupted line. Hovering over any timestamp reveals a crisp circular node (`pointHoverRadius: 5.5`) with a white border.
- **Dual-State Zero Fallback**: Telemetry cards dynamically toggle between the live stream and an animated empty state when no traffic is detected.

---

## 🔒 Security, Privacy & Edge Performance

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       PRIVACY-BY-DESIGN PIPELINE                      │
   │                                                                        │
   │   Raw Visitor IP  ───► [ HMAC-SHA256 ] ───► Truncated Anonymized Hash │
   │   (Never Saved)        Salt: IP_HASH_SALT    (Stored in click_events)  │
   └────────────────────────────────────────────────────────────────────────┘
```

1. **Zero-Raw-IP Retention**: Client IP addresses are immediately hashed using HMAC-SHA256 combined with a server secret `IP_HASH_SALT`. The raw IP is never logged or written to disk.
2. **First-Party Visitor Tracking**: An HTTP-only `lp_vid` cookie identifies unique visitors across distinct link clicks without cross-site tracking cookies.
3. **Bcrypt Password Gateways**: Password-protected links hash attempted inputs with `bcryptjs` (salt rounds: 10) and grant access using a signed 12-hour JWT cookie (`lp_pw`).
4. **Rate Limiting & DoS Shield**:
   - `/api` general surface: Max 300 requests per minute per IP.
   - `/api/auth` authentication surface: Max 20 attempts per 15 minutes per IP.
5. **Security Headers**: Managed by `helmet` with custom Content Security Policies (CSP), `X-Content-Type-Options: nosniff`, and `Cross-Origin-Resource-Policy: cross-origin`.

---

## 📡 API Reference

Base URL: `/api`. Authenticated endpoints require `Authorization: Bearer <JWT_TOKEN>`.

### Authentication & User
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/api/health` | — | Liveness probe & system uptime check. |
| `POST` | `/api/auth/register` | — | Register account (first user auto-assigned `admin` role). |
| `POST` | `/api/auth/login` | — | Email/password login returning JWT and user profile. |
| `POST` | `/api/auth/google` | — | Google OAuth2 token/credential exchange & user profile sync. |
| `GET` | `/api/auth/me` | 🔒 | Return currently authenticated user profile. |

### Links & Short Codes
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `POST` | `/api/links` | 🔒 | Create short link with optional passwords, expiry, device rules. |
| `GET` | `/api/links` | 🔒 | List user links with search, status, campaign, folder filters. |
| `GET` | `/api/links/:id` | 🔒 | Detailed link metadata, tag associations, and campaign info. |
| `PATCH` | `/api/links/:id` | 🔒 | Update destination, expiry, password, device rules (busts LRU cache). |
| `GET` | `/api/links/available?code=` | 🔒 | Real-time short code collision & availability check. |
| `POST` | `/api/links/validate` | 🔒 | Dry-run destination verification without creating records. |
| `POST` | `/api/links/import/preview` | 🔒 | Dry-run CSV validation for bulk link import. |
| `POST` | `/api/links/import` | 🔒 | Transactional bulk import of valid CSV records. |
| `GET` | `/api/qr/:code.png` / `.svg` | — | Render high-resolution QR code image (`?size=`, `?src=qr`). |

### Analytics & Reporting
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/api/analytics/dashboard` | 🔒 | Dashboard summary: period clicks, unique visitors, spline timeseries. |
| `GET` | `/api/analytics/link/:id` | 🔒 | Deep per-link breakdown: devices, OS, browsers, countries, referrers. |
| `GET` | `/api/analytics/campaign/:id` | 🔒 | Aggregated performance for links under a campaign. |
| `GET` | `/api/analytics/alerts` | 🔒 | Active alerts: expiring soon, click limits reached, traffic spikes. |

### Link-in-Bio & Organization
| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `GET/POST/PATCH/DELETE` | `/api/campaigns[/:id]` | 🔒 | Campaign CRUD and link grouping. |
| `GET/PATCH/DELETE` | `/api/tags[/:id]` | 🔒 | Tag management with live link counts. |
| `GET/POST/PATCH/DELETE` | `/api/folders[/:id]` | 🔒 | Workspace folder CRUD. |
| `GET/POST/PATCH/DELETE` | `/api/bio[/:id]` | 🔒 | Bio page CRUD (slug, headline, theme). |
| `PUT` | `/api/bio/:id/links` | 🔒 | Reorder bio page links and update custom button labels. |
| `GET` | `/bio/:slug` | — | **Public** server-rendered bio page (`?src=bio` tracking). |
| `GET` | `/:code` | — | **Redirect Engine**: 8-step decision pipeline and 302 jump. |

---

## 💻 Local Development & Quickstart

### Prerequisites
- **Node.js 24+** (Required for native `--env-file` and built-in `node:sqlite`).
- **npm 10+**

### 1. Clone & Setup
```bash
git clone https://github.com/kernelcorestudio/KCSTUDIO-LINKPLUSE.git
cd KCSTUDIO-LINKPLUSE
```

### 2. Configure Backend (`server/.env`)
```bash
cd server
cp .env.example .env
```
*(Default settings automatically use the built-in SQLite engine with no external database required).*

### 3. Install & Seed
```bash
npm install
npm run seed     # Optional: Generates 3 users, 20 links, and 3,900 sample clicks
npm start        # Starts Express server at http://localhost:3001
```

### 4. Configure & Start Frontend (`client/`)
```bash
# In a new terminal window:
cd client
cp .env.example .env
npm install
npm run dev      # Starts Vite dev server at http://localhost:5173
```

Open **`http://localhost:5173`** in your browser.

#### Pre-Configured Seed Logins:
*(For full capability comparison and 1-click login guides, refer to [Interactive Demo Access & Test Credentials](#interactive-demo-access--test-credentials))*

| Role | Email | Password | Primary Purpose |
|:---|:---|:---|:---|
| **Admin** | `admin@linkpulse.dev` | `admin1234` | Full platform control, domain blocklist & link moderation |
| **User** | `ada@example.com` | `password123` | Link creation, device routing, bio pages & telemetry |
| **User** | `grace@example.com` | `password123` | Secondary user for multi-tenant isolation testing |

---

## 🚀 Production Deployment (Vercel + Supabase)

LinkPulse is built for zero-configuration, single-project full-stack deployment on **Vercel** with **Supabase PostgreSQL**.

```
   ┌─────────────────────────────────────────────────────────┐
   │                    VERCEL REPOSITORY                     │
   │                                                         │
   │  ├── client/        ──► Compiled Vite SPA Static Assets │
   │  ├── server/        ──► Shared Business Logic & Engines │
   │  ├── api/index.js   ──► Serverless Function Entrypoint  │
   │  └── vercel.json    ──► Clean Edge Rewrites & Routing   │
   └─────────────────────────────────────────────────────────┘
```

### 1. Vercel Project Settings
- **Framework Preset**: `Other`
- **Root Directory**: `./`
- **Build Command**: `npm --prefix client install && npm --prefix client run build`
- **Output Directory**: `client/dist`

### 2. Production Environment Variables (Vercel Dashboard)
| Variable Key | Recommended Production Value |
|:---|:---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require` |
| `JWT_SECRET` | A secure 32+ character random string |
| `IP_HASH_SALT` | A secure random salt string |
| `COOKIE_SECURE` | `true` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth 2.0 Web Client ID |
| `BASE_URL` | `https://<your-vercel-domain>.vercel.app` |
| `CLIENT_ORIGIN` | `https://<your-vercel-domain>.vercel.app` |

> ⚠️ **Important Supabase Note**: Use the **IPv4 Connection Pooler** host (`aws-0-[region].pooler.supabase.com`) on port `5432` or `6543`. Direct connection hostnames (`db.xxxx.supabase.co`) are IPv6-only and will fail with `getaddrinfo ENOTFOUND` on serverless platforms.

---

## ⚙️ Environment Variables Guide

### Server Environment (`server/.env`)
| Variable | Required | Default | Purpose |
|:---|:---:|:---|:---|
| `PORT` | No | `3001` | Local API and redirect engine listen port. |
| `BASE_URL` | Yes (Prod) | `http://localhost:3001` | Public short-link origin; used to assemble URLs and detect self-references. |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Comma-separated CORS allowed origins. |
| `JWT_SECRET` | Yes (Prod) | Dev fallback | Secret key for signing authorization and password cookies. |
| `IP_HASH_SALT` | Yes (Prod) | Falls back to JWT | Cryptographic salt for salted SHA-256 IP address hashing. |
| `DATABASE_URL` | No | `null` (SQLite fallback) | PostgreSQL connection URI. If omitted, uses local `node:sqlite`. |
| `SQLITE_FILE` | No | `linkpulse.db` | Path to SQLite file when PostgreSQL is not configured. |
| `COOKIE_SECURE` | No | `false` | Sets `Secure` flag on visitor cookies (`true` on HTTPS). |

### Client Environment (`client/.env`)
| Variable | Required | Default | Purpose |
|:---|:---:|:---|:---|
| `VITE_API_BASE` | No | `""` (Relative proxy) | Backend URL for standalone deployments. Leave empty for Vercel unified deploy. |
| `VITE_SHORT_BASE` | No | Window origin | Public redirect domain for short links. |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Embedded default | Google Cloud OAuth2 Client ID for Google Identity Services. |

---

## 🧪 Testing & Quality Assurance

LinkPulse includes unit tests and an end-to-end integration smoke test suite covering link lifecycle, security guards, and telemetry verification.

```bash
# Run unit test suite (Node.js native test runner)
cd server
npm test

# Run full end-to-end smoke verification
node scripts/smoke.mjs
```

### Verification Results
```
✔ Unit Test Suite: 12/12 passing (0 flaky, 0 failing)
  • NanoID short code generation & uniqueness
  • URL parsing & self-reference circular guard
  • 8-step redirect engine evaluation order
  • Expired status lifecycle enforcement
  • Atomic click-limit CAS clamping
  • Bcrypt password protection & 12h signed session cookie
  • Device targeting rules (iOS, Android, Desktop)
  • Phishing domain blocklist matching
  • Bot filtering & exclusion from analytics counts
  • CSV batch import validation & error isolation
  • Link-in-bio multi-theme resolution
  • Workspace ownership and cascade invariants

✔ End-to-End Smoke Test: 73/73 assertions passing
```

---

<p align="center">
  Built with ❤️ by the <strong>KernelCoreStudio</strong> team.<br />
  Licensed under the <a href="LICENSE">MIT License</a>.
</p>
