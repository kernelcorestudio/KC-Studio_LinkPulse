// /api/analytics - dashboard summary, per-link analytics, alerts.
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { getAnalytics, getDashboardSummary, getAlerts } from '../services/analyticsService.js';

export const analyticsRoutes = Router();
analyticsRoutes.use(requireAuth);

// Resolve a period preset (today/7d/30d) or explicit custom from/to.
function resolvePeriod(query) {
  const preset = String(query.period || '30d');
  const now = new Date();
  if (query.from || query.to) {
    return {
      from: query.from || new Date(0).toISOString(),
      to: query.to || now.toISOString(),
      bucket: preset === 'today' ? 'hour' : 'day',
    };
  }
  const map = { today: 0, '7d': 7, '30d': 30, '90d': 90 };
  if (preset === 'today') {
    const d = new Date(now); d.setUTCHours(0, 0, 0, 0);
    return { from: d.toISOString(), to: now.toISOString(), bucket: 'hour' };
  }
  const days = map[preset] ?? 30;
  const from = new Date(now.getTime() - days * 864e5);
  from.setUTCHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: now.toISOString(), bucket: days <= 2 ? 'hour' : 'day' };
}

// GET /api/analytics/dashboard
analyticsRoutes.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const p = resolvePeriod(req.query);
    const summary = await getDashboardSummary(req.user.id, { from: p.from, to: p.to, campaignId: req.query.campaignId });
    res.json(summary);
  }),
);

// GET /api/analytics/link/:id
analyticsRoutes.get(
  '/link/:id',
  asyncHandler(async (req, res) => {
    const p = resolvePeriod(req.query);
    const data = await getAnalytics(req.user.id, { from: p.from, to: p.to, linkId: req.params.id, bucket: p.bucket });
    res.json({ period: p, ...data });
  }),
);

// GET /api/analytics/campaign/:id
analyticsRoutes.get(
  '/campaign/:id',
  asyncHandler(async (req, res) => {
    const p = resolvePeriod(req.query);
    const data = await getAnalytics(req.user.id, { from: p.from, to: p.to, campaignId: req.params.id, bucket: p.bucket });
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
