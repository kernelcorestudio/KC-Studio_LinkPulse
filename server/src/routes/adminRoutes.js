// /api/admin - platform stats, abuse alerts, link/user management, blocklist.
// Everything here requires the admin role (JWT claim + DB check in middleware).
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { blockDomainSchema, disableLinkSchema } from '../utils/validation.js';
import * as admin from '../services/adminService.js';

export const adminRoutes = Router();
adminRoutes.use(requireAuth, requireAdmin);

// ---- Overview ----
adminRoutes.get('/stats', asyncHandler(async (_req, res) => {
  res.json(await admin.getPlatformStats());
}));
adminRoutes.get('/alerts', asyncHandler(async (_req, res) => {
  res.json({ alerts: await admin.getAbuseAlerts() });
}));

// ---- Links ----
adminRoutes.get('/links', asyncHandler(async (req, res) => {
  res.json(await admin.listAllLinks({
    search: String(req.query.search || ''),
    status: String(req.query.status || ''),
    limit: Math.min(Number(req.query.limit) || 25, 100),
    offset: Number(req.query.offset) || 0,
  }));
}));
adminRoutes.post('/links/:id/disable', asyncHandler(async (req, res) => {
  const { reason } = disableLinkSchema.parse(req.body);
  res.json({ link: await admin.adminDisableLink(req.params.id, req.user.id, reason) });
}));
adminRoutes.post('/links/:id/enable', asyncHandler(async (req, res) => {
  res.json({ link: await admin.adminEnableLink(req.params.id) });
}));

// ---- Users ----
adminRoutes.get('/users', asyncHandler(async (req, res) => {
  res.json(await admin.listUsers({
    search: String(req.query.search || ''),
    limit: Math.min(Number(req.query.limit) || 50, 200),
    offset: Number(req.query.offset) || 0,
  }));
}));

// ---- Blocklist ----
adminRoutes.get('/blocklist', asyncHandler(async (_req, res) => {
  res.json({ domains: await admin.listBlocklist() });
}));
adminRoutes.post('/blocklist', asyncHandler(async (req, res) => {
  res.status(201).json({ domain: await admin.addBlockedDomain(req.user.id, blockDomainSchema.parse(req.body)) });
}));
adminRoutes.delete('/blocklist/:id', asyncHandler(async (req, res) => {
  res.json(await admin.removeBlockedDomain(req.params.id));
}));
