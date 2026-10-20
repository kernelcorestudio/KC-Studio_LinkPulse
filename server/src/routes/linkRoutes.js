// /api/links - CRUD + alias availability, scoped to the authenticated owner.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { createLinkSchema, updateLinkSchema, importRowsSchema, validateAlias, validateDestinationUrl } from '../utils/validation.js';
import { createLink, updateLink, getLinkById, listLinks, isCodeTaken } from '../services/linkService.js';
import { validateImportRows, runImport } from '../services/importService.js';
import { generateUniqueCode } from '../utils/shortCode.js';

export const linkRoutes = Router();
linkRoutes.use(requireAuth);

// Basic rate limits per spec: creation limited per user AND per IP.
const createLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip, // per user when authed
  message: { error: 'Too many links created - please slow down' },
});

// GET /api/links/available?code=xyz  -> live availability check for the wizard
linkRoutes.get(
  '/available',
  asyncHandler(async (req, res) => {
    const code = String(req.query.code || '').trim();
    const shape = validateAlias(code || null);
    if (!shape.ok) return res.json({ available: false, reason: shape.reason });
    if (!code) {
      // no alias chosen -> we will auto-generate; preview one
      const preview = await generateUniqueCode();
      return res.json({ available: true, autoCode: preview });
    }
    const taken = await isCodeTaken(code);
    res.json({ available: !taken, reason: taken ? 'That alias is already taken' : undefined });
  }),
);

// POST /api/links/validate  -> dry-run the wizard's warnings without publishing
linkRoutes.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const problems = [];
    const u = validateDestinationUrl(req.body.destinationUrl);
    if (!u.ok) problems.push({ field: 'destinationUrl', message: u.reason });
    const a = validateAlias(req.body.alias || null);
    if (!a.ok) problems.push({ field: 'alias', message: a.reason });
    if (req.body.alias && a.ok && (await isCodeTaken(req.body.alias))) {
      problems.push({ field: 'alias', message: 'That alias is already taken' });
    }
    res.json({ valid: problems.length === 0, warnings: problems });
  }),
);

// POST /api/links  -> create
linkRoutes.post(
  '/',
  createLimiter,
  asyncHandler(async (req, res) => {
    const input = createLinkSchema.parse(req.body);
    const link = await createLink(req.user.id, input);
    res.status(201).json({ link });
  }),
);

// GET /api/links  -> list with filters/search/pagination
linkRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const result = await listLinks(req.user.id, {
      limit,
      offset,
      search: String(req.query.search || ''),
      status: String(req.query.status || ''),
      campaignId: String(req.query.campaignId || ''),
      folderId: String(req.query.folderId || ''),
      tagId: String(req.query.tagId || ''),
    });
    res.json(result);
  }),
);

// POST /api/links/import/preview  -> validate every CSV row, write nothing.
// POST /api/links/import          -> import valid rows only, full report back.
const importLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many import runs today - please try later' },
});

linkRoutes.post(
  '/import/preview',
  importLimiter,
  asyncHandler(async (req, res) => {
    const { rows } = importRowsSchema.parse(req.body);
    const results = await validateImportRows(req.user.id, rows);
    res.json({
      results,
      summary: {
        total: results.length,
        valid: results.filter((r) => r.valid).length,
        invalid: results.filter((r) => !r.valid).length,
      },
    });
  }),
);

linkRoutes.post(
  '/import',
  importLimiter,
  asyncHandler(async (req, res) => {
    const { rows } = importRowsSchema.parse(req.body);
    res.json(await runImport(req.user.id, rows));
  }),
);

// GET /api/links/:id  -> detail
linkRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const link = await getLinkById(req.params.id, req.user.id);
    res.json({ link });
  }),
);

// PATCH /api/links/:id  -> settings (expiry, limit, password, campaign, folder,
// tags, device rules, status re-activation). Owner-only, busts redirect cache.
linkRoutes.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const patch = updateLinkSchema.parse(req.body);
    const link = await updateLink(req.params.id, req.user.id, patch);
    res.json({ link });
  }),
);
