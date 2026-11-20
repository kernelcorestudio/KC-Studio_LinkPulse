// Thin DB adapter: PostgreSQL when DATABASE_URL is set, SQLite otherwise.
// All app SQL is written once using `?` placeholders + ISO-TEXT timestamps and
// translated for Postgres here, so routes/services never branch on dialect.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { PG_SCHEMA, SQLITE_SCHEMA } from './schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mode; // 'pg' | 'sqlite'
let pool = null; // pg Pool
let sqlite = null; // node:sqlite DatabaseSync (built-in, no native deps)

async function ensureDb() {
  if (!initDbPromise) await initDb();
  else await initDbPromise;
}

function toPgSql(sql) {
  // Our SQL never contains literal '?' outside of placeholders.
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// node:sqlite is synchronous; wrap it so callers can always await.
export async function query(sql, params = []) {
  await ensureDb();
  if (mode === 'pg') {
    const res = await pool.query(toPgSql(sql), params);
    return res.rows;
  }
  return sqlite.prepare(sql).all(...params);
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function run(sql, params = []) {
  await ensureDb();
  if (mode === 'pg') {
    const res = await pool.query(toPgSql(sql), params);
    return { changes: res.rowCount };
  }
  const res = sqlite.prepare(sql).run(...params);
  return { changes: res.changes };
}

// Run many statements atomically (used by batch click inserts & tests).
export async function transaction(fn) {
  await ensureDb();
  if (mode === 'pg') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const wrap = {
        query: async (sql, params = []) => (await client.query(toPgSql(sql), params)).rows,
        run: async (sql, params = []) => {
          const r = await client.query(toPgSql(sql), params);
          return { changes: r.rowCount };
        },
      };
      const out = await fn(wrap);
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  // node:sqlite: BEGIN/COMMIT via exec; `fn` receives this module's own helpers.
  sqlite.exec('BEGIN');
  try {
    const out = await fn({ query, run });
    sqlite.exec('COMMIT');
    return out;
  } catch (e) {
    sqlite.exec('ROLLBACK');
    throw e;
  }
}

let initDbPromise = null;

export async function initDb() {
  if (initDbPromise) return initDbPromise;
  initDbPromise = (async () => {
    if (config.databaseUrl) {
      mode = 'pg';
      const { default: pg } = await import('pg');
      const isLocalhost = config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1');
      pool = new pg.Pool({
        connectionString: config.databaseUrl.replace(/[?&]sslmode=[^&]+/, ''),
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 5000,
      });
      pool.on('error', (err) => console.error('[db] pg pool error:', err.message));
      try {
        const client = await pool.connect();
        client.release();
        await applySchema(path.join(__dirname, 'schema.pg.sql'));
        console.log('[db] connected to PostgreSQL');
        return;
      } catch (err) {
        console.error(`[db] PostgreSQL connection failed (${err.message}).`);
        console.warn(`[db] Falling back to built-in SQLite database at ${config.sqliteFile}...`);
        if (pool) {
          try { await pool.end(); } catch {}
          pool = null;
        }
      }
    }

    mode = 'sqlite';
    const { DatabaseSync } = await import('node:sqlite');
    sqlite = new DatabaseSync(config.sqliteFile);
    sqlite.exec('PRAGMA journal_mode = WAL');
    sqlite.exec('PRAGMA foreign_keys = ON');
    await applySchema(path.join(__dirname, 'schema.sqlite.sql'));
    console.log(`[db] using built-in node:sqlite fallback at ${config.sqliteFile}`);
  })();
  return initDbPromise;
}

async function applySchema(file) {
  let raw = '';
  if (fs.existsSync(file)) {
    raw = fs.readFileSync(file, 'utf8');
  } else {
    const filename = path.basename(file);
    const alt1 = path.resolve(process.cwd(), 'server', 'src', 'db', filename);
    const alt2 = path.resolve(process.cwd(), 'src', 'db', filename);
    if (fs.existsSync(alt1)) raw = fs.readFileSync(alt1, 'utf8');
    else if (fs.existsSync(alt2)) raw = fs.readFileSync(alt2, 'utf8');
  }

  if (!raw) {
    raw = mode === 'pg' ? PG_SCHEMA : SQLITE_SCHEMA;
  }

  try {
    if (mode === 'pg') {
      await pool.query(raw);
    } else {
      sqlite.exec(raw);
    }
  } catch (err) {
    // If multi-statement fails for any reason, fall back to individual statements
    const statements = raw
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
      .filter(Boolean);
    for (const stmt of statements) {
      try {
        if (mode === 'pg') await pool.query(stmt);
        else sqlite.exec(stmt);
      } catch {
        // Ignore duplicate index/table errors
      }
    }
  }
  await addMissingColumns();
  await ensureDemoUsers();
}

const DEMO_ADA_ID = 'usr_demo_ada_lovelace';
const DEMO_ADMIN_ID = 'usr_demo_admin';

async function ensureDemoUsers() {
  try {
    let count = 0;
    if (mode === 'pg') {
      const r = await pool.query('SELECT COUNT(*) AS c FROM users');
      count = Number(r.rows[0]?.c || 0);
    } else {
      const r = sqlite.prepare('SELECT COUNT(*) AS c FROM users').get();
      count = Number(r?.c || 0);
    }
    if (count === 0) {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash('password123', 10);
      const adminHash = await bcrypt.hash('admin1234', 10);
      const nowIso = new Date().toISOString();
      const insertSql = 'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)';
      if (mode === 'pg') {
        await pool.query(toPgSql(insertSql), [DEMO_ADA_ID, 'Ada Lovelace', 'ada@example.com', hash, 'user', nowIso]);
        await pool.query(toPgSql(insertSql), [DEMO_ADMIN_ID, 'Admin User', 'admin@linkpulse.dev', adminHash, 'admin', nowIso]);
      } else {
        sqlite.prepare(insertSql).run(DEMO_ADA_ID, 'Ada Lovelace', 'ada@example.com', hash, 'user', nowIso);
        sqlite.prepare(insertSql).run(DEMO_ADMIN_ID, 'Admin User', 'admin@linkpulse.dev', adminHash, 'admin', nowIso);
      }
      console.log('[db] seeded default demo users (ada@example.com, admin@linkpulse.dev)');
    }

    if (process.env.NODE_ENV !== 'test') {
      await ensureDemoLinks();
    }
  } catch (err) {
    console.warn('[db] ensureDemoUsers warning:', err.message);
  }
}

async function ensureDemoLinks() {
  try {
    let linkCount = 0;
    if (mode === 'pg') {
      const lr = await pool.query('SELECT COUNT(*) AS c FROM links');
      linkCount = Number(lr.rows[0]?.c || 0);
    } else {
      const lr = sqlite.prepare('SELECT COUNT(*) AS c FROM links').get();
      linkCount = Number(lr?.c || 0);
    }
    if (linkCount > 0) return;

    let adaId = DEMO_ADA_ID;
    if (mode === 'pg') {
      const u = await pool.query("SELECT id FROM users WHERE email = 'ada@example.com' LIMIT 1");
      if (u.rows[0]?.id) adaId = u.rows[0].id;
    } else {
      const u = sqlite.prepare("SELECT id FROM users WHERE email = 'ada@example.com' LIMIT 1").get();
      if (u?.id) adaId = u.id;
    }

    const { nanoid } = await import('nanoid');
    const now = Date.now();
    const iso = (ms) => new Date(ms).toISOString();

    const demoLinks = [
      {
        id: 'lnk_demo_systemdesign13',
        code: 'systemdesign13',
        url: 'https://www.geeksforgeeks.org/system-design/what-is-low-level-design-or-lld-learn-system-design/',
        title: 'System Design Notes (GFG)',
      },
      {
        id: 'lnk_demo_d1000',
        code: 'd1000',
        url: 'https://github.com/kernelcorestudio/KC-Studio_LinkPulse',
        title: 'KC Studio LinkPulse Repository',
      },
      {
        id: 'lnk_demo_d1001',
        code: 'd1001',
        url: 'https://en.wikipedia.org/wiki/Systems_design',
        title: 'Systems Design Architecture',
      },
      {
        id: 'lnk_demo_d1002',
        code: 'd1002',
        url: 'https://youtube.com/watch?v=demo',
        title: 'Product Walkthrough Video',
      },
      {
        id: 'lnk_demo_d1003',
        code: 'd1003',
        url: 'https://www.geeksforgeeks.org',
        title: 'GeeksforGeeks Portal',
      },
    ];

    const linkSql = `INSERT INTO links (id, owner_id, short_code, destination_url, title, status, click_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`;

    const clickSql = `INSERT INTO click_events (id, link_id, clicked_at, ip_hash, visitor_id, referrer, device_type, os, browser, country, city, is_bot, is_unique, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const devices = [
      ['desktop', 'Windows', 'Chrome'],
      ['desktop', 'macOS', 'Safari'],
      ['mobile', 'Android', 'Chrome'],
      ['mobile', 'iOS', 'Safari'],
      ['desktop', 'Windows', 'Edge'],
      ['tablet', 'iPad', 'Safari'],
    ];
    const referrers = ['https://google.com', 'https://linkedin.com', 'https://github.com', 'https://twitter.com', null, null];
    const countries = ['IN', 'IN', 'IN', 'US', 'GB', 'DE', 'CA', 'AU'];
    const cities = {
      IN: ['New Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Nainital', 'Dehradun'],
      US: ['New York', 'San Francisco', 'Seattle'],
      GB: ['London', 'Manchester'],
      DE: ['Berlin', 'Munich'],
      CA: ['Toronto', 'Vancouver'],
      AU: ['Sydney', 'Melbourne'],
    };

    for (const dl of demoLinks) {
      const clickCount = 35 + Math.floor(Math.random() * 40);
      const createdAt = iso(now - 45 * 864e5);
      if (mode === 'pg') {
        await pool.query(toPgSql(linkSql), [dl.id, adaId, dl.code, dl.url, dl.title, clickCount, createdAt, createdAt]);
      } else {
        sqlite.prepare(linkSql).run(dl.id, adaId, dl.code, dl.url, dl.title, clickCount, createdAt, createdAt);
      }

      for (let i = 0; i < clickCount; i++) {
        const dayAgo = Math.floor(Math.random() * 35);
        const clickTs = iso(now - dayAgo * 864e5 - Math.floor(Math.random() * 864e5));
        const [device, os, browser] = devices[i % devices.length];
        const country = countries[i % countries.length];
        const cityList = cities[country] || ['Unknown'];
        const city = cityList[i % cityList.length];
        const ref = referrers[i % referrers.length];
        const isBot = 0;
        const isUnique = i % 2 === 0 ? 1 : 0;
        const source = i % 5 === 0 ? 'qr' : 'direct';
        const clickId = nanoid();
        const ipHash = 'hash-' + nanoid(6);
        const visitorId = 'vis-' + nanoid(8);

        if (mode === 'pg') {
          await pool.query(toPgSql(clickSql), [
            clickId, dl.id, clickTs, ipHash, visitorId, ref, device, os, browser, country, city, isBot, isUnique, source,
          ]);
        } else {
          sqlite.prepare(clickSql).run(
            clickId, dl.id, clickTs, ipHash, visitorId, ref, device, os, browser, country, city, isBot, isUnique, source,
          );
        }
      }
    }
    console.log('[db] seeded demo links and analytics telemetry successfully');
  } catch (err) {
    console.warn('[db] ensureDemoLinks warning:', err.message);
  }
}

// Additive migrations: CREATE TABLE IF NOT EXISTS never changes an existing
// table, so columns added in later phases are patched in here (idempotent,
// works on both engines - SQLite and Postgres both support ADD COLUMN).
const ADDITIONS = [
  ['bio_pages', 'theme', "TEXT NOT NULL DEFAULT 'dark'"],
  ['bio_pages', 'updated_at', 'TEXT'],
];

async function hasColumn(table, column) {
  if (mode === 'pg') {
    const r = await pool.query(
      'SELECT 1 AS x FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
      [table, column],
    );
    return r.rowCount > 0;
  }
  return sqlite.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
}

async function addMissingColumns() {
  for (const [table, column, defn] of ADDITIONS) {
    if (await hasColumn(table, column)) continue;
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${defn}`);
    console.log(`[db] migrated: ${table}.${column} added`);
  }
}

export function dbMode() {
  return mode;
}

export async function closeDb() {
  if (mode === 'pg' && pool) await pool.end();
  if (mode === 'sqlite' && sqlite) sqlite.close();
}
