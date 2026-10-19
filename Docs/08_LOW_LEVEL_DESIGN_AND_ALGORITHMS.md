# ⚙️ Low-Level Design Document & Core Algorithms (LLD) — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : Low-Level Technical Design & Algorithmic Specifications (LLD)
VERSION          : 2.0.0
STATUS           : APPROVED & CODE BASELINED
========================================================================================
```

---

## 1. Module & Service Architecture

The LinkPulse backend codebase (`server/src/`) is structured following the **Service-Oriented Architectural Pattern** with strict separation between routing, business logic, persistence adapters, and asynchronous background workers:

```
server/src/
├── config.js              # Centralized environment parsing & validation (Zod)
├── index.js               # Application bootstrap, Express server setup & port binding
├── db/
│   ├── index.js           # Dual-dialect DB adapter (PostgreSQL & node:sqlite translation)
│   ├── schema.pg.sql      # Production PostgreSQL DDL migrations
│   └── schema.sqlite.sql  # Local development SQLite DDL migrations
├── middleware/
│   ├── auth.js            # JWT verification & RBAC middleware (requireAuth, requireAdmin)
│   ├── rateLimiter.js     # IP & user-based rate limiters (auth, creation, import)
│   └── validate.js        # Request schema validation engine (Zod)
├── routes/
│   ├── adminRoutes.js     # Platform administration & moderation endpoints
│   ├── analyticsRoutes.js # Telemetry aggregation & timeseries endpoints
│   ├── authRoutes.js      # Register, login, GIS Google OAuth, me endpoints
│   ├── bioRoutes.js       # Bio page CRUD & public GET /bio/:slug routes
│   ├── linkRoutes.js      # Link CRUD, availability check & settings routes
│   ├── orgRoutes.js       # Campaigns, folders, tags CRUD endpoints
│   ├── qrRoutes.js        # High-res PNG & SVG QR generation routes
│   └── redirectRoutes.js  # High-performance 8-Step GET /:code redirect engine
├── services/
│   ├── adminService.js    # Abuse detection heuristics & blocklist logic
│   ├── analyticsService.js# Timeseries, device/geo breakdowns, alert aggregations
│   ├── authService.js     # User registration, password hashing, JWT signing
│   ├── bioService.js      # Bio page layout, link ordering & server-rendering
│   ├── importService.js   # Client-side parsed CSV validation & batch insert
│   └── linkService.js     # Nanoid code generation, link CRUD & cache bust
└── workers/
    ├── clickQueue.js      # In-memory batch event queue & worker flush loop
    └── lruCache.js        # In-memory LRU redirect cache (Map-based with TTL)
```

---

## 2. The 8-Step Redirect Decision State Machine

The core redirection handler (`GET /:code`) executes a deterministic state machine designed for sub-millisecond execution:

```
                           [ Visitor Request: GET /:code ]
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │ Step 1: Cache Lookup  │
                             └───────────┬───────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 [ Found in Cache ]             [ Cache Miss ]
                         │                               │
                         │                               ▼
                         │                     [ Query Database ]
                         │                               │
                         │                   ┌───────────┴───────────┐
                         │                   ▼                       ▼
                         │              [ Found ]              [ Not Found ]
                         │                   │                       │
                         │                   ▼                       ▼
                         │           [ Populate Cache ]      [ Return HTTP 404 ]
                         │                   │
                         └───────────┬───────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │  Step 2: Status Check   │
                        └────────────┬────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
            [ status == 'active' ]         [ status != 'active' ]
                     │                               │
                     │                               ▼
                     │                     [ Return HTTP 410 Gone ]
                     │                     (With Admin Reason)
                     ▼
        ┌─────────────────────────┐
        │ Step 3: Domain Blocklist│
        └────────────┬────────────┘
                     │
             ┌───────┴───────┐
             ▼               ▼
         [ Allowed ]     [ Blocked ]
             │               │
             │               ▼
             │     [ Return HTTP 403 Forbidden ]
             │     (Subdomain-Inherited Shield)
             ▼
        ┌─────────────────────────┐
        │  Step 4: Expiry Check   │
        └────────────┬────────────┘
                     │
             ┌───────┴───────┐
             ▼               ▼
        [ Valid Time ]  [ Expired (UTC > expires_at) ]
             │               │
             │               ▼
             │     [ Auto-Update status = 'expired' ]
             │     [ Bust LRU Cache ]
             │     [ Return HTTP 410 Expired Page ]
             ▼
        ┌─────────────────────────┐
        │ Step 5: Click Quota CAS │
        └────────────┬────────────┘
                     │
             ┌───────┴───────┐
             ▼               ▼
       [ clicks < max ] [ clicks >= max ]
             │               │
             │               ▼
             │     [ Return HTTP 410 Quota Reached ]
             ▼
        ┌─────────────────────────┐
        │ Step 6: Password Check  │
        └────────────┬────────────┘
                     │
             ┌───────┴───────┐
             ▼               ▼
       [ No Password ]  [ Password Set ]
             │               │
             │               ▼
             │     [ Has valid "lp_pw" cookie? ]
             │               │
             │       ┌───────┴───────┐
             │       ▼               ▼
             │     [ YES ]         [ NO ]
             │       │               │
             │       │               ▼
             │       │     [ Return HTTP 401 Form ]
             ▼       ▼     (POST /:code password unlock)
        ┌─────────────────────────┐
        │ Step 7: Device Routing  │
        └────────────┬────────────┘
                     │
         Inspect User-Agent Header
         ├── iOS?     ➔ Pick link.device_rules.ios
         ├── Android? ➔ Pick link.device_rules.android
         └── Desktop? ➔ Pick link.device_rules.desktop
         (Fallback to default destination if rule is unset)
                     │
                     ▼
        ┌─────────────────────────┐
        │ Step 8: HTTP 302 Found  │
        └────────────┬────────────┘
                     │
         Emit HTTP 302 Jump Response
         Header: Cache-Control: no-store
                     │
                     ▼
         Push Telemetry Event to ClickQueue (Async)
```

---

## 3. Core Mathematical & Algorithmic Formulations

### 3.1 Base62 Nanoid Short Code Generation & Collision Algorithm
LinkPulse generates high-entropy short codes using a Base62 alphabet (`0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`).

$$\text{Alphabet Size } (\Sigma) = 62$$
$$\text{Code Length } (L) = 6 \text{ to } 8 \text{ characters}$$
$$\text{Total Combinations } (N) = 62^6 \approx 56.8 \times 10^9 \text{ permutations}$$

#### Collision Resolution Algorithm:
```javascript
async function generateUniqueCode(db, preferredLength = 6, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Dynamically expand code length if collisions increase
    const length = attempt > 2 ? preferredLength + 1 : preferredLength;
    const code = nanoid(length);
    
    // Check reserved keyword dictionary
    if (RESERVED_ALIASES.has(code.toLowerCase())) continue;
    
    // Verify database uniqueness
    const existing = await db.get("SELECT id FROM links WHERE code = ?", [code]);
    if (!existing) {
      return code;
    }
  }
  throw new Error("ERR_CODE_COLLISION_EXHAUSTED");
}
```

### 3.2 Salted HMAC Visitor Fingerprinting Algorithm
To comply with GDPR and CCPA without sacrificing unique visitor tracking accuracy, LinkPulse implements a cryptographically secure, one-way visitor hash:

$$\text{Visitor Hash} = \text{HMAC-SHA256}(\text{Visitor IP} + \text{User-Agent}, \text{Rotating Private Salt})$$

```javascript
import crypto from "node:crypto";

function computeVisitorFingerprint(req, rotatingSalt) {
  // Check for first-party cookie identifier first
  if (req.cookies && req.cookies.lp_vid) {
    return req.cookies.lp_vid;
  }
  
  // Extract client IP (respecting trusted proxy headers)
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "";
  
  // Compute one-way cryptographic HMAC hash
  const hmac = crypto.createHmac("sha256", rotatingSalt);
  hmac.update(`${clientIp}::${userAgent}`);
  return hmac.digest("hex").slice(0, 32);
}
```

### 3.3 Monotone Cubic Spline Wave Telemetry Formulation
To present click timelines without the jarring jagged spikes of standard linear interpolation, LinkPulse uses **Monotone Cubic Spline Interpolation** (`Fritsch-Carlson algorithm`) configured in Chart.js.

Given $n$ chronological data points $(x_k, y_k)$, the spline piecewise polynomial $S_k(x)$ on $[x_k, x_{k+1}]$ satisfies:
1. $S_k(x_k) = y_k$ and $S_k(x_{k+1}) = y_{k+1}$ (Interpolation)
2. $S'_k(x_{k+1}) = S'_{k+1}(x_{k+1})$ (Continuous first derivative)
3. $S(x)$ is monotonic on $[x_k, x_{k+1}]$ if and only if the data points are monotonic.

#### Chart.js Configuration Spec:
```javascript
export const splineWaveChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  elements: {
    line: {
      tension: 0.45,             // Monotone cubic spline elasticity
      cubicInterpolationMode: 'monotone', // Prevents overshoot below zero
      borderColor: '#FFE3B3',    // Signature theme color
      borderWidth: 2.5,
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 227, 179, 0.35)');
        gradient.addColorStop(1, 'rgba(255, 227, 179, 0.00)');
        return gradient;
      }
    },
    point: {
      radius: 0,                 // Hidden during normal display for sleek aesthetics
      hoverRadius: 6,            // Expands to 6px on cursor hover
      hoverBackgroundColor: '#FFE3B3',
      hoverBorderColor: '#0C0C0F',
      hoverBorderWidth: 2
    }
  },
  scales: {
    y: {
      beginAtZero: true,         // Anchors baseline strictly to zero
      ticks: { precision: 0 }    // Discrete integer click counts
    }
  }
};
```

---

## 4. Asynchronous Queue Concurrency & Backpressure Algorithm

The `ClickQueue` class coordinates in-memory buffering, batch commits, and process signal hooks:

```javascript
class ClickQueue {
  constructor(db, flushIntervalMs = 1000, maxBatchSize = 200, maxCapacity = 5000) {
    this.db = db;
    this.flushIntervalMs = flushIntervalMs;
    this.maxBatchSize = maxBatchSize;
    this.maxCapacity = maxCapacity;
    this.buffer = [];
    this.timer = null;
    this.isFlushing = false;
    
    this.startWorker();
    this.registerSignalHooks();
  }

  push(event) {
    // Enforce backpressure limit
    if (this.buffer.length >= this.maxCapacity) {
      if (event.is_bot) return; // Drop bot telemetry under high backpressure
      this.flushNow(); // Force immediate emergency flush
    }
    
    this.buffer.push(event);
    
    if (this.buffer.length >= this.maxBatchSize) {
      this.flushNow();
    }
  }

  async flushNow() {
    if (this.isFlushing || this.buffer.length === 0) return;
    this.isFlushing = true;
    
    const batch = this.buffer.splice(0, this.maxBatchSize);
    
    try {
      await this.db.transaction(async (tx) => {
        // 1. Bulk insert events
        await tx.insertMany("click_events", batch);
        
        // 2. Aggregate counts per link and update atomically
        const countsByLink = groupCountsByLink(batch.filter(e => !e.is_bot));
        for (const [linkId, count] of Object.entries(countsByLink)) {
          await tx.query(
            `UPDATE links 
             SET click_count = click_count + ?, 
                 last_clicked_at = ? 
             WHERE id = ? AND (max_clicks IS NULL OR click_count < max_clicks)`,
            [count, new Date().toISOString(), linkId]
          );
        }
      });
    } catch (err) {
      console.error("[ClickQueue] Batch write error. Retrying...", err);
      // Re-insert unwritten batch to front of buffer for retry
      this.buffer.unshift(...batch);
    } finally {
      this.isFlushing = false;
    }
  }
  
  registerSignalHooks() {
    const gracefulDrain = async (signal) => {
      clearInterval(this.timer);
      console.log(`[ClickQueue] Received ${signal}. Draining ${this.buffer.length} events...`);
      while (this.buffer.length > 0) {
        await this.flushNow();
      }
      process.exit(0);
    };
    
    process.on("SIGTERM", () => gracefulDrain("SIGTERM"));
    process.on("SIGINT", () => gracefulDrain("SIGINT"));
  }
}
```
