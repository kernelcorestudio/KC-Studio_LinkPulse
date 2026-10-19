# 🛡️ Security Architecture, Threat Model (STRIDE) & Compliance — LinkPulse

```
========================================================================================
PROJECT          : LinkPulse (Next-Gen URL Infrastructure & Telemetry Route Engine)
DOCUMENT TYPE    : Security Threat Model & Compliance Audit (STRIDE / OWASP Top 10)
COMPLIANCE SCOPE : GDPR, CCPA, ISO 27001 Security Best Practices
VERSION          : 2.0.0
========================================================================================
```

---

## 1. Security Architecture & Threat Principles

LinkPulse enforces a **Zero-Trust Security Architecture** across all touchpoints:
1. **Never Trust Client Inputs:** Strict payload schema validation using `zod` and URL parsing before database execution.
2. **Cryptographic Integrity:** High-cost salted password hashing (`bcryptjs`), cryptographic HMAC cookie signing, and Bearer JWT signature verification.
3. **Data Minimization & Privacy by Design:** Absolute refusal to store raw IP addresses, eliminating GDPR/CCPA regulatory exposure.
4. **Tenant Isolation:** Enforcing tenant ID checks (`WHERE owner_id = $id`) on every data query to prevent broken object-level authorization (BOLA).

---

## 2. STRIDE Threat Model Analysis

```
┌────────────────────────────────────────────────────────────────────────┐
│                          STRIDE THREAT MATRIX                          │
├─────────────────────────┬──────────────────────────────────────────────┤
│ THREAT CATEGORY         │ LINKPULSE COUNTERMEASURE IMPLEMENTATION      │
├─────────────────────────┼──────────────────────────────────────────────┤
│ S - Spoofing Identity   │ JWT signature verification (HS256) & Google  │
│                         │ OAuth public key verification.               │
├─────────────────────────┼──────────────────────────────────────────────┤
│ T - Tampering           │ Signed httpOnly cookies (`lp_pw`) + SQL      │
│                         │ parameterization preventing SQL injection.   │
├─────────────────────────┼──────────────────────────────────────────────┤
│ R - Repudiation         │ Immutable click event telemetry logs with    │
│                         │ high-resolution UTC timestamps.              │
├─────────────────────────┼──────────────────────────────────────────────┤
│ I - Information Leak    │ Passwords never returned in API; raw IP      │
│                         │ addresses hashed using one-way salted HMAC.  │
├─────────────────────────┼──────────────────────────────────────────────┤
│ D - Denial of Service   │ Multi-tier IP rate limiters + In-memory LRU  │
│                         │ cache shielding DB from read floods.         │
├─────────────────────────┼──────────────────────────────────────────────┤
│ E - Elevation of Priv   │ Strict RBAC middleware (`requireAdmin`) on   │
│                         │ all administrative endpoints.                │
└─────────────────────────┴──────────────────────────────────────────────┘
```

### Detailed STRIDE Deconstructions:

#### 1. Spoofing Identity
* **Attack Vector:** An adversary attempts to generate a forged JWT token or fake a user session to access administrative dashboards.
* **Mitigation:** JWTs are signed using a server-side high-entropy secret (`JWT_SECRET`). Every incoming request passes through `requireAuth` middleware, which verifies signature integrity and token expiration (`exp`). Expired tokens are rejected with HTTP 401.

#### 2. Tampering with Data
* **Attack Vector 1:** Manipulating the password verification cookie (`lp_pw`) to bypass link password gates.
  * **Mitigation:** The `lp_pw` cookie contains a signed JWT payload carrying `{ linkId, unlockedAt }` signed with the server's cryptographic key. Modifying the cookie payload invalidates the signature, triggering an immediate redirect to the password form.
* **Attack Vector 2:** SQL Injection via custom aliases or query search filters.
  * **Mitigation:** 100% of database interactions utilize prepared statements with parameterized inputs (`?` translated to `$n`). No dynamic SQL string interpolation exists anywhere in the codebase.

#### 3. Information Disclosure
* **Attack Vector 1:** Leaking passwords in link detail API responses.
  * **Mitigation:** Passwords are never stored in plaintext. In the `links` table, passwords are stored as 10-round bcrypt hashes. The API serializer explicitly sanitizes the link object, returning a boolean `hasPassword: true/false` rather than the hash.
* **Attack Vector 2:** Exposing visitor IP addresses in analytics tables.
  * **Mitigation:** The application hashes IP addresses with a rotating internal salt via SHA-256 HMAC upon ingestion: `HMAC-SHA256(ip + ua, salt)`. The raw IP string is discarded immediately from memory and never written to PostgreSQL or SQLite.

#### 4. Denial of Service (DoS)
* **Attack Vector 1:** An attacker submits millions of requests to generate short links, exhausting disk space.
  * **Mitigation:** Endpoint rate limiting throttles link creation to 30 links per minute per authenticated user. Unauthenticated registration/login is throttled to 20 requests per 15 minutes per IP.
* **Attack Vector 2:** Flooding short URL redirects to exhaust database connections.
  * **Mitigation:** Redirection is decoupled from database reads via the in-memory LRU cache. Cache hits resolve without touching PostgreSQL. Telemetry is batched into a single write per second, preventing database transaction starvation.

#### 5. Elevation of Privilege
* **Attack Vector:** A regular tenant attempts to invoke `/api/admin/blocklist` or disable another user's links.
* **Mitigation:** All `/api/admin/*` endpoints strictly require `requireAuth` followed by `requireAdmin`. The middleware inspects `req.user.role === 'admin'`. Non-admin users receive an immediate HTTP 403 Forbidden.

---

## 3. OWASP Top 10 (2021 / 2026) Defense Matrix

| OWASP Vulnerability | Risk Level | LinkPulse Defense Implementation |
|:---|:---:|:---|
| **A01: Broken Access Control** | High | Multi-tenant row-level scoping (`WHERE owner_id = $1`); `requireAdmin` role gate; cross-tenant updates return HTTP 403. |
| **A02: Cryptographic Failures** | High | Standardized TLS 1.3 encryption in transit; `bcryptjs` for credentials; HMAC-SHA256 for token/cookie signatures. |
| **A03: Injection (SQL / XSS)** | Critical | Parameterized queries everywhere; Zod schema sanitization; React JSX automatic escaping; server-rendered bio pages escape user HTML strings. |
| **A04: Insecure Design** | High | 8-Step sequential redirect state machine preventing logic bypass; atomic CAS updates eliminating race conditions. |
| **A05: Security Misconfig** | Med | `Cache-Control: no-store` prevents stale proxy redirects; sensitive environment keys stored in git-ignored `.env`. |
| **A06: Vulnerable Components** | Med | Zero native C++ compilation dependencies (using `bcryptjs` and `node:sqlite`); strict lockfile scanning. |
| **A07: Identification & Auth** | High | JWT expiration enforced; rate-limited brute force protection; password complexity constraints. |
| **A08: Software & Data Integrity** | Med | Base62 collision retry loops; signed cookie payloads; automated smoke testing validating system invariants. |
| **A09: Security Logging** | Med | Unhandled exceptions captured with stack traces; abuse alerts monitor bot ratios, link spikes, and bulk creations. |
| **A10: Server-Side Request Forgery** | High | Validation wizard enforces `https`/`http` protocols and strictly blocks self-referencing links matching platform host. |

---

## 4. Privacy & Regulatory Compliance (GDPR & CCPA)

LinkPulse is engineered in strict accordance with the **EU General Data Protection Regulation (GDPR)** and **California Consumer Privacy Act (CCPA)**:
* **Article 5 (Data Minimization):** Only signals strictly necessary for aggregated marketing metrics (country, browser, device type, referrer) are recorded.
* **Article 25 (Data Protection by Design and by Default):** Visitor IP addresses are converted into irreversible cryptographic hashes before persistence.
* **Right to be Forgotten:** Deleting a user account executes a cascading deletion (`ON DELETE CASCADE`) across all associated workspaces, campaigns, tags, links, and click events.
