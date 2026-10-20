// /api/campaigns, /api/tags, /api/folders - owner-scoped organization CRUD.
import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { campaignSchema, folderSchema, tagRenameSchema } from '../utils/validation.js';
import * as org from '../services/orgService.js';

export const campaignRoutes = Router();
export const tagRoutes = Router();
export const folderRoutes = Router();
campaignRoutes.use(requireAuth);
tagRoutes.use(requireAuth);
folderRoutes.use(requireAuth);

// ---- Campaigns ----
campaignRoutes.get('/', asyncHandler(async (req, res) => {
  res.json({ campaigns: await org.listCampaigns(req.user.id) });
}));
campaignRoutes.post('/', asyncHandler(async (req, res) => {
  const campaign = await org.createCampaign(req.user.id, campaignSchema.parse(req.body));
  res.status(201).json({ campaign });
}));
campaignRoutes.patch('/:id', asyncHandler(async (req, res) => {
  const campaign = await org.updateCampaign(req.params.id, req.user.id, campaignSchema.parse(req.body));
  res.json({ campaign });
}));
campaignRoutes.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await org.deleteCampaign(req.params.id, req.user.id));
}));

// ---- Tags (created implicitly by the wizard too) ----
tagRoutes.get('/', asyncHandler(async (req, res) => {
  res.json({ tags: await org.listTags(req.user.id) });
}));
tagRoutes.patch('/:id', asyncHandler(async (req, res) => {
  res.json({ tag: await org.renameTag(req.params.id, req.user.id, tagRenameSchema.parse(req.body)) });
}));
tagRoutes.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await org.deleteTag(req.params.id, req.user.id));
}));

// ---- Folders ----
folderRoutes.get('/', asyncHandler(async (req, res) => {
  res.json({ folders: await org.listFolders(req.user.id) });
}));
folderRoutes.post('/', asyncHandler(async (req, res) => {
  res.status(201).json({ folder: await org.createFolder(req.user.id, folderSchema.parse(req.body)) });
}));
folderRoutes.patch('/:id', asyncHandler(async (req, res) => {
  res.json({ folder: await org.renameFolder(req.params.id, req.user.id, folderSchema.parse(req.body)) });
}));
folderRoutes.delete('/:id', asyncHandler(async (req, res) => {
  res.json(await org.deleteFolder(req.params.id, req.user.id));
}));
