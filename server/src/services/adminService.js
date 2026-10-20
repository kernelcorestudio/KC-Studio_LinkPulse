// Admin panel logic: platform stats, abuse alerts, all-links/user management,
// disable-with-reason (instant via redirect-cache invalidation), blocklist CRUD.
import { nanoid } from 'nanoid';
import { query, queryOne, run } from '../db/index.js';
import { HttpError } from '../middleware/errors.js';
import { linkCache } from './cacheService.js';

/** Normalize user input ("https://Spam.com/x?a=1") to a bare hostname. */
export function normalizeDomain(input) {
  let s = String(input || '').trim().toLowerCase();
  if (!s) return null;
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  try {
    const host = new URL(s).hostname;
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

// ---------- Links & users ----------

export async function listAllLinks({ search = '', status = '', limit = 25, offset = 0 }) {
  const where = [];
  const params = [];
  if (status) { where.push('l.status = ?'); params.push(status); }
  if (search) {
    where.push('(l.title LIKE ? OR l.short_code LIKE ? OR l.destination_url LIKE ? OR u.email LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT l.id, l.short_code, l.destination_url, l.title, l.status, l.click_count,
            l.expires_at, l.max_clicks, l.disabled_reason, l.created_at,
            u.id AS owner_user_id, u.email AS owner_email, u.role AS owner_role
     FROM links l JOIN users u ON u.id = l.owner_id
     ${clause}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const total = await queryOne(
    `SELECT COUNT(*) AS n FROM links l JOIN users u ON u.id = l.owner_id ${clause}`, params,
  );
  return { links: rows, total: Number(total?.n || 0), limit, offset };
}

export async function listUsers({ search = '', limit = 50, offset = 0 }) {
  const clause = search
    ? 'WHERE u.name LIKE ? OR u.email LIKE ?'
    : '';
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM links l WHERE l.owner_id = u.id) AS link_count,
            (SELECT COALESCE(SUM(l.click_count), 0) FROM links l WHERE l.owner_id = u.id) AS total_clicks
     FROM users u ${clause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return { users: rows };
}

/** Disable a link as admin: kept forever, redirects stop instantly. */
export async function adminDisableLink(id, adminId, reason) {
  const link = await queryOne('SELECT id, short_code, status FROM links WHERE id = ?', [id]);
  if (!link) throw new HttpError(404, 'Link not found');
  const now = new Date().toISOString();
  await run(
    `UPDATE links SET status = 'disabled', disabled_reason = ?, disabled_by = ?, updated_at = ?
     WHERE id = ?`,
    [reason, adminId, now, id],
  );
  linkCache.delete(link.short_code); // redirect engine stops serving from cache too
  return queryOne('SELECT id, short_code, status, disabled_reason FROM links WHERE id = ?', [id]);
}

export async function adminEnableLink(id) {
  const link = await queryOne('SELECT id, short_code FROM links WHERE id = ?', [id]);
  if (!link) throw new HttpError(404, 'Link not found');
  await run(
    `UPDATE links SET status = 'active', disabled_reason = NULL, disabled_by = NULL, updated_at = ?
     WHERE id = ?`,
    [new Date().toISOString(), id],
  );
  linkCache.delete(link.short_code);
  return queryOne('SELECT id, short_code, status FROM links WHERE id = ?', [id]);
}

// ---------- Blocklist ----------

export async function listBlocklist() {
  return query(
    `SELECT b.*, u.email AS added_by_email FROM blocked_domains b
     LEFT JOIN users u ON u.id = b.added_by ORDER BY b.created_at DESC`,
  );
}

export async function addBlockedDomain(adminId, input) {
  const host = normalizeDomain(input.domain);
  if (!host) throw new HttpError(400, 'Not a valid domain');
  const existing = await queryOne('SELECT id FROM blocked_domains WHERE domain = ?', [host]);
  if (existing) throw new HttpError(409, 'Domain is already blocked');
  const id = nanoid();
  await run(
    'INSERT INTO blocked_domains (id, domain, reason, added_by, created_at) VALUES (?,?,?,?,?)',
    [id, host, input.reason || null, adminId, new Date().toISOString()],
  );
  return queryOne('SELECT * FROM blocked_domains WHERE id = ?', [id]);
}

export async function removeBlockedDomain(id) {
  const row = await queryOne('SELECT domain FROM blocked_domains WHERE id = ?', [id]);
  if (!row) throw new HttpError(404, 'Entry not found');
  await run('DELETE FROM blocked_domains WHERE id = ?', [id]);
  return { ok: true, removed: row.domain };
}

// ---------- Platform stats + abuse alerts ----------

export async function getPlatformStats() {
  const totals = await queryOne(`
    SELECT (SELECT COUNT(*) FROM users) AS users,
           (SELECT COUNT(*) FROM links) AS links,
           (SELECT COUNT(*) FROM links WHERE status = 'active') AS active_links,
           (SELECT COUNT(*) FROM links WHERE status = 'disabled') AS disabled_links,
           (SELECT COUNT(*) FROM links WHERE status = 'expired') AS expired_links,
           (SELECT COUNT(*) FROM click_events WHERE is_bot = 0) AS clicks,
           (SELECT COUNT(*) FROM click_events WHERE is_bot = 1) AS bot_clicks,
           (SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_hash)) FROM click_events WHERE is_bot = 0) AS unique_visitors
  `);
  const from14 = new Date(Date.now() - 14 * 864e5).toISOString();
  const timeseries = await query(
    `SELECT substr(clicked_at, 1, 10) AS bucket, COUNT(*) AS clicks
     FROM click_events WHERE is_bot = 0 AND clicked_at >= ?
     GROUP BY bucket ORDER BY bucket ASC`,
    [from14],
  );
  const topLinks = await query(
    `SELECT l.id, l.short_code, l.title, l.destination_url, l.click_count, u.email AS owner_email
     FROM links l JOIN users u ON u.id = l.owner_id
     ORDER BY l.click_count DESC LIMIT 10`,
  );
  // Top destination domains (platform-wide abuse visibility).
  const hosts = await query('SELECT destination_url FROM links');
  const byHost = new Map();
  for (const { destination_url } of hosts) {
    try {
      const h = new URL(destination_url).hostname;
      byHost.set(h, (byHost.get(h) || 0) + 1);
    } catch { /* ignore unparseable */ }
  }
  const topDomains = [...byHost.entries()]
    .map(([label, links]) => ({ label, links }))
    .sort((a, b) => b.links - a.links)
    .slice(0, 10);
  const botRatio = Number(totals.clicks) + Number(totals.bot_clicks) > 0
    ? Number(totals.bot_clicks) / (Number(totals.clicks) + Number(totals.bot_clicks))
    : 0;
  return { ...totals, botRatio: Math.round(botRatio * 1000) / 10, timeseries, topLinks, topDomains };
}

/**
 * Abuse alerts, platform-wide:
 *  - bot-heavy links (>50% bot clicks, meaningful volume)
 *  - click spikes (>=10 clicks in last 24h and >=3x previous 24h)
 *  - brand-new accounts creating many links fast (>10 links in first 24h)
 */
export async function getAbuseAlerts() {
  const alerts = [];
  const botHeavy = await query(`
    SELECT l.id, l.short_code, l.destination_url, u.email AS owner_email,
           COUNT(*) AS total,
           SUM(CASE WHEN c.is_bot = 1 THEN 1 ELSE 0 END) AS bots
    FROM click_events c JOIN links l ON l.id = c.link_id JOIN users u ON u.id = l.owner_id
    GROUP BY l.id HAVING COUNT(*) >= 20 AND SUM(CASE WHEN c.is_bot = 1 THEN 1 ELSE 0 END) * 2 > COUNT(*)
    ORDER BY bots DESC LIMIT 10
  `);
  botHeavy.forEach((l) => alerts.push({ type: 'bot_heavy', link: l }));

  const now = new Date();
  const from24 = new Date(now.getTime() - 864e5).toISOString();
  const from48 = new Date(now.getTime() - 2 * 864e5).toISOString();
  const spikes = await query(
    `SELECT l.id, l.short_code, l.destination_url,
            (SELECT COUNT(*) FROM click_events c WHERE c.link_id = l.id AND c.is_bot = 0 AND c.clicked_at >= ?) AS recent,
            (SELECT COUNT(*) FROM click_events c WHERE c.link_id = l.id AND c.is_bot = 0 AND c.clicked_at >= ? AND c.clicked_at < ?) AS prev
     FROM links l`,
    [from24, from48, from24],
  );
  spikes.forEach((s) => {
    if (Number(s.recent) >= 10 && Number(s.recent) >= Math.max(1, Number(s.prev)) * 3) {
      alerts.push({ type: 'spike', link: s });
    }
  });

  const newBulk = await query(
    `SELECT u.id, u.email, u.created_at, COUNT(l.id) AS links
     FROM users u JOIN links l ON l.owner_id = u.id
     WHERE u.created_at >= ? GROUP BY u.id HAVING COUNT(l.id) > 10 ORDER BY links DESC`,
    [from24],
  );
  newBulk.forEach((u) => alerts.push({ type: 'new_user_bulk', user: u }));

  return alerts;
}
