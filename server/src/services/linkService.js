// Link creation + query business logic. Ownership is enforced by always
// filtering by owner_id in the caller-provided scope.
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../db/index.js';
import { generateUniqueCode } from '../utils/shortCode.js';
import {
  validateAlias,
  validateDestinationUrl,
  isDomainBlocked,
} from '../utils/validation.js';
import { linkCache } from './cacheService.js';
import { HttpError } from '../middleware/errors.js';

/**
 * Create a link after full validation. Throws HttpError(400) with a `details`
 * array describing every problem so the wizard can show warnings before publish.
 */
export async function createLink(ownerId, input) {
  const problems = [];

  const urlCheck = validateDestinationUrl(input.destinationUrl);
  if (!urlCheck.ok) problems.push({ field: 'destinationUrl', message: urlCheck.reason });

  let code;
  const aliasCheck = validateAlias(input.alias);
  if (!aliasCheck.ok) {
    problems.push({ field: 'alias', message: aliasCheck.reason });
  } else if (input.alias) {
    const clash = await queryOne('SELECT id FROM links WHERE short_code = ?', [input.alias]);
    if (clash) problems.push({ field: 'alias', message: 'That alias is already taken' });
    else code = input.alias;
  }

  if (urlCheck.ok && (await isDomainBlocked(urlCheck.url))) {
    problems.push({ field: 'destinationUrl', message: 'That domain is on the blocklist' });
  }

  if (problems.length) {
    throw new HttpError(400, 'Link did not pass validation', problems);
  }

  const destination = urlCheck.url;
  if (!code) code = await generateUniqueCode();

  const id = nanoid();
  const now = new Date().toISOString();
  const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : null;
  const deviceRules = input.deviceRules ? JSON.stringify(input.deviceRules) : null;

  try {
    await run(
      `INSERT INTO links
       (id, owner_id, campaign_id, folder_id, short_code, destination_url, title,
        status, password_hash, expires_at, max_clicks, click_count, device_rules,
        created_at, updated_at)
       VALUES (?,?,?,?,?,?,?, 'active', ?,?, ?, 0, ?, ?, ?)`,
      [
        id,
        ownerId,
        input.campaignId || null,
        input.folderId || null,
        code,
        destination,
        input.title || null,
        passwordHash,
        input.expiresAt || null,
        input.maxClicks || null,
        deviceRules,
        now,
        now,
      ],
    );
  } catch (err) {
    // Unique-constraint race on short_code (two users picked the same alias at once).
    if (isUniqueViolation(err) && input.alias) {
      throw new HttpError(409, 'That alias was just taken - please choose another');
    }
    if (isUniqueViolation(err)) {
      // auto code collision: retry once with a fresh code
      const fresh = await generateUniqueCode();
      await run(
        `INSERT INTO links
         (id, owner_id, campaign_id, folder_id, short_code, destination_url, title,
          status, password_hash, expires_at, max_clicks, click_count, device_rules,
          created_at, updated_at)
         VALUES (?,?,?,?,?,?,?, 'active', ?,?, ?, 0, ?, ?, ?)`,
        [id, ownerId, input.campaignId || null, input.folderId || null, fresh, destination,
         input.title || null, passwordHash, input.expiresAt || null, input.maxClicks || null, deviceRules, now, now],
      );
    } else {
      throw err;
    }
  }

  // Persist tags (create-or-reuse per owner) and link_tags join rows.
  await attachTags(id, ownerId, input.tags, now);

  linkCache.delete(code);
  return getLinkById(id, ownerId);
}

/** Create-or-reuse owner tags and attach them to a link. */
async function attachTags(linkId, ownerId, tagNames, now = new Date().toISOString()) {
  if (!tagNames?.length) return;
  for (const nameRaw of tagNames) {
    const name = String(nameRaw).trim();
    if (!name) continue;
    let tag = await queryOne('SELECT id FROM tags WHERE owner_id = ? AND name = ?', [ownerId, name]);
    if (!tag) {
      const tagId = nanoid();
      await run('INSERT INTO tags (id, owner_id, name, created_at) VALUES (?,?,?,?)', [tagId, ownerId, name, now]);
      tag = { id: tagId };
    }
    await run('INSERT INTO link_tags (link_id, tag_id) VALUES (?,?) ON CONFLICT DO NOTHING', [linkId, tag.id]);
  }
}

/**
 * PATCH a link (owner-only). Updates only the provided fields, re-validates
 * destination/campaign/folder, re-hashes or clears the password, replaces
 * tags when provided, and busts the redirect cache so rules apply instantly.
 */
export async function updateLink(id, ownerId, patch) {
  const link = await getLinkById(id, ownerId);
  const now = new Date().toISOString();
  const sets = [];
  const params = [];
  const add = (col, val) => { sets.push(`${col} = ?`); params.push(val); };

  if (patch.destinationUrl !== undefined) {
    const urlCheck = validateDestinationUrl(patch.destinationUrl);
    if (!urlCheck.ok) throw new HttpError(400, 'Link did not pass validation', [{ field: 'destinationUrl', message: urlCheck.reason }]);
    if (await isDomainBlocked(urlCheck.url)) {
      throw new HttpError(400, 'That destination domain is on the blocklist');
    }
    add('destination_url', urlCheck.url);
  }
  if (patch.title !== undefined) add('title', patch.title || null);
  if (patch.campaignId !== undefined) {
    if (patch.campaignId) {
      const c = await queryOne('SELECT id FROM campaigns WHERE id = ? AND owner_id = ?', [patch.campaignId, ownerId]);
      if (!c) throw new HttpError(400, 'Unknown campaign');
    }
    add('campaign_id', patch.campaignId || null);
  }
  if (patch.folderId !== undefined) {
    if (patch.folderId) {
      const f = await queryOne('SELECT id FROM workspaces WHERE id = ? AND owner_id = ?', [patch.folderId, ownerId]);
      if (!f) throw new HttpError(400, 'Unknown folder');
    }
    add('folder_id', patch.folderId || null);
  }
  if (patch.expiresAt !== undefined) {
    add('expires_at', patch.expiresAt || null);
    // Giving an expired link a fresh future expiry brings it back to life.
    if (link.status === 'expired' && patch.expiresAt && new Date(patch.expiresAt).getTime() > Date.now()) {
      add('status', 'active');
    }
  }
  if (patch.maxClicks !== undefined) {
    if (patch.maxClicks != null && patch.maxClicks < link.click_count) {
      throw new HttpError(400, `Limit is below the current click count (${link.click_count})`);
    }
    add('max_clicks', patch.maxClicks ?? null);
  }
  if (patch.password !== undefined) {
    // "" or null clears the password; anything else is a new password.
    add('password_hash', patch.password ? await bcrypt.hash(patch.password, 10) : null);
  }
  if (patch.deviceRules !== undefined) {
    add('device_rules', patch.deviceRules ? JSON.stringify(patch.deviceRules) : null);
  }
  if (patch.status !== undefined) {
    if (patch.status === 'active') {
      const expires = patch.expiresAt !== undefined ? patch.expiresAt : link.expires_at;
      if (expires && new Date(expires).getTime() <= Date.now()) {
        throw new HttpError(400, 'Cannot activate a link whose expiry date is in the past');
      }
    }
    add('status', patch.status);
  }

  // Tags are a join-table change, not a column - handle them even when no
  // column was touched (a tags-only PATCH must not early-return untouched).
  if (patch.tags !== undefined) {
    await run(
      'DELETE FROM link_tags WHERE link_id = ? AND tag_id IN (SELECT id FROM tags WHERE owner_id = ?)',
      [id, ownerId],
    );
    await attachTags(id, ownerId, patch.tags, now);
  }

  if (!sets.length) {
    // Nothing column-level to write, but tags may have changed -> refetch.
    return getLinkById(id, ownerId);
  }
  add('updated_at', now);
  await run(`UPDATE links SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);

  linkCache.delete(link.short_code);
  return getLinkById(id, ownerId);
}

export async function getLinkById(id, ownerId, { requireOwner = true } = {}) {
  const row = await queryOne(
    `SELECT l.*, c.name AS campaign_name, w.name AS folder_name
     FROM links l
     LEFT JOIN campaigns c ON c.id = l.campaign_id
     LEFT JOIN workspaces w ON w.id = l.folder_id
     WHERE l.id = ?`,
    [id],
  );
  if (!row) throw new HttpError(404, 'Link not found');
  if (requireOwner && row.owner_id !== ownerId) throw new HttpError(403, 'You do not own this link');
  const tags = await query(
    'SELECT t.name FROM tags t JOIN link_tags lt ON lt.tag_id = t.id WHERE lt.link_id = ?',
    [id],
  );
  row.tags = tags.map((t) => t.name);
  return row;
}

/** List links for owner with filters, search and pagination. */
export async function listLinks(
  ownerId,
  { limit = 20, offset = 0, search = '', status = '', campaignId = '', folderId = '', tagId = '' } = {},
) {
  const where = ['l.owner_id = ?'];
  const params = [ownerId];
  if (status) {
    where.push('l.status = ?');
    params.push(status);
  }
  if (campaignId) {
    where.push('l.campaign_id = ?');
    params.push(campaignId);
  }
  if (folderId) {
    where.push('l.folder_id = ?');
    params.push(folderId);
  }
  if (tagId) {
    where.push('EXISTS (SELECT 1 FROM link_tags lt WHERE lt.link_id = l.id AND lt.tag_id = ?)');
    params.push(tagId);
  }
  if (search) {
    where.push('(l.title LIKE ? OR l.short_code LIKE ? OR l.destination_url LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  const clause = where.join(' AND ');
  const rows = await query(
    `SELECT l.*, c.name AS campaign_name,
            (SELECT COUNT(*) FROM link_tags lt WHERE lt.link_id = l.id) AS tag_count
     FROM links l LEFT JOIN campaigns c ON c.id = l.campaign_id
     WHERE ${clause}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const total = await queryOne(`SELECT COUNT(*) AS n FROM links l WHERE ${clause}`, params);
  return { links: rows, total: total?.n || 0, limit, offset };
}

export async function isCodeTaken(code) {
  return !!(await queryOne('SELECT id FROM links WHERE short_code = ?', [code]));
}

// Invalidate redirect cache for a code (called on update/disable).
export function invalidateCode(code) {
  linkCache.delete(code);
}

export async function deleteLink(id, ownerId, role = 'user') {
  const link = await queryOne('SELECT * FROM links WHERE id = ?', [id]);
  if (!link) throw new HttpError(404, 'Link not found');
  if (role !== 'admin' && link.owner_id !== ownerId) {
    throw new HttpError(403, 'You do not own this link');
  }
  try { await run('DELETE FROM link_tags WHERE link_id = ?', [id]); } catch {}
  try { await run('DELETE FROM click_events WHERE link_id = ?', [id]); } catch {}
  try { await run('DELETE FROM bio_page_links WHERE link_id = ?', [id]); } catch {}
  await run('DELETE FROM links WHERE id = ?', [id]);
  linkCache.delete(link.short_code);
  return { ok: true };
}

function isUniqueViolation(err) {
  const msg = String(err?.message || err?.code || '');
  return /UNIQUE constraint failed|duplicate key value|unique/i.test(msg);
}
