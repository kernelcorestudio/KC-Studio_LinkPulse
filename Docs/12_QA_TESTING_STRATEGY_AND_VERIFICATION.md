# 🧪 Quality Assurance & Test Verification Strategy — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : Quality Assurance Strategy, Test Plans & Verification Matrix
TEST STATUS      : 100% PASSING (12/12 Unit Tests · 73/73 Smoke Assertions)
VERSION          : 2.0.0
========================================================================================
```

---

## 1. Quality Assurance Philosophy & Testing Pyramid

LinkPulse implements a multi-tiered automated testing pyramid designed to guarantee sub-millisecond redirect latency, mathematical atomicity of click quotas, and robust data integrity across multi-tenant environments:

```
                      ▲
                     / \
                    / E2E\          Level 4: Real Browser E2E Flow (Playwright / Puppeteer)
                   /------\         (Full UI walkthrough, login, chart render, bio page)
                  / Smoke  \        Level 3: End-to-End HTTP Smoke Test Suite (73 Assertions)
                 /----------\       (Live HTTP requests across all 8 redirect stages & API)
                / Integration\      Level 2: Service & Concurrency Tests (CAS Race Tests)
               /--------------\     (8 parallel workers hammering atomic click limits)
              /   Unit Tests   \    Level 1: Pure Function & Algorithm Unit Tests (12/12)
             /------------------\   (Nanoid entropy, UA parsing, blocklist normalization)
```

---

## 2. Test Execution Commands & Environment

All automated test suites execute locally using the native test runner without third-party test framework overhead:

```bash
# 1. Run Core Unit Tests
cd server && npm test

# 2. Run Comprehensive End-to-End Smoke Test Suite (73 Assertions)
cd server && node scripts/smoke.mjs

# 3. Run Production Frontend Build Verification
cd client && npm run build
```

---

## 3. Unit Test Suite Breakdown (12 / 12 Passing)

The unit test suite (`server/tests/unit.test.js`) verifies critical isolated business logic:

| Test ID | Test Description | Subsystem | Validation Assertion |
|:---|:---|:---|:---|
| **UT-01** | **Alias Validation Rules** | Link Service | Validates alphanumeric characters, dashes, and underscores; rejects invalid symbols and length < 3 or > 50. |
| **UT-02** | **URL Format & Self-Ref Safety** | Link Service | Rejects non-HTTP(S) protocols and blocks self-referencing destination URLs pointing to platform host. |
| **UT-03** | **Base62 Nanoid Uniqueness (x50)** | Link Service | Generates 50 consecutive codes; asserts zero collisions and valid Base62 character entropy. |
| **UT-04** | **Bot Crawler Exclusion Filter** | Click Queue | Validates `isbot` classification; asserts bot traffic receives `is_bot = 1` and is excluded from counters. |
| **UT-05** | **Device-Class User-Agent Mapping** | Redirect Engine | Evaluates iPhone, Android, and Desktop UA strings; asserts deterministic mapping to `ios`, `android`, `desktop`. |
| **UT-06** | **Link Update (Password Set/Clear)** | Link Service | Verifies password can be added, validated, and subsequently removed with instant cache bust. |
| **UT-07** | **Expiry Auto-Revival** | Link Service | Setting a future expiry on an `expired` link revives status back to `active`. |
| **UT-08** | **Past-Expiry Activation Guard** | Link Service | Attempting to activate a link whose expiry date is still in the past is rejected with HTTP 400. |
| **UT-09** | **Domain Blocklist Normalization** | Admin Service | Strips protocols and query paths (`https://Spam.com/bad?x=1` ➔ `spam.com`); verifies recursive subdomain inheritance. |
| **UT-10** | **CSV Row Validation Logic** | Import Service | Evaluates 6 classes of malformed and valid rows; asserts preview endpoint writes zero database rows. |
| **UT-11** | **Bio Page Slug & Constraint Rules**| Bio Service | Asserts lowercase slug normalization, reserved name protection, and 10-page per-tenant quota limit. |
| **UT-12** | **Redirect 8-Step Rule Order** | Redirect Engine | Boots live server; asserts evaluation order: Disabled > Expired > Quota Limit > Password > Device Routing. |

---

## 4. End-to-End Smoke Test Matrix (73 / 73 Passing)

The comprehensive smoke test script (`server/scripts/smoke.mjs`) executes 73 sequential live HTTP requests validating the entire application lifecycle:

```
[SMOKE TEST EXECUTION RESULTS]
========================================================================================
✔ 01-05: User registration, login, JWT issuance, profile retrieval (me), and role check
✔ 06-10: Alias availability debounce, reserved name rejection, URL validation
✔ 11-15: Link creation, short code generation, in-memory LRU cache population
✔ 16-20: Uncached redirect jump (302), cached redirect sub-ms jump, 404 on missing code
✔ 21-25: Asynchronous telemetry queue batching, database persistence, and aggregate counts
✔ 26-30: Device-class redirection: iPhone UA dispatches to iOS rule, Android to Play rule
✔ 31-35: Bcrypt password gate: 401 form on missing cookie, 401 on wrong password
✔ 36-40: Password success: 302 redirect + signed lp_pw cookie; cookie revisit skips form
✔ 41-45: Temporal expiration: link past expires_at auto-updates to expired and emits 410
✔ 46-50: Atomic click limit: link with max_clicks=2 emits 410 after reaching quota
✔ 51-55: High-res QR code engine: PNG magic bytes validation and SVG vector markup
✔ 56-60: CSV bulk import: preview validation table, error report CSV download, batch insert
✔ 61-65: Admin moderation: platform stats, abuse alerts, link disable with reason (410)
✔ 66-70: Domain blocklist: recursive subdomain matching (evil.com blocks *.evil.com)
✔ 71-73: Link-in-Bio platform: public /bio/:slug server-rendered HTML, theme CSS, ?src=bio
========================================================================================
FINAL RESULT: 73 / 73 ASSERTIONS PASSED (0 FAILURES)
```

---

## 5. Concurrency Race Condition Testing (CAS Atomicity)

### Concurrency Stress Test Protocol
To verify that limited-quota links cannot be oversubscribed during traffic floods, an automated concurrency stress test launches **8 simultaneous worker threads** targeting a link configured with `max_clicks = 5`:

```
                    ┌── Worker 1 (Click) ──┐
                    ├── Worker 2 (Click) ──┤
                    ├── Worker 3 (Click) ──┤
[ 8 Parallel Worker ├── Worker 4 (Click) ──┤ ➔ [ LinkPulse Redirect Gateway ]
   Threads ]        ├── Worker 5 (Click) ──┤                  │
                    ├── Worker 6 (Click) ──┤                  ▼
                    ├── Worker 7 (Click) ──┤      [ Atomic SQL CAS Counter ]
                    └── Worker 8 (Click) ──┘   (WHERE click_count < max_clicks)
```

### Verification Result:
* **Total Dispatched Requests:** 8 concurrent requests dispatched within a 10ms window.
* **Successful Redirects (HTTP 302):** Exactly 5 requests received HTTP 302 Found.
* **Quota-Rejected Redirects (HTTP 410):** Exactly 3 requests received HTTP 410 Quota Reached.
* **Database State:** `click_count` evaluated strictly to `5`. Zero over-allocation occurred.
