// Async click-event queue: the redirect handler only pushes to memory; this
// worker batches DB writes (uniqueness check + insert + atomic counter bump)
// so the redirect response stays fast and clicks survive crashes as well as
// possible (flush every second + flush on shutdown + retry on DB failure).
import { query, run, transaction } from '../db/index.js';

const FLUSH_INTERVAL_MS = 1000;
const BATCH_SIZE = 200;
const MAX_RETRIES = 3;

let queue = [];
let timer = null;
let flushing = false;
let dropped = 0;

export function enqueueClick(event) {
  queue.push({ event, attempts: 0 });
  if (queue.length >= BATCH_SIZE) void flush(); // back-pressure: flush early
}

export function pendingCount() {
  return queue.length;
}

async function isExistingVisitor(ev) {
  // Unique = we have never seen this visitor cookie / ip-hash on this link.
  // (Kept for tests; the flush path inlines the same query in-tx.)
  if (ev.is_bot) return false;
  const row = await query(
    `SELECT 1 AS x FROM click_events
     WHERE link_id = ? AND (visitor_id = ? OR ip_hash = ?)
     LIMIT 1`,
    [ev.link_id, ev.visitor_key, ev.ip_hash],
  );
  return row.length > 0;
}
export { isExistingVisitor };

const COLS = ['id', 'link_id', 'clicked_at', 'ip_hash', 'visitor_id', 'referrer', 'device_type', 'os', 'browser', 'country', 'city', 'is_bot', 'is_unique', 'source'];

async function flushOnce(items) {
  // Enrich + persist one batch inside a transaction.
  await transaction(async (tx) => {
    const rows = [];
    const bumps = []; // non-bot clicks per link (atomic counter updates)
    for (const ev of items) {
      if (!ev.is_bot) {
        const known = await (tx.query || query)(
          `SELECT 1 AS x FROM click_events WHERE link_id = ? AND (visitor_id = ? OR ip_hash = ?) LIMIT 1`,
          [ev.link_id, ev.visitor_key, ev.ip_hash],
        );
        ev.is_unique = known.length ? 0 : 1;
      }
      rows.push(COLS.map((c) => ev[c]));
      if (!ev.is_bot) bumps.push(ev.link_id);
    }
    const valuesSql = rows.map(() => `(${COLS.map(() => '?').join(',')})`).join(',');
    await (tx.run || run)(
      `INSERT INTO click_events (${COLS.join(',')}) VALUES ${valuesSql}`,
      rows.flat(),
    );
    // Counter bump is a single atomic statement per link -> no read-modify-write race.
    // Guarded so a limited link can never exceed max_clicks (Phase 2 rule); the
    // CASE clamps a whole batch to the remaining capacity (plain SQL, works on
    // SQLite and Postgres - no MIN/LEAST dialect divergence).
    const perLink = new Map();
    for (const id of bumps) perLink.set(id, (perLink.get(id) || 0) + 1);
    for (const [linkId, n] of perLink) {
      await (tx.run || run)(
        `UPDATE links SET click_count = CASE
            WHEN max_clicks IS NULL OR click_count + ? <= max_clicks THEN click_count + ?
            ELSE max_clicks END
         WHERE id = ? AND (max_clicks IS NULL OR click_count < max_clicks)`,
        [n, n, linkId],
      );
    }
  });
}

export async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    while (queue.length) {
      const batch = queue.splice(0, BATCH_SIZE);
      try {
        await flushOnce(batch.map((b) => b.event));
      } catch (err) {
        console.error('[clickQueue] flush failed:', err.message);
        for (const b of batch) {
          b.attempts++;
          if (b.attempts < MAX_RETRIES) queue.push(b);
          else dropped++;
        }
        if (!batch.every((b) => b.attempts < MAX_RETRIES)) break; // back off, retry next tick
      }
    }
  } finally {
    flushing = false;
  }
}

export function startClickQueue() {
  if (timer) return;
  timer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
  timer.unref?.();
}

export function stopClickQueue() {
  if (timer) clearInterval(timer);
  timer = null;
}

// Call on SIGTERM/SIGINT so queued clicks are not lost on graceful shutdown.
export async function shutdownClickQueue() {
  stopClickQueue();
  await flush();
  if (dropped) console.warn(`[clickQueue] ${dropped} click events were dropped after retries`);
  return { dropped };
}

// Synchronous single-click persistence for serverless runtimes (e.g. Vercel)
// where background intervals do not run after response ends.
export async function recordClickSync(event) {
  await flushOnce([event]);
}
