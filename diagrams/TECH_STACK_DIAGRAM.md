# Tech Stack Architecture Diagram — Graphic Era Hill University (Tech Geeks)

Dokumentation slide aur presentation specs ke basis par LinkPulse platform ke **Full Tech Stack Diagram**, component breakdown aur deployment topography ko present karta hai.

---

## 1. Master Tech Stack Visual Diagram

```mermaid
graph TB
    %% STYLING CONFIG
    classDef clientStyle fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef backendStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef dbStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef libStyle fill:#701a75,stroke:#f472b6,stroke-width:2px,color:#f8fafc;
    classDef deployStyle fill:#451a03,stroke:#fb923c,stroke-width:2px,color:#f8fafc;

    subgraph PRESENTATION["1. FRONTEND TIER"]
        direction TB
        F_React["React (Vite) + React Router<br>• SPA structure & dynamic routing<br>• Fast HMR dev build"]
        F_Tailwind["Tailwind CSS<br>• Terminal & retro-synthwave UI<br>• Responsive styling"]
        F_Charts["Chart.js (react-chartjs-2)<br>• Interactive analytics & metrics<br>• Time-series & geo graphs"]
    end
    class F_React,F_Tailwind,F_Charts clientStyle

    subgraph CORE_LIBS["4. CORE LIBRARIES & UTILITIES"]
        direction TB
        L_Nanoid["Nanoid<br>• Collision-safe Base62 short codes"]
        L_QR["QRCode<br>• Dynamic SVG/PNG QR generation"]
        L_Intel["UA-Parser-JS + Isbot + GeoIP-Lite<br>• Device classification (iOS/Android/Desktop)<br>• Bot traffic exclusion<br>• Country & City geolocation"]
        L_CSV["PapaParse + Multer<br>• Multipart CSV upload & streaming parsing"]
    end
    class L_Nanoid,L_QR,L_Intel,L_CSV libStyle

    subgraph SERVER_TIER["2. BACKEND & SECURITY TIER"]
        direction TB
        B_Express["Node.js + Express 4 ESM<br>• REST API routing & redirect engine<br>• Sub-second 302 handlers"]
        B_Security["Security Stack<br>• Helmet: Secure HTTP headers<br>• CORS: Controlled cross-origin access<br>• Express-Rate-Limit: Abuse prevention"]
        B_Auth["Auth & Hashing<br>• JWT Authentication (Bearer / Cookies)<br>• Bcrypt / Bcryptjs (Password hashing)"]
        B_Zod["Zod<br>• Strict schema & payload validation"]
    end
    class B_Express,B_Security,B_Auth,B_Zod backendStyle

    subgraph DATA_TIER["3. DATABASE & PERSISTENCE TIER"]
        direction TB
        DB_PG[("PostgreSQL (Neon / Supabase)<br>• Production managed cloud database<br>• Pool connections & relational constraints")]
        DB_Sqlite[("SQLite Fallback (node:sqlite)<br>• Zero-dependency local development<br>• Fast offline embedded storage")]
    end
    class DB_PG,DB_Sqlite dbStyle

    subgraph DEPLOY_TIER["5. DEPLOYMENT & CLOUD HOSTING"]
        direction TB
        D_Front["Frontend Deployment<br>• Vercel / Netlify CDN"]
        D_Back["Backend Deployment<br>• Render / Railway Web Service"]
        D_DB["Cloud Database<br>• Neon / Supabase Cloud DB"]
    end
    class D_Front,D_Back,D_DB deployStyle

    %% PIPELINE CONNECTIONS
    PRESENTATION ==>|HTTPS / REST API| SERVER_TIER
    SERVER_TIER <-->|Short Code Gen / QR / Enrich / Import| CORE_LIBS
    SERVER_TIER ==>|Unified Dialect Adapter| DATA_TIER

    %% DEPLOYMENT MAPPINGS
    F_React -.->|Hosted On| D_Front
    B_Express -.->|Runs On| D_Back
    DB_PG -.->|Managed At| D_DB
```

---

## 2. Interactive Data & Request Flow Across the Stack

```mermaid
sequenceDiagram
    autonumber
    participant Client as Frontend (React + Vite + Tailwind + Chart.js)
    participant Edge as Security & Gateway (Helmet + CORS + RateLimit)
    participant API as Backend (Node.js + Express)
    participant Libs as Core Libraries (Nanoid, Zod, UA/GeoIP, QR, PapaParse)
    participant DB as Database (Postgres Neon / SQLite)

    Note over Client,Edge: User creates a new short link
    Client->>Edge: POST /api/links (Bearer JWT token)
    Edge->>Edge: Verify Origin (CORS) & Apply Rate Limiting
    Edge->>API: Forward clean request
    API->>Libs: Zod validate schema & check destination URL
    alt Custom Alias not provided
        API->>Libs: Nanoid generates unique short code
    end
    API->>DB: INSERT INTO links (short_code, destination, owner_id)
    DB-->>API: Link saved
    API-->>Client: HTTP 201 { id, short_code, qr_code_url }

    Note over Client,Edge: Visitor scans QR / clicks short code
    Client->>API: GET /:code
    API->>Libs: UA-Parser-JS + GeoIP-Lite + Isbot enrich click context
    API-->>Client: HTTP 302 Redirect to Destination (instant!)
    Note over API,DB: Background batch worker flushes clicks to DB
```

---

## 3. Tech Stack Matrix & Implementation Mapping

### 1. Frontend
| Technology | Role & Purpose | Repository Location |
|:---|:---|:---|
| **React (Vite)** | High-performance Single Page Application (SPA), lightning-fast Hot Module Replacement | [client/package.json](file:///c:/Users/ankus/Downloads/haldwani/client/package.json), [client/vite.config.js](file:///c:/Users/ankus/Downloads/haldwani/client/vite.config.js) |
| **React Router** | Client-side routing across Dashboard, Links, Campaigns, Folders, Bio, Admin | [client/src/App.jsx](file:///c:/Users/ankus/Downloads/haldwani/client/src/App.jsx) |
| **Tailwind CSS** | Custom cyberpunk/retro-synthwave UI, dark mode palette, responsive design tokens | [client/tailwind.config.js](file:///c:/Users/ankus/Downloads/haldwani/client/tailwind.config.js), [client/src/index.css](file:///c:/Users/ankus/Downloads/haldwani/client/src/index.css) |
| **Chart.js** | Time-series click graphs, country choropleths, device breakdown donut charts | [client/src/pages/Dashboard.jsx](file:///c:/Users/ankus/Downloads/haldwani/client/src/pages/Dashboard.jsx), [client/src/pages/LinkDetail.jsx](file:///c:/Users/ankus/Downloads/haldwani/client/src/pages/LinkDetail.jsx) |

---

### 2. Backend
| Technology | Role & Purpose | Repository Location |
|:---|:---|:---|
| **Node.js + Express** | High-concurrency asynchronous runtime & RESTful API server with sub-second redirect engine | [server/src/index.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/index.js), [server/src/app.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/app.js) |
| **JWT Authentication** | Stateless JWT tokens (7-day validity) for authorized dashboard & administrative sessions | [server/src/middleware/auth.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/middleware/auth.js), [server/src/services/authService.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/services/authService.js) |
| **Bcrypt / Bcryptjs** | Cryptographic salted hashing (10 rounds) for user credentials and link passwords | [server/src/services/authService.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/services/authService.js), [server/src/routes/redirectRoutes.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/routes/redirectRoutes.js) |
| **Zod** | Declarative runtime validation for user inputs, aliases, URLs, and device targeting rules | [server/src/utils/validation.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/utils/validation.js) |
| **Helmet** | Strict CSP, HSTS, X-Content-Type-Options, Frameguard headers | [server/src/app.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/app.js#L26) |
| **CORS** | Origin whitelisting between frontend domain and backend API | [server/src/app.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/app.js#L27) |
| **Express-Rate-Limit** | Volumetric brute-force and DoS protection for auth and redirect routes | [server/src/app.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/app.js#L29) |

---

### 3. Database
| Technology | Role & Purpose | Repository Location |
|:---|:---|:---|
| **PostgreSQL (Neon / Supabase)** | High-throughput cloud SQL database with connection pooling and relational integrity | [server/src/db/schema.pg.sql](file:///c:/Users/ankus/Downloads/haldwani/server/src/db/schema.pg.sql), [server/src/db/index.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/db/index.js) |
| **SQLite Fallback** | Built-in Node 24 zero-dependency `node:sqlite` for fast offline development | [server/src/db/schema.sqlite.sql](file:///c:/Users/ankus/Downloads/haldwani/server/src/db/schema.sqlite.sql), [server/src/db/index.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/db/index.js) |

---

### 4. Core Libraries
| Library | Role & Purpose | Repository Location |
|:---|:---|:---|
| **Nanoid** | URL-friendly, collision-safe Base62 short alphanumeric code generator | [server/src/utils/shortCode.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/utils/shortCode.js) |
| **QRCode** | Generates crisp vector SVG and high-resolution PNG QR codes with error correction | [server/src/routes/qrRoutes.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/routes/qrRoutes.js) |
| **UA-Parser-JS** | Parses `User-Agent` to determine client device class (`ios`, `android`, `desktop`), OS, and browser | [server/src/utils/clickContext.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/utils/clickContext.js) |
| **Isbot** | Detects and tags web crawlers, search bots, and monitoring pingers to keep analytics clean | [server/src/utils/clickContext.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/utils/clickContext.js) |
| **GeoIP-Lite** | Fast, local offline IP-to-Country and IP-to-City geographical coordinate resolution | [server/src/utils/clickContext.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/utils/clickContext.js) |
| **PapaParse + Multer** | Streaming multipart CSV uploads for bulk link import with live validation preview | [server/src/services/importService.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/services/importService.js), [server/src/routes/linkRoutes.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/routes/linkRoutes.js) |

---

### 5. Deployment
| Platform | Target Component | Configuration File |
|:---|:---|:---|
| **Vercel / Netlify** | Frontend React SPA CDN deployment with rewrite rules for client routing | [client/vercel.json](file:///c:/Users/ankus/Downloads/haldwani/client/vercel.json), [netlify.toml](file:///c:/Users/ankus/Downloads/haldwani/netlify.toml) |
| **Render / Railway** | Backend Node.js Express web service container | [render.yaml](file:///c:/Users/ankus/Downloads/haldwani/render.yaml) |
| **Neon / Supabase** | Managed Serverless PostgreSQL instance with automated migrations | Configured via `DATABASE_URL` in [server/src/config.js](file:///c:/Users/ankus/Downloads/haldwani/server/src/config.js) |
