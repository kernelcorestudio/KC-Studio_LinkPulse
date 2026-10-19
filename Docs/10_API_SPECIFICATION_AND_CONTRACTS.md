# 📡 API Specification & System Contracts — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : REST API Specification (OpenAPI 3.0 Standard)
BASE URL         : https://kcstudio-linkpluse.vercel.app / http://localhost:3001
AUTHENTICATION   : Authorization: Bearer <JWT>
VERSION          : 2.0.0
========================================================================================
```

---

## 1. General Principles & Standards

### 1.1 Headers
* `Content-Type: application/json` (Required on all POST, PUT, PATCH requests)
* `Authorization: Bearer <jwt_token>` (Required for protected endpoints)
* `Cache-Control: no-store` (Enforced on all redirect responses and live telemetry)

### 1.2 Unified Success & Error Envelopes
All API responses follow consistent JSON structural envelopes:

#### Success Envelope:
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERR_VALIDATION_FAILED",
    "message": "Human readable explanation of the failure",
    "details": [ ... ]
  }
}
```

---

## 2. API Catalog by Subsystem

### 2.1 Identity & Authentication
```
POST /api/auth/register       Register new tenant account (First account = Admin)
POST /api/auth/login          Authenticate credentials; returns 7-day JWT token
POST /api/auth/google         Authenticate via Google Identity Services (GIS)
GET  /api/auth/me             Retrieve authenticated profile, role & preferences
```

#### `POST /api/auth/login`
* **Request:**
  ```json
  {
    "email": "ada@example.com",
    "password": "password123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_912384912",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "user"
    }
  }
  ```

---

### 2.2 Link Management & Availability
```
GET   /api/links               List user links (Supports ?page=&campaignId=&tagId=&search=)
POST  /api/links               Create new short link (Evaluates full validation wizard)
GET   /api/links/available     Check custom alias availability (Real-time debounce)
GET   /api/links/:id           Retrieve link configuration and summary stats
PATCH /api/links/:id           Update link rules, device targeting, expiry & password
```

#### `POST /api/links`
* **Request:**
  ```json
  {
    "destinationUrl": "https://www.kernelcorestudio.com/launch",
    "customAlias": "spring-drop",
    "title": "Spring Product Launch",
    "campaignId": "cmp_847192",
    "folderId": "fld_102934",
    "tags": ["social", "influencer", "q2"],
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "maxClicks": 5000,
    "password": "optional_password",
    "deviceRules": {
      "ios": "https://apps.apple.com/app/id123456789",
      "android": "https://play.google.com/store/apps/details?id=com.app",
      "desktop": "https://www.kernelcorestudio.com/launch"
    }
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "lnk_59283741",
    "code": "spring-drop",
    "shortUrl": "https://kcstudio-linkpluse.vercel.app/spring-drop",
    "destinationUrl": "https://www.kernelcorestudio.com/launch",
    "status": "active",
    "clickCount": 0,
    "createdAt": "2026-10-20T12:00:00.000Z"
  }
  ```

---

### 2.3 Edge Redirection Engine
```
GET  /:code                    8-Step redirection evaluation (Returns 302 / 401 / 403 / 410)
POST /:code                    Submit password unlock form (Sets 12h signed lp_pw cookie)
```

#### `GET /:code` Response Headers:
```http
HTTP/1.1 302 Found
Location: https://apps.apple.com/app/id123456789
Cache-Control: no-store, no-cache, must-revalidate
Set-Cookie: lp_vid=a8f9c102b384...; Path=/; Max-Age=31536000; SameSite=Lax
```

---

### 2.4 Telemetry & Analytics
```
GET /api/analytics/dashboard   Overall workspace telemetry (Today / 7d / 30d / Custom)
GET /api/analytics/links/:id   Deep timeseries, browser, OS, country, and city metrics
GET /api/analytics/campaigns/:id Aggregated performance across all links in campaign
GET /api/analytics/alerts      Active link alerts (Expiring, near quota, spike anomalies)
```

#### `GET /api/analytics/links/:id?period=7d`
* **Response (200 OK):**
  ```json
  {
    "summary": {
      "totalClicks": 1284,
      "uniqueVisitors": 942,
      "qrScans": 312,
      "botClicks": 48
    },
    "timeseries": [
      { "date": "2026-10-14", "clicks": 142, "uniques": 110 },
      { "date": "2026-10-15", "clicks": 289, "uniques": 204 },
      { "date": "2026-10-16", "clicks": 381, "uniques": 298 }
    ],
    "breakdowns": {
      "devices": { "mobile": 68.4, "desktop": 28.2, "tablet": 3.4 },
      "operatingSystems": { "iOS": 42.1, "Android": 26.3, "macOS": 18.2, "Windows": 13.4 },
      "browsers": { "Mobile Safari": 41.2, "Chrome": 38.6, "Firefox": 8.1 },
      "countries": [
        { "code": "US", "name": "United States", "clicks": 680 },
        { "code": "IN", "name": "India", "clicks": 310 }
      ],
      "referrers": [
        { "host": "instagram.com", "clicks": 490 },
        { "host": "youtube.com", "clicks": 312 },
        { "host": "Direct", "clicks": 280 }
      ]
    }
  }
  ```

---

### 2.5 High-Resolution QR Code Engine
```
GET /api/qr/:code.png          Direct PNG QR code stream (?size=64..2048, default 400)
GET /api/qr/:code.svg          Direct vector SVG QR stream (?size=64..2048, default 400)
```
* **Attribution:** QR codes automatically encode `${BASE_URL}/${code}?src=qr` to attribute scan events in telemetry.
* **Caching:** Responses carry `Cache-Control: public, max-age=86400` (Cached for 24 hours at edge CDN).

---

### 2.6 Link-in-Bio Suite
```
GET  /api/bio                  List authenticated user's bio pages
POST /api/bio                  Create new bio page with unique slug
GET  /api/bio/:id              Retrieve bio page configuration and button hierarchy
PUT  /api/bio/:id              Update title, bio text, theme, and ordered links
GET  /bio/:slug                Public server-rendered HTML profile page
```

---

### 2.7 Administration & Moderation (Admin Role Only)
```
GET    /api/admin/stats        Platform-wide totals, bot ratio, top domains & growth
GET    /api/admin/alerts       Abuse detection (bot-heavy links, click velocity spikes)
GET    /api/admin/links        Search platform links with owner email, status & counts
PATCH  /api/admin/links/:id/status Enable / disable link with custom reason (busting cache)
GET    /api/admin/blocklist    List all active phishing / malware blocked domains
POST   /api/admin/blocklist    Add domain to blocklist (Automatically inherits subdomains)
DELETE /api/admin/blocklist/:id Remove domain from blocklist (Restores redirects)
```

---

## 3. HTTP Status Codes & Error Registry

| HTTP Code | Error Constant | Trigger Condition |
|:---:|:---|:---|
| **200** | `SUCCESS` | Request processed successfully. |
| **201** | `CREATED` | Resource successfully persisted. |
| **302** | `FOUND` | Successful short URL redirect (emits target in `Location` header). |
| **400** | `ERR_VALIDATION` | Malformed body, invalid destination URL, or reserved alias requested. |
| **401** | `ERR_AUTH_REQUIRED` | Missing/expired JWT or password-protected link without `lp_pw` cookie. |
| **403** | `ERR_FORBIDDEN` | Accessing foreign tenant resource or accessing phishing-blocked domain. |
| **404** | `ERR_NOT_FOUND` | Link code does not exist. |
| **409** | `ERR_ALIAS_CONFLICT` | Requested custom alias or bio slug is already registered. |
| **410** | `ERR_GONE` | Link has expired, reached max click quota, or was disabled by admin. |
| **429** | `ERR_RATE_LIMITED` | Exceeded IP rate limit or tenant link creation quota. |
| **500** | `ERR_SERVER_ERROR` | Internal unhandled exception (triggers error logging). |
