// Script: Migrate all data from local SQLite (linkpulse.db) to PostgreSQL (Supabase).
// Run with: node --env-file-if-exists=.env scripts/migrate-sqlite-to-pg.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  const rootEnv = path.resolve(__dirname, '../../.env');
  const serverEnv = path.resolve(__dirname, '../.env');
  if (fs.existsSync(rootEnv)) try { process.loadEnvFile(rootEnv); } catch {}
  else if (fs.existsSync(serverEnv)) try { process.loadEnvFile(serverEnv); } catch {}
}

const sqlitePath = path.resolve(__dirname, '../linkpulse.db');
const pgUrl = process.env.DATABASE_URL;

if (!fs.existsSync(sqlitePath)) {
  console.error(`[migrate] SQLite database file not found at: ${sqlitePath}`);
  process.exit(1);
}
if (!pgUrl) {
  console.error('[migrate] DATABASE_URL is not set in environment or root .env');
  process.exit(1);
}

console.log('----------------------------------------------------');
console.log('LinkPulse: SQLite -> Supabase PostgreSQL Migration');
console.log('----------------------------------------------------');
console.log(`Source: ${sqlitePath}`);
console.log(`Destination: ${pgUrl.replace(/:[^:]*@/, ':****@')}`);

// 1. Connect SQLite
const sqlite = new DatabaseSync(sqlitePath);

// 2. Connect Postgres
const isLocalhost = pgUrl.includes('localhost') || pgUrl.includes('127.0.0.1');
const pool = new pg.Pool({
  connectionString: pgUrl.replace(/[?&]sslmode=[^&]+/, ''),
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

// Helper to convert '?' placeholders to '$1, $2...'
function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function runPg(client, sql, params = []) {
  return client.query(toPgSql(sql), params);
}

async function applyPgSchema(client) {
  const schemaPath = path.resolve(__dirname, '../src/db/schema.pg.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const statements = raw
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await client.query(stmt);
  }
}

// Ordered table list respecting Foreign Key dependencies
const TABLES = [
  'users',
  'workspaces',
  'campaigns',
  'tags',
  'links',
  'link_tags',
  'click_events',
  'blocked_domains',
  'bio_pages',
  'bio_page_links',
];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('\n[1/4] Ensuring PostgreSQL schema exists in Supabase...');
    await applyPgSchema(client);
    console.log('Schema verified & initialized in Supabase.');

    console.log('\n[2/4] Clearing existing destination tables for clean migration...');
    // Clear in reverse order
    for (const t of [...TABLES].reverse()) {
      await client.query(`DELETE FROM ${t};`);
    }
    console.log('Destination tables prepared.');

    console.log('\n[3/4] Transferring data from SQLite to Supabase...');
    let totalRowsMigrated = 0;

    for (const table of TABLES) {
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      if (!rows.length) {
        console.log(`  - ${table}: 0 rows (skipped)`);
        continue;
      }

      const cols = Object.keys(rows[0]);
      const placeholders = `(${cols.map(() => '?').join(',')})`;
      const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES ${placeholders}`;

      // Insert in chunks of 200 rows
      const CHUNK = 200;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const batch = rows.slice(i, i + CHUNK);
        const multiPlaceholders = batch.map((_, idx) => {
          const offset = idx * cols.length;
          return `(${cols.map((_, cIdx) => `$${offset + cIdx + 1}`).join(',')})`;
        }).join(',');

        const multiSql = `INSERT INTO ${table} (${cols.join(',')}) VALUES ${multiPlaceholders};`;
        const params = batch.map((r) => cols.map((c) => r[c])).flat();
        await client.query(multiSql, params);
      }

      console.log(`  ✓ ${table}: ${rows.length} rows migrated`);
      totalRowsMigrated += rows.length;
    }

    console.log('\n[4/4] Verification check on Supabase...');
    for (const table of TABLES) {
      const res = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  - Supabase ${table}: ${res.rows[0].count} rows`);
    }

    console.log('----------------------------------------------------');
    console.log(`MIGRATION COMPLETE! Total ${totalRowsMigrated} rows successfully transferred to Supabase.`);
    console.log('----------------------------------------------------');
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

migrate().catch((err) => {
  console.error('\nMigration failed:', err);
  process.exit(1);
});
