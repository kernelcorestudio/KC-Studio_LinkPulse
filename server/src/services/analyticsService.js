// Analytics: every number here is computed live from click_events.
// Bot clicks are excluded from all "counts" (is_bot = 0 filter) per spec.
import { query, queryOne } from '../db/index.js';
import { HttpError } from '../middleware/errors.js';

function inPeriod(col, from, to, params) {
  let s = `${col} >= ?`;
  params.push(from);
  if (to) {
    s += ` AND ${col} <= ?`;
    params.push(to);
  }
  return s;
}

/**
 * Resolve the set of link ids in scope for a user.
 * linkId -> just that link; campaignId -> that campaign's links; else all user's links.
 */
async function scopeLinkIds(ownerId, { linkId, campaignId, adminScope = false }) {
  if (linkId) {
    const l = await queryOne('SELECT id, owner_id FROM links WHERE id = ?', [linkId]);
    if (!l) throw new HttpError(404, 'Link not found');
    if (!adminScope && l.owner_id !== ownerId) throw new HttpError(403, 'Not your link');
    return [linkId];
  }
  if (campaignId) {
    const rows = await query('SELECT id FROM links WHERE owner_id = ? AND campaign_id = ?', [ownerId, campaignId]);
    return rows.map((r) => r.id);
  }
  const rows = await query('SELECT id FROM links WHERE owner_id = ?', [ownerId]);
  return rows.map((r) => r.id);
}

async function breakdown(ownerId, ids, from, to, column) {
  if (!ids.length) return [];
  const params = [];
  const inList = ids.map(() => '?').join(',');
  const period = inPeriod('clicked_at', from, to, params);
  const rows = await query(
    `SELECT COALESCE(${column},'Unknown') AS label,
            COUNT(*) AS clicks,
            COUNT(DISTINCT COALESCE(visitor_id, ip_hash)) AS uniques
     FROM click_events
     WHERE link_id IN (${inList}) AND is_bot = 0 AND ${period}
     GROUP BY label ORDER BY clicks DESC LIMIT 12`,
    [...ids, ...params],
  );
  return rows;
}

async function clicksOverTime(ownerId, ids, from, to, bucket) {
  if (!ids.length) return [];
  const params = [];
  const period = inPeriod('clicked_at', from, to, params);
  // clicked_at is ISO-8601 TEXT: substr gives 'YYYY-MM-DD' (day) or 'YYYY-MM-DDTHH' (hour).
  const len = bucket === 'hour' ? 13 : 10;
  const rows = await query(
    `SELECT substr(clicked_at, 1, ${len}) AS bucket, COUNT(*) AS clicks
     FROM click_events
     WHERE link_id IN (${ids.map(() => '?').join(',')}) AND is_bot = 0 AND ${period}
     GROUP BY bucket ORDER BY bucket ASC`,
    [...ids, ...params],
  );
  return rows;
}

/** Full analytics payload for a scope (single link, campaign, or all links). */
export async function getAnalytics(ownerId, { from, to, linkId, campaignId, bucket = 'day', adminScope = false }) {
  const ids = await scopeLinkIds(ownerId, { linkId, campaignId, adminScope });
  const empty = {
    totalClicks: 0, uniqueVisitors: 0, totalLinks: ids.length,
    timeseries: [], referrers: [], devices: [], os: [], browsers: [], countries: [], cities: [], sources: [],
  };
  if (!ids.length) return empty;
  const inList = ids.map(() => '?').join(',');
  const cparams = [];
  const period = inPeriod('clicked_at', from, to, cparams);

  const totals = await queryOne(
    `SELECT COUNT(*) AS totalClicks,
            COUNT(DISTINCT CASE WHEN is_unique = 1 THEN COALESCE(visitor_id, ip_hash) END) AS uniqueVisitors
     FROM click_events
     WHERE link_id IN (${inList}) AND is_bot = 0 AND ${period}`,
    [...ids, ...cparams],
  );

  const [timeseries, referrers, devices, os, browsers, countries, cities, sources] = await Promise.all([
    clicksOverTime(ownerId, ids, from, to, bucket),
    breakdown(ownerId, ids, from, to, 'referrer'),
    breakdown(ownerId, ids, from, to, 'device_type'),
    breakdown(ownerId, ids, from, to, 'os'),
    breakdown(ownerId, ids, from, to, 'browser'),
    breakdown(ownerId, ids, from, to, 'country'),
    breakdown(ownerId, ids, from, to, 'city'),
    breakdown(ownerId, ids, from, to, 'source'),
  ]);

  return {
    totalClicks: Number(totals?.totalClicks || 0),
    uniqueVisitors: Number(totals?.uniqueVisitors || 0),
    totalLinks: ids.length,
    timeseries: timeseries.map((r) => ({ bucket: r.bucket, clicks: Number(r.clicks) })),
    referrers, devices, os, browsers, countries, cities, sources,
  };
}

/** Dashboard summary: period metrics + top links for the owner. */
export async function getDashboardSummary(ownerId, { from, to, campaignId }) {
  const ids = await scopeLinkIds(ownerId, { campaignId });
  const stats = await getAnalytics(ownerId, { from, to, campaignId });

  const campClause = campaignId ? ' AND campaign_id = ?' : '';
  const campParams = campaignId ? [ownerId, campaignId] : [ownerId];
  const activeLinks = await queryOne(
    `SELECT COUNT(*) AS n FROM links WHERE owner_id = ? AND status = 'active'${campClause}`, campParams,
  );
  const totalLinks = await queryOne(
    `SELECT COUNT(*) AS n FROM links WHERE owner_id = ?${campClause}`, campParams,
  );

  let topLinks = [];
  if (ids.length) {
    const params = [];
    const period = inPeriod('clicked_at', from, to, params);
    topLinks = await query(
      `SELECT l.id, l.short_code, l.title, l.destination_url, l.status,
              COUNT(c.id) AS clicks
       FROM links l JOIN click_events c ON c.link_id = l.id
       WHERE l.id IN (${ids.map(() => '?').join(',')}) AND c.is_bot = 0 AND ${period}
       GROUP BY l.id ORDER BY clicks DESC LIMIT 8`,
      [...ids, ...params],
    );
  }

  return {
    totalClicks: stats.totalClicks,
    uniqueVisitors: stats.uniqueVisitors,
    activeLinks: Number(activeLinks?.n || 0),
    totalLinks: Number(totalLinks?.n || 0),
    timeseries: stats.timeseries,
    countries: stats.countries.slice(0, 6),
    devices: stats.devices,
    topLinks: topLinks.map((l) => ({ ...l, clicks: Number(l.clicks) })),
  };
}

/**
 * Link alerts for the dashboard: expiring soon, near/at click limit, expired,
 * disabled, spikes. Each alert carries a human-readable `message` and a
 * `severity` (info | warn | critical) so the UI can rank them without
 * re-deriving the numbers. A spike = last-24h clicks >= 3x previous-24h and >= 10.
 */
export async function getAlerts(ownerId) {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 864e5).toISOString();
  const from24 = new Date(now.getTime() - 864e5).toISOString();
  const from48 = new Date(now.getTime() - 2 * 864e5).toISOString();
  const alerts = [];

  const expiring = await query(
    `SELECT id, short_code, title, expires_at FROM links
     WHERE owner_id = ? AND status = 'active' AND expires_at IS NOT NULL
       AND expires_at > ? AND expires_at <= ? ORDER BY expires_at`,
    [ownerId, now.toISOString(), soon],
  );
  for (const l of expiring) {
    const hours = Math.max(1, Math.round((new Date(l.expires_at).getTime() - now.getTime()) / 36e5));
    const when = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
    alerts.push({
      type: 'expiring_soon',
      severity: hours <= 24 ? 'critical' : 'warn',
      message: `Stops redirecting in ${when}`,
      link: l,
    });
  }

  const nearLimit = await query(
    `SELECT id, short_code, title, max_clicks, click_count FROM links
     WHERE owner_id = ? AND max_clicks IS NOT NULL AND click_count >= max_clicks * 0.8`,
    [ownerId],
  );
  for (const l of nearLimit) {
    const left = Math.max(0, Number(l.max_clicks) - Number(l.click_count));
    alerts.push({
      type: 'near_click_limit',
      severity: left <= 0 ? 'critical' : 'warn',
      message: left <= 0 ? 'Limit reached - redirects stopped' : `${left} of ${l.max_clicks} clicks left`,
      link: l,
    });
  }

  const down = await query(
    `SELECT id, short_code, title, disabled_reason FROM links WHERE owner_id = ? AND status = 'disabled'`,
    [ownerId],
  );
  down.forEach((l) => alerts.push({
    type: 'disabled',
    severity: 'critical',
    message: l.disabled_reason ? `Disabled: ${l.disabled_reason}` : 'Disabled by an admin',
    link: l,
  }));

  const expired = await query(
    `SELECT id, short_code, title, expires_at FROM links WHERE owner_id = ? AND status = 'expired'`,
    [ownerId],
  );
  expired.forEach((l) => alerts.push({
    type: 'expired',
    severity: 'info',
    message: l.expires_at ? `Expired ${new Date(l.expires_at).toLocaleDateString('en-CA')}` : 'Expired',
    link: l,
  }));

  // Spike detection across the owner's links.
  const spikes = await query(
    `SELECT l.id, l.short_code, l.title,
            (SELECT COUNT(*) FROM click_events c WHERE c.link_id = l.id AND c.is_bot = 0 AND c.clicked_at >= ?) AS recent,
            (SELECT COUNT(*) FROM click_events c WHERE c.link_id = l.id AND c.is_bot = 0 AND c.clicked_at >= ? AND c.clicked_at < ?) AS prev
     FROM links l WHERE l.owner_id = ?`,
    [from24, from48, from24, ownerId],
  );
  spikes.forEach((s) => {
    const recent = Number(s.recent);
    const prev = Math.max(1, Number(s.prev));
    if (recent >= 10 && recent >= prev * 3) {
      alerts.push({
        type: 'spike',
        severity: 'info',
        message: `${recent} clicks in 24h (${Math.round(recent / prev)}× previous)`,
        link: s,
      });
    }
  });

  const rank = { critical: 0, warn: 1, info: 2 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return alerts;
}
