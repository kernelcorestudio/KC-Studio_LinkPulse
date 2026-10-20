# LinkPulse — Roadmap

Where the platform goes after the shipped phases. Ordered roughly by impact-to-effort.

## In-progress build plan
| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Auth, create link + validation wizard, redirect engine (rules 1–3 + 8), async click tracking, link + dashboard analytics, seed, tests, deploy configs | ✅ Done |
| **2** | Full redirect rules (expiry, atomic click-limit page, password unlock, device targeting), complete create-wizard options, campaigns CRUD + analytics, tags/folders, dashboard campaign filter | ✅ Done |
| **3** | QR codes (PNG/SVG, `?src=qr`), CSV bulk import + error report, admin panel (all links/users, disable-with-reason, blocklist CRUD), platform analytics + abuse alerts, click-limit/bot + no-store cache polish | ✅ Done |
| **4** | Link-in-bio pages (`/bio/:slug`, themes, ordered buttons, `?src=bio`), device-targeting UI in wizard + settings, dashboard alerts polish, expanded tests, seed realism | ✅ Done |

## Post-v1 feature roadmap

### Custom domains
- Let users attach their own short-link domain (e.g. `go.acme.com`).
- DNS verification (TXT record), automatic cert issuance (Caddy / Let's Encrypt or
  Cloudflare for SaaS), per-domain routing in the redirect engine.
- Branded error/410/password pages per domain.

### Device targeting improvements
- Richer rules: OS version, app deep links / universal links, geo + language, UTM-aware.
- Priority/ordered rule list with a visual rule builder and fallback chain.
- Per-variant analytics (measure each device/app destination independently).

### Public API + API keys
- Scoped, revocable API keys (`lp_…`) with rate limits per key.
- REST + JSON: create/list/update links, pull analytics, generate QR — mirroring the
  internal endpoints but key-authed instead of JWT.
- Public developer portal, OpenAPI spec, SDK snippets, webhook signature docs.

### Webhooks
- Event hooks: `click.created`, `link.created`, `link.disabled`, `link.limit_reached`,
  `link.expired`.
- Signed payloads (HMAC), retries with exponential backoff + dead-letter view,
  per-endpoint delivery logs and replay.
- Bulk/batch delivery for high-traffic links.

### A/B destinations
- Split traffic across multiple destinations by configurable weights.
- Sticky bucketing per visitor, confidence + conversion metrics per variant,
  automatic winner selection, and per-variant analytics.

### Team workspaces
- Multi-member workspaces with roles (owner / admin / editor / viewer) and per-resource
  ownership.
- Shared campaigns, tags, folders and approval flows; audit log of every change.
- SSO (Google/OAuth), SCIM provisioning, seat-based billing hooks.

## Cross-cutting hardening (ongoing)
- Click queue → optional durable buffer (Redis/Postgres queue) for multi-instance scale.
- Background worker separation (API vs redirect vs analytics aggregation).
- Pre-aggregated analytics materialized views for very high click volumes.
- Abuse detection: automated spike + bot-rate alerting, domain reputation checks.
- Observability: structured logs, metrics (redirect p95, queue depth), tracing.
- Anti-fraud: link moderation queue, malware/phishing feed integration on the blocklist.
