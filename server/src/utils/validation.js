// Zod schemas + domain validation rules shared by routes and the create wizard.
import { z } from 'zod';
import { config } from '../config.js';
import { queryOne } from '../db/index.js';

export const RESERVED_ALIASES = new Set([
  'api', 'admin', 'login', 'register', 'logout', 'dashboard', 'links', 'campaigns',
  'tags', 'folders', 'qr', 'bio', 'settings', 'health', 'assets', 'static', 'www',
  'app', 'analytics', 'import', 'create', 'me', 'favicon.ico', 'robots.txt',
]);

export const ALIAS_RE = /^[0-9a-zA-Z][0-9a-zA-Z_-]{1,30}[0-9a-zA-Z]$/;

/** Validate + normalize a destination URL. Returns {ok, reason, url}. */
export function validateDestinationUrl(raw) {
  if (!raw || typeof raw !== 'string') return { ok: false, reason: 'URL is required' };
  let url;
  const candidate = /^\w+:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: 'Not a valid URL' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https schemes are allowed' };
  }
  if (!url.hostname || !/\./.test(url.hostname)) {
    return { ok: false, reason: 'URL must include a valid domain' };
  }
  // Self-referencing: pointing back at our own short host would loop.
  const ourHost = new URL(config.baseUrl).hostname;
  if (url.hostname === ourHost || url.hostname === 'localhost' && ourHost === 'localhost') {
    // allow other ports, but block identical host+port
    if (url.port === (new URL(config.baseUrl).port || '80') || (url.port === '' && (new URL(config.baseUrl).port || '80') === '80')) {
      return { ok: false, reason: 'Destination cannot point back at this shortener' };
    }
  }
  return { ok: true, url: url.toString() };
}

/** Validate a custom alias. Returns {ok, reason}. */
export function validateAlias(alias) {
  if (alias == null || alias === '') return { ok: true }; // empty => auto-generate
  if (!ALIAS_RE.test(alias)) {
    return { ok: false, reason: 'Alias must be 3-32 chars: letters, numbers, - or _ (no leading/trailing symbol)' };
  }
  if (RESERVED_ALIASES.has(alias.toLowerCase())) {
    return { ok: false, reason: `"${alias}" is a reserved name` };
  }
  return { ok: true };
}

/** Is this destination domain on the admin blocklist? */
export async function isDomainBlocked(destinationUrl) {
  try {
    const host = new URL(destinationUrl).hostname.toLowerCase();
    const row = await queryOne('SELECT domain FROM blocked_domains WHERE domain = ?', [host]);
    if (row) return true;
    // also block if a parent domain is blocked (e.g. spam.com blocks a.spam.com)
    const parts = host.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parent = parts.slice(i).join('.');
      const p = await queryOne('SELECT domain FROM blocked_domains WHERE domain = ?', [parent]);
      if (p) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const createLinkSchema = z.object({
  destinationUrl: z.string().min(1),
  alias: z.string().optional().nullable(),
  title: z.string().trim().max(120).optional().nullable(),
  campaignId: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  maxClicks: z.number().int().positive().optional().nullable(),
  password: z.string().min(1).max(128).optional().nullable(),
  deviceRules: z
    .object({
      ios: z.string().url().optional(),
      android: z.string().url().optional(),
      desktop: z.string().url().optional(),
    })
    .optional()
    .nullable(),
});

// PATCH /api/links/:id - every field optional; only provided keys are updated.
// password: "" clears it. expiresAt/maxClicks: null clears them.
// status: 'active', 'disabled', or 'expired'.
export const updateLinkSchema = createLinkSchema
  .omit({ destinationUrl: true })
  .extend({
    destinationUrl: z.string().min(1).optional(),
    status: z.enum(['active', 'disabled', 'expired']).optional(),
    password: z.string().max(128).optional().nullable(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const campaignSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string().trim().max(500).optional().nullable(),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export const folderSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
});

export const tagRenameSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

// CSV bulk import rows (parsed client-side by papaparse, validated server-side).
export const importRowsSchema = z.object({
  rows: z.array(z.object({
    line: z.number().int().positive().optional(),
    url: z.string().max(2048),
    alias: z.string().max(64).optional().nullable(),
    title: z.string().max(120).optional().nullable(),
  })).min(1, 'No rows to import').max(500, 'Max 500 rows per import'),
});

// Admin: blocklist + disable-with-reason.
export const blockDomainSchema = z.object({
  domain: z.string().trim().min(3).max(253),
  reason: z.string().trim().max(200).optional().nullable(),
});

export const disableLinkSchema = z.object({
  reason: z.string().trim().min(3, 'Please give a short reason (min 3 chars)').max(200),
});

// ---- Phase 4: link-in-bio pages ----
export const BIO_SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,39}$/;
export const BIO_THEMES = ['dark', 'light', 'brand', 'sunset', 'ocean'];

/** Validate a bio page slug. Returns {ok, reason}. */
export function validateBioSlug(slug) {
  if (!slug || typeof slug !== 'string') return { ok: false, reason: 'Slug is required' };
  const s = slug.toLowerCase();
  if (!BIO_SLUG_RE.test(s)) {
    return { ok: false, reason: 'Slug must be 2-40 chars: lowercase letters, numbers, - or _' };
  }
  if (RESERVED_ALIASES.has(s)) return { ok: false, reason: `"${s}" is a reserved name` };
  return { ok: true, slug: s };
}

export const bioPageSchema = z.object({
  slug: z.string().trim().min(2).max(40),
  title: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(280).optional().nullable(),
  theme: z.enum(BIO_THEMES).optional(),
});

export const bioPageUpdateSchema = bioPageSchema
  .omit({ slug: true })
  .extend({ slug: z.string().trim().min(2).max(40).optional() })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

// Ordered button list for a bio page (positions are implied by array order).
export const bioLinksSchema = z.object({
  links: z
    .array(z.object({
      linkId: z.string().min(1),
      label: z.string().trim().max(80).optional().nullable(),
    }))
    .max(30, 'A bio page lists at most 30 links'),
});
