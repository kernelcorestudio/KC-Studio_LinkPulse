// Link-in-bio pages (Phase 4): one public page per owner collecting their
// best links. Buttons point at the normal short codes (with ?src=bio), so
// every click still goes through the redirect engine and is tracked.
import { nanoid } from 'nanoid';
import { query, queryOne, run } from '../db/index.js';
import { HttpError } from '../middleware/errors.js';
import { validateBioSlug } from '../utils/validation.js';

const MAX_PAGES_PER_OWNER = 10;
const MAX_LINKS_PER_PAGE = 30;

// Retro host badges per destination host.
const HOST_ICONS = [
  [/twitter\.|x\.com$/, '[X]'], [/facebook\.|instagram\./, '[MEDIA]'], [/youtube\.|youtu\.be$/, '[VIDEO]'],
  [/github\.$/, '[CODE]'], [/wikipedia\.$/, '[WIKI]'], [/linkedin\.$/, '[NETWORK]'], [/reddit\.$/, '[FORUM]'],
  [/medium\.|substack\./, '[BLOG]'], [/notion\./, '[DOCS]'], [/figma\./, '[DESIGN]'], [/spotify\./, '[AUDIO]'],
  [/vercel\.|netlify\./, '[DEPLOY]'], [/docs\.google|drive\.google/, '[CLOUD]'], [/amazon\./, '[SHOP]'],
];

function iconFor(url) {
  let host = '';
  try { host = new URL(url).hostname; } catch { return '>>'; }
  const hit = HOST_ICONS.find(([re]) => re.test(host));
  return hit ? hit[1] : '>>';
}

async function assertOwned(id, ownerId) {
  const row = await queryOne('SELECT * FROM bio_pages WHERE id = ? AND owner_id = ?', [id, ownerId]);
  if (!row) throw new HttpError(404, 'Bio page not found');
  return row;
}

/** Owner's pages with live stats: link count, total clicks, bio-sourced clicks. */
export async function listBioPages(ownerId) {
  return query(
    `SELECT p.*,
            (SELECT COUNT(*) FROM bio_page_links bl WHERE bl.bio_page_id = p.id) AS link_count,
            (SELECT COUNT(*) FROM click_events c
              JOIN bio_page_links bl ON bl.link_id = c.link_id
              WHERE bl.bio_page_id = p.id AND c.is_bot = 0) AS clicks,
            (SELECT COUNT(*) FROM click_events c
              JOIN bio_page_links bl ON bl.link_id = c.link_id
              WHERE bl.bio_page_id = p.id AND c.is_bot = 0 AND c.source = 'bio') AS bio_clicks
     FROM bio_pages p WHERE p.owner_id = ? ORDER BY p.created_at DESC`,
    [ownerId],
  );
}

export async function getBioPage(id, ownerId) {
  const page = await assertOwned(id, ownerId);
  page.links = await query(
    `SELECT b.id AS bio_link_id, b.label, b.position, l.id, l.short_code, l.title, l.destination_url, l.status
     FROM bio_page_links b JOIN links l ON l.id = b.link_id
     WHERE b.bio_page_id = ? ORDER BY b.position`,
    [id],
  );
  return page;
}

export async function createBioPage(ownerId, input) {
  const count = await queryOne('SELECT COUNT(*) AS n FROM bio_pages WHERE owner_id = ?', [ownerId]);
  if (Number(count?.n || 0) >= MAX_PAGES_PER_OWNER) {
    throw new HttpError(400, `You can create at most ${MAX_PAGES_PER_OWNER} bio pages`);
  }
  const slugCheck = validateBioSlug(input.slug);
  if (!slugCheck.ok) throw new HttpError(400, slugCheck.reason, [{ field: 'slug', message: slugCheck.reason }]);
  const clash = await queryOne('SELECT id FROM bio_pages WHERE slug = ?', [slugCheck.slug]);
  if (clash) throw new HttpError(409, 'That slug is already taken');

  const id = nanoid();
  const now = new Date().toISOString();
  await run(
    `INSERT INTO bio_pages (id, owner_id, slug, title, bio, theme, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, ownerId, slugCheck.slug, input.title || null, input.bio || null, input.theme || 'dark', now, now],
  );
  return getBioPage(id, ownerId);
}

export async function updateBioPage(id, ownerId, patch) {
  const page = await assertOwned(id, ownerId);
  const sets = [];
  const params = [];
  const add = (col, val) => { sets.push(`${col} = ?`); params.push(val); };

  if (patch.slug !== undefined) {
    const check = validateBioSlug(patch.slug);
    if (!check.ok) throw new HttpError(400, check.reason, [{ field: 'slug', message: check.reason }]);
    if (check.slug !== page.slug) {
      const clash = await queryOne('SELECT id FROM bio_pages WHERE slug = ? AND id <> ?', [check.slug, id]);
      if (clash) throw new HttpError(409, 'That slug is already taken');
    }
    add('slug', check.slug);
  }
  if (patch.title !== undefined) add('title', patch.title || null);
  if (patch.bio !== undefined) add('bio', patch.bio || null);
  if (patch.theme !== undefined) add('theme', patch.theme);
  if (sets.length) {
    add('updated_at', new Date().toISOString());
    await run(`UPDATE bio_pages SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }
  return getBioPage(id, ownerId);
}

export async function deleteBioPage(id, ownerId) {
  await assertOwned(id, ownerId);
  // bio_page_links cascade on delete; the links themselves are untouched.
  await run('DELETE FROM bio_pages WHERE id = ?', [id]);
  return { ok: true };
}

/** Replace the ordered button list. Every link must belong to this owner. */
export async function setBioPageLinks(id, ownerId, links) {
  await assertOwned(id, ownerId);
  if (links.length > MAX_LINKS_PER_PAGE) {
    throw new HttpError(400, `A bio page lists at most ${MAX_LINKS_PER_PAGE} links`);
  }
  for (const l of links) {
    const own = await queryOne('SELECT id FROM links WHERE id = ? AND owner_id = ?', [l.linkId, ownerId]);
    if (!own) throw new HttpError(400, 'One of the links does not belong to you');
  }
  // Duplicate submissions would render the same button twice.
  const unique = [];
  const seen = new Set();
  for (const l of links) {
    if (seen.has(l.linkId)) continue;
    seen.add(l.linkId);
    unique.push(l);
  }
  await run('DELETE FROM bio_page_links WHERE bio_page_id = ?', [id]);
  let position = 0;
  for (const l of unique) {
    await run('INSERT INTO bio_page_links (id, bio_page_id, link_id, position, label) VALUES (?,?,?,?,?)',
      [nanoid(), id, l.linkId, position++, l.label || null]);
  }
  return getBioPage(id, ownerId);
}

/**
 * Public view data for GET /bio/:slug. Only links that are currently active
 * are listed, so visitors never land on an expired/disabled interstitial.
 */
export async function getPublicPage(slug) {
  const page = await queryOne(
    'SELECT id, slug, title, bio, theme FROM bio_pages WHERE slug = ?',
    [String(slug || '').toLowerCase()],
  );
  if (!page) return null;
  const rows = await query(
    `SELECT b.label, l.short_code, l.title, l.destination_url
     FROM bio_page_links b JOIN links l ON l.id = b.link_id
     WHERE b.bio_page_id = ? AND l.status = 'active'
     ORDER BY b.position`,
    [page.id],
  );
  return {
    ...page,
    buttons: rows.map((r) => ({
      code: r.short_code,
      label: r.label,
      title: r.title,
      emoji: iconFor(r.destination_url),
    })),
  };
}
