// Campaigns, tags and folders - owner-scoped CRUD + per-campaign stats.
import { nanoid } from 'nanoid';
import { query, queryOne, run } from '../db/index.js';
import { HttpError } from '../middleware/errors.js';

function newId() {
  return nanoid();
}

// ---------- Campaigns ----------

export async function listCampaigns(ownerId) {
  return query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM links l WHERE l.campaign_id = c.id) AS link_count,
            (SELECT COUNT(*) FROM click_events ce
               JOIN links l ON l.id = ce.link_id
              WHERE l.campaign_id = c.id AND ce.is_bot = 0) AS clicks,
            (SELECT COUNT(DISTINCT COALESCE(ce.visitor_id, ce.ip_hash)) FROM click_events ce
               JOIN links l ON l.id = ce.link_id
              WHERE l.campaign_id = c.id AND ce.is_bot = 0 AND ce.is_unique = 1) AS uniques
     FROM campaigns c
     WHERE c.owner_id = ?
     ORDER BY c.created_at DESC`,
    [ownerId],
  );
}

async function assertCampaignOwned(id, ownerId) {
  const row = await queryOne('SELECT id FROM campaigns WHERE id = ? AND owner_id = ?', [id, ownerId]);
  if (!row) throw new HttpError(404, 'Campaign not found');
  return row;
}

export async function createCampaign(ownerId, input) {
  const existing = await queryOne('SELECT id FROM campaigns WHERE owner_id = ? AND name = ?', [ownerId, input.name]);
  if (existing) throw new HttpError(409, 'You already have a campaign with that name');
  const id = newId();
  const now = new Date().toISOString();
  await run(
    'INSERT INTO campaigns (id, owner_id, name, description, start_date, end_date, created_at) VALUES (?,?,?,?,?,?,?)',
    [id, ownerId, input.name, input.description || null, input.startDate || null, input.endDate || null, now],
  );
  return queryOne('SELECT * FROM campaigns WHERE id = ?', [id]);
}

export async function updateCampaign(id, ownerId, input) {
  await assertCampaignOwned(id, ownerId);
  await run(
    `UPDATE campaigns SET name = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?`,
    [input.name, input.description || null, input.startDate || null, input.endDate || null, id],
  );
  return queryOne('SELECT * FROM campaigns WHERE id = ?', [id]);
}

export async function deleteCampaign(id, ownerId) {
  await assertCampaignOwned(id, ownerId);
  // Links are kept (ON DELETE SET NULL) - campaign removal never deletes links.
  await run('DELETE FROM campaigns WHERE id = ?', [id]);
  return { ok: true };
}

// ---------- Folders (workspaces) ----------

export async function listFolders(ownerId) {
  return query(
    `SELECT w.*,
            (SELECT COUNT(*) FROM links l WHERE l.folder_id = w.id) AS link_count
     FROM workspaces w WHERE w.owner_id = ? ORDER BY w.name`,
    [ownerId],
  );
}

async function assertFolderOwned(id, ownerId) {
  const row = await queryOne('SELECT id FROM workspaces WHERE id = ? AND owner_id = ?', [id, ownerId]);
  if (!row) throw new HttpError(404, 'Folder not found');
  return row;
}

export async function createFolder(ownerId, input) {
  const existing = await queryOne('SELECT id FROM workspaces WHERE owner_id = ? AND name = ?', [ownerId, input.name]);
  if (existing) throw new HttpError(409, 'You already have a folder with that name');
  const id = newId();
  await run('INSERT INTO workspaces (id, owner_id, name, created_at) VALUES (?,?,?,?)', [id, ownerId, input.name, new Date().toISOString()]);
  return queryOne('SELECT * FROM workspaces WHERE id = ?', [id]);
}

export async function renameFolder(id, ownerId, input) {
  await assertFolderOwned(id, ownerId);
  await run('UPDATE workspaces SET name = ? WHERE id = ?', [input.name, id]);
  return queryOne('SELECT * FROM workspaces WHERE id = ?', [id]);
}

export async function deleteFolder(id, ownerId) {
  await assertFolderOwned(id, ownerId);
  // Links stay; they just become un-filed (FK ON DELETE SET NULL).
  await run('DELETE FROM workspaces WHERE id = ?', [id]);
  return { ok: true };
}

// ---------- Tags ----------

export async function listTags(ownerId) {
  return query(
    `SELECT t.*,
            (SELECT COUNT(*) FROM link_tags lt WHERE lt.tag_id = t.id) AS link_count
     FROM tags t WHERE t.owner_id = ? ORDER BY t.name`,
    [ownerId],
  );
}

async function assertTagOwned(id, ownerId) {
  const row = await queryOne('SELECT id FROM tags WHERE id = ? AND owner_id = ?', [id, ownerId]);
  if (!row) throw new HttpError(404, 'Tag not found');
  return row;
}

export async function renameTag(id, ownerId, input) {
  await assertTagOwned(id, ownerId);
  try {
    await run('UPDATE tags SET name = ? WHERE id = ?', [input.name, id]);
  } catch (err) {
    if (/UNIQUE|unique|duplicate/i.test(String(err.message))) throw new HttpError(409, 'You already have a tag with that name');
    throw err;
  }
  return queryOne('SELECT * FROM tags WHERE id = ?', [id]);
}

export async function deleteTag(id, ownerId) {
  await assertTagOwned(id, ownerId);
  await run('DELETE FROM tags WHERE id = ?', [id]); // link_tags cascade
  return { ok: true };
}
