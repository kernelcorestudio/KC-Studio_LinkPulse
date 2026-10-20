// Bio pages: /api/bio (owner CRUD, auth required) and the public
// server-rendered page GET /bio/:slug (no auth - it's a public landing page).
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { bioPageSchema, bioPageUpdateSchema, bioLinksSchema } from '../utils/validation.js';
import { pageBio } from '../utils/pages.js';
import * as bio from '../services/bioService.js';

export const bioRoutes = Router();
bioRoutes.use(requireAuth);

bioRoutes.get('/', asyncHandler(async (req, res) => {
  res.json({ pages: await bio.listBioPages(req.user.id) });
}));

bioRoutes.post('/', asyncHandler(async (req, res) => {
  const input = bioPageSchema.parse(req.body);
  res.status(201).json({ page: await bio.createBioPage(req.user.id, input) });
}));

bioRoutes.get('/:id', asyncHandler(async (req, res) => {
  res.json({ page: await bio.getBioPage(req.params.id, req.user.id) });
}));

bioRoutes.patch('/:id', asyncHandler(async (req, res) => {
  const patch = bioPageUpdateSchema.parse(req.body);
  res.json({ page: await bio.updateBioPage(req.params.id, req.user.id, patch) });
}));

// PUT (not PATCH): the ordered list is replaced wholesale - simplest correct
// semantics for drag/reorder UIs, and idempotent for retries.
bioRoutes.put('/:id/links', asyncHandler(async (req, res) => {
  const { links } = bioLinksSchema.parse(req.body);
  res.json({ page: await bio.setBioPageLinks(req.params.id, req.user.id, links) });
}));

bioRoutes.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await bio.deleteBioPage(req.params.id, req.user.id));
}));

// ---- Public page (mounted before the redirect engine in app.js) ----
export const publicBioRouter = Router();

publicBioRouter.get('/bio/:slug', asyncHandler(async (req, res) => {
  const page = await bio.getPublicPage(req.params.slug);
  if (!page) {
    // Same branded 404 as an unknown short code, no page existence leak beyond
    // the slug itself.
    res.status(404).set('cache-control', 'no-store').type('html').send(pageBio({ title: 'Page not found', bio: 'This bio page does not exist or was removed.', buttons: [], slug: 'Not found' }));
    return;
  }
  res.set('cache-control', 'no-store').type('html').send(pageBio(page));
}));
