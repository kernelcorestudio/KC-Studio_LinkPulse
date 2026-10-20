# Database Architecture & Entity Relationship (ER) — LinkPulse

Dokumentation LinkPulse platform ke relational database architecture, entity-relationship model, tables specification, indexes, foreign key cascade policies aur dual-dialect design ko detail me present karta hai.

---

## 1. Complete Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ WORKSPACES : "owns (folders)"
    USERS ||--o{ CAMPAIGNS : "creates"
    USERS ||--o{ TAGS : "defines"
    USERS ||--o{ LINKS : "owns"
    USERS ||--o{ BIO_PAGES : "creates"
    USERS ||--o{ BLOCKED_DOMAINS : "moderates/adds"
    USERS ||--o{ LINKS : "disables (admin)"

    WORKSPACES ||--o{ LINKS : "categorizes (SET NULL)"
    CAMPAIGNS ||--o{ LINKS : "aggregates (SET NULL)"

    LINKS ||--o{ LINK_TAGS : "tagged with"
    TAGS ||--o{ LINK_TAGS : "applied to"

    LINKS ||--o{ CLICK_EVENTS : "logs clicks (CASCADE)"
    LINKS ||--o{ BIO_PAGE_LINKS : "included in (CASCADE)"
    BIO_PAGES ||--o{ BIO_PAGE_LINKS : "contains (CASCADE)"

    USERS {
        string id PK
        string name
        string email UK
        string password_hash
        string role "user | admin"
        string created_at "ISO-8601 UTC"
    }

    WORKSPACES {
        string id PK
        string owner_id FK
        string name
        string created_at "ISO-8601 UTC"
    }

    CAMPAIGNS {
        string id PK
        string owner_id FK
        string name
        string description
        string start_date
        string end_date
        string created_at "ISO-8601 UTC"
    }

    TAGS {
        string id PK
        string owner_id FK
        string name
        string created_at "ISO-8601 UTC"
    }

    LINKS {
        string id PK
        string owner_id FK
        string campaign_id FK "nullable"
        string folder_id FK "nullable"
        string short_code UK "nanoid / custom"
        string destination_url
        string title
        string status "active | disabled | expired"
        string password_hash "nullable"
        string expires_at "nullable"
        integer max_clicks "nullable"
        integer click_count "default 0"
        string device_rules "JSON rules"
        string disabled_reason "nullable"
        string disabled_by FK "nullable"
        string created_at "ISO-8601 UTC"
        string updated_at "ISO-8601 UTC"
    }

    LINK_TAGS {
        string link_id PK,FK
        string tag_id PK,FK
    }

    CLICK_EVENTS {
        string id PK
        string link_id FK
        string clicked_at "ISO-8601 UTC"
        string ip_hash "SHA-256 anonymized"
        string visitor_id "Cookie UUID"
        string referrer "nullable"
        string device_type "desktop | mobile | tablet"
        string os "iOS | Android | Windows | macOS | Linux"
        string browser "Chrome | Safari | Firefox | Edge"
        string country "ISO Alpha-2"
        string city "GeoIP lookup"
        integer is_bot "0 | 1"
        integer is_unique "0 | 1"
        string source "direct | qr"
    }

    BLOCKED_DOMAINS {
        string id PK
        string domain UK "e.g. phishing.com"
        string reason
        string added_by FK "nullable"
        string created_at "ISO-8601 UTC"
    }

    BIO_PAGES {
        string id PK
        string owner_id FK
        string slug UK "e.g. my-profile"
        string title
        string bio
        string theme "dark | retro | neon | minimal"
        string created_at "ISO-8601 UTC"
        string updated_at "ISO-8601 UTC"
    }

    BIO_PAGE_LINKS {
        string id PK
        string bio_page_id FK
        string link_id FK
        integer position "display order 0..N"
        string label "custom button text"
    }
```

---

## 2. Table Specifications & Cardinalities

### 2.1 Core Identity & Organization

#### `users`
Har account ka central profile record.
- **Constraints**: `email` is `UNIQUE NOT NULL`. `role` default `user` (or `admin`).
- **Cascade**: User deletion cascade se sabhi links, campaigns, workspaces, tags aur bio-pages delete karta hai.

#### `workspaces` (Folders)
Links ko hierarchical folders me group karne ke liye.
- **Relationship**: `users (1) -> workspaces (N)` (`ON DELETE CASCADE`).
- **Link Association**: Jab folder delete hota hai, `links.folder_id` automatically `SET NULL` ho jata hai (links safe rehte hain).

#### `campaigns`
Marketing campaigns with timeline metadata (`start_date`, `end_date`).
- **Relationship**: `users (1) -> campaigns (N)` (`ON DELETE CASCADE`).
- **Link Association**: `links.campaign_id` `ON DELETE SET NULL`.

#### `tags` & `link_tags`
M:N tagging system for high-dimensional filtering.
- **Constraint**: `UNIQUE(owner_id, name)` — har user ka tag name unique hota hai.
- **Junction**: `link_tags (link_id, tag_id)` composite primary key with cascade deletion on both ends.

---

### 2.2 Core Link & Traffic Tracking

#### `links`
System ka central entity jisme routing rules aur state store hoti hai.
- **`short_code`**: Unique indexed identifier (Base62 nanoid ya custom alias).
- **`status`**: State machine (`active` -> `disabled` -> `expired`).
- **`device_rules`**: JSON string (e.g. `{"ios": "https://apps.apple.com/...", "android": "https://play.google.com/..."}`).
- **`click_count`**: Denormalized atomic counter for ultra-fast limit checking without scanning millions of events.
- **Retention Rule**: Expired aur disabled links **kabhi bhi delete nahi kiye jaate**, ensuring historical analytics integrity!

#### `click_events`
High-volume append-only audit trail har single click ka.
- **`ip_hash`**: Privacy-compliant SHA-256 salted hash of visitor IP.
- **`visitor_id`**: 1-year first-party cookie (`lp_vid`) identifier.
- **`is_unique`**: In-transaction evaluated flag (whether this visitor_id or ip_hash has previously hit this link).
- **`is_bot`**: Filtered search engine crawler / monitoring bot flag.
- **`source`**: Traffic origin (`direct` click vs `qr` code scan).

---

### 2.3 Extension Features: Moderation & Bio-Pages

#### `blocked_domains`
Phishing, malware aur abusive destination domains ki global blocklist.
- Admin portal dwara managed.
- Subdomain matching capability (`badsite.com` blocks `phish.badsite.com`).

#### `bio_pages` & `bio_page_links`
Personalized "Link in Bio" mini-websites.
- `slug`: Public URL route (`/bio/:slug`).
- `position`: Integer for drag-and-drop sort order.
- Inactive links are dynamically filtered during public page rendering.

---

## 3. Database Indexes & Performance Optimization

```mermaid
graph LR
    subgraph LinkIndexes["Links Table Indexes"]
        Idx_Link_Owner["idx_links_owner (owner_id)"]
        Idx_Link_Camp["idx_links_campaign (campaign_id)"]
        Idx_Link_Code["sqlite_autoindex_links_1 (short_code UNIQUE)"]
    end

    subgraph ClickIndexes["Click Events Table Indexes"]
        Idx_Click_Time["idx_clicks_link_time (link_id, clicked_at)"]
        Idx_Click_Vis["idx_clicks_visitor (link_id, visitor_id)"]
        Idx_Click_Ip["idx_clicks_iphash (link_id, ip_hash)"]
    end

    subgraph BioIndexes["Bio Pages Indexes"]
        Idx_Bio_Owner["idx_bio_pages_owner (owner_id)"]
        Idx_Bio_Slug["sqlite_autoindex_bio_pages_1 (slug UNIQUE)"]
    end
```

| Index Name | Table | Columns | Purpose & Query Target |
|:---|:---|:---|:---|
| `idx_links_owner` | `links` | `(owner_id)` | Fast dashboard link list queries filter by user |
| `idx_links_campaign` | `links` | `(campaign_id)` | Fast campaign aggregation queries |
| `idx_clicks_link_time` | `click_events` | `(link_id, clicked_at)` | Time-series charting (24h / 7d / 30d analytics) |
| `idx_clicks_visitor` | `click_events` | `(link_id, visitor_id)` | Sub-millisecond unique visitor verification during batch ingest |
| `idx_clicks_iphash` | `click_events` | `(link_id, ip_hash)` | Cookie-less unique visitor verification fallback |
| `idx_bio_pages_owner` | `bio_pages` | `(owner_id)` | User bio page dashboard listing |

---

## 4. Dual-Dialect Compatibility Matrix

Dono SQL schemas ([schema.sqlite.sql](file:///c:/Users/ankus/Downloads/haldwani/server/src/db/schema.sqlite.sql) aur [schema.pg.sql](file:///c:/Users/ankus/Downloads/haldwani/server/src/db/schema.pg.sql)) 100% interoperable hain:

| Feature | SQLite Fallback | PostgreSQL Production | Adapter Normalization |
|:---|:---|:---|:---|
| Engine | Built-in Node 24 `node:sqlite` | `pg` connection pool | Unified `query()`, `queryOne()`, `run()`, `transaction()` |
| Param Placeholders | `?` | `$1, $2, $3...` | Automatic regex transformation `?` -> `$n` in adapter |
| Timestamps | `TEXT` (ISO-8601 UTC) | `TIMESTAMPTZ` / `TEXT` | Standardized ISO-8601 string formatting across app |
| Booleans | `INTEGER` (0 / 1) | `INTEGER` (0 / 1) or `BOOLEAN` | Normalized numeric boolean flags |
| Atomic Batch Update | `CASE WHEN ... THEN ... ELSE ... END` | `CASE WHEN ... THEN ... ELSE ... END` | Standard SQL without dialect-specific `MIN`/`LEAST` quirks |
