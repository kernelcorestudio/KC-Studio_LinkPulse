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
      });
      pool.on('error', (err) => console.error('[db] pg pool error:', err.message));
      await applySchema(path.join(__dirname, 'schema.pg.sql'));
      console.log('[db] connected to PostgreSQL');
    } else {
      mode = 'sqlite';
      const { DatabaseSync } = await import('node:sqlite');
      sqlite = new DatabaseSync(config.sqliteFile);
      sqlite.exec('PRAGMA journal_mode = WAL');
      sqlite.exec('PRAGMA foreign_keys = ON');
      await applySchema(path.join(__dirname, 'schema.sqlite.sql'));
      console.log(`[db] using built-in node:sqlite fallback at ${config.sqliteFile}`);
    }
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
