// /api/analytics - dashboard summary, per-link analytics, alerts.
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { getAnalytics, getDashboardSummary, getAlerts } from '../services/analyticsService.js';

export const analyticsRoutes = Router();
analyticsRoutes.use(requireAuth);

// Resolve a period preset (today/7d/30d) or explicit custom from/to, respecting client timezone offset.
function resolvePeriod(query) {
  const preset = String(query.period || '30d');
  const offset = Number(query.tzOffset) || 0; // minutes offset from UTC (e.g. -330 for IST)
  const now = new Date();

  if (query.from || query.to) {
    const f = query.from ? new Date(query.from) : new Date(0);
    const t = query.to ? new Date(query.to) : now;
    const diffDays = Math.max(1, Math.round((t - f) / 864e5));
    return {
      from: f.toISOString(),
      to: t.toISOString(),
      bucket: preset === 'today' || diffDays <= 2 ? 'hour' : 'day',
      tzOffset: offset,
    };
  }

  // Calculate user local time
  const localNowMs = now.getTime() - offset * 60000;
  const localNow = new Date(localNowMs);

  if (preset === 'today') {
    // Start of today in user's local timezone (local midnight)
    const localMidnightMs = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 0, 0, 0);
    const fromUtc = new Date(localMidnightMs + offset * 60000);
    return {
      from: fromUtc.toISOString(),
      to: now.toISOString(),
      bucket: 'hour',
      tzOffset: offset,
    };
  }

  const map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = map[preset] ?? 30;
  // Start of the N-day window in user's local timezone
  const localStartMs = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate() - (days - 1), 0, 0, 0);
  const fromUtc = new Date(localStartMs + offset * 60000);
  return {
    from: fromUtc.toISOString(),
    to: now.toISOString(),
    bucket: days <= 2 ? 'hour' : 'day',
    tzOffset: offset,
  };
}

// GET /api/analytics/dashboard
analyticsRoutes.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const p = resolvePeriod(req.query);
    const summary = await getDashboardSummary(req.user.id, {
      from: p.from,
      to: p.to,
      campaignId: req.query.campaignId,
      bucket: p.bucket,
      tzOffset: p.tzOffset,
    });
    res.json(summary);
  }),
);

// GET /api/analytics/link/:id
analyticsRoutes.get(
  '/link/:id',
  asyncHandler(async (req, res) => {
    const p = resolvePeriod(req.query);
    const data = await getAnalytics(req.user.id, {
      from: p.from,
      to: p.to,
      linkId: req.params.id,
      bucket: p.bucket,
      tzOffset: p.tzOffset,
    });
    res.json({ period: p, ...data });
  }),
);

// GET /api/analytics/campaign/:id
analyticsRoutes.get(
  '/campaign/:id',
  asyncHandler(async (req, res) => {
    const p = resolvePeriod(req.query);
    const data = await getAnalytics(req.user.id, {
      from: p.from,
      to: p.to,
      campaignId: req.params.id,
      bucket: p.bucket,
      tzOffset: p.tzOffset,
    });
    res.json({ period: p, ...data });
  }),
);

// GET /api/analytics/alerts
analyticsRoutes.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    res.json({ alerts: await getAlerts(req.user.id) });
  }),
);
