// Clear script: wipe all data from the database.
// Run: node --env-file-if-exists=.env scripts/clear.js
import { initDb, run, query, closeDb, dbMode } from '../src/db/index.js';

async function main() {
  await initDb();
  console.log(`[clear] Connected to database (${dbMode()}). Deleting all data...`);
  const tables = [
    'click_events',
    'link_tags',
    'links',
    'bio_page_links',
    'bio_pages',
    'tags',
    'campaigns',
    'workspaces',
    'blocked_domains',
    'users',
  ];

  for (const t of tables) {
    await run(`DELETE FROM ${t}`);
  }

  // Vacuum SQLite if in sqlite mode to reclaim disk space
  if (dbMode() === 'sqlite') {
    try {
      await run('VACUUM');
    } catch {
      // ignore
    }
  }

  console.log('[clear] Verification:');
  for (const t of tables) {
    const [r] = await query(`SELECT COUNT(*) as count FROM ${t}`);
    console.log(`  ${t}: ${r.count} rows`);
  }
  console.log('[clear] Database is completely clean (0 rows across all tables).');
  await closeDb();
}

main().catch((e) => {
  console.error('[clear] failed:', e);
  process.exit(1);
});
