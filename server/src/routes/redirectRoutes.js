// Redirect engine: GET /:code (and POST /:code for the password form).
//
// Rules are evaluated in the EXACT documented order:
//   1. lookup (LRU cache first)      2. disabled -> 410 + reason
//   3. destination blocklist         4. expiry (auto-mark, never delete)
//   5. click limit (fresh atomic read) 6. password (bcrypt + 12h signed cookie)
//   7. device targeting              8. 302 redirect + async click logging
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { queryOne, run } from '../db/index.js';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/errors.js';
import { getCachedLink, linkCache } from '../services/cacheService.js';
import { buildClickEvent, deviceClass } from '../utils/clickContext.js';
import { enqueueClick, recordClickSync } from '../services/clickQueue.js';
import { isDomainBlocked } from '../utils/validation.js';
import { page404, pageDisabled, pageBlocked, pageExpired, pageLimit, pagePassword } from '../utils/pages.js';

export const redirectRouter = Router();

// SPA route words (reserved aliases, never valid short codes) fall through
// to the static frontend when the server also hosts the built client.
const SPA_ROUTES = new Set([
  'app', 'login', 'register', 'dashboard', 'links', 'create', 'campaigns', 'tags',
  'folders', 'settings', 'admin', 'import', 'bio', 'qrcodes', 'favicon.ico', 'robots.txt',
]);

const PW_COOKIE = 'lp_pw';
const PW_COOKIE_HOURS = 12;

function loadLink(code) {
  return queryOne(
    `SELECT id, owner_id, short_code, destination_url, status, password_hash,
            expires_at, max_clicks, click_count, device_rules, disabled_reason
     FROM links WHERE short_code = ?`,
    [code],
  );
}

// Short-lived signed "unlocked" cookie, bound to the specific link id.
function signUnlock(linkId) {
  return jwt.sign({ lid: linkId }, config.jwtSecret, { expiresIn: `${PW_COOKIE_HOURS}h` });
}

function hasValidUnlock(req, linkId) {
  const token = req.cookies?.[PW_COOKIE];
  if (!token) return false;
  try {
    return jwt.verify(token, config.jwtSecret)?.lid === linkId;
  } catch {
    return false; // expired/tampered -> ask again
  }
}

function parseDeviceRules(raw) {
  if (!raw) return null;
  try {
    const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return r && typeof r === 'object' ? r : null;
  } catch {
    return null;
  }
}

// Interstitial/error pages must never be cached: without no-store, browsers
// heuristically cache a 410 page and keep showing it after admin re-enables.
const sendPage = (res, status, html) =>
  res.status(status).set('cache-control', 'no-store').type('html').send(html);

const handler = asyncHandler(async (req, res, next) => {
  const code = req.params.code;
  // Only handle short codes here; let /api and SPA routes fall through.
  if (code === 'api' || SPA_ROUTES.has(code.toLowerCase())) return next();

  // 1. LOOKUP (cache first). Not found -> 404 page.
  const link = await getCachedLink(code, loadLink);
  if (!link) return sendPage(res, 404, page404());

  // 2. STATUS disabled -> 410 blocked page with reason.
  if (link.status === 'disabled') {
    return sendPage(res, 410, pageDisabled(link.disabled_reason));
  }

  // 3. DESTINATION on blocklist -> blocked page.
  if (await isDomainBlocked(link.destination_url)) {
    let host = '';
    try { host = new URL(link.destination_url).hostname; } catch { /* ignore */ }
    return sendPage(res, 403, pageBlocked(host));
  }

  // 4. EXPIRY -> auto-mark `expired` (never deleted, analytics stay traceable).
  if (
    link.status === 'expired' ||
    (link.expires_at && new Date(link.expires_at).getTime() <= Date.now())
  ) {
    if (link.status !== 'expired') {
      await run(`UPDATE links SET status = 'expired' WHERE id = ? AND status = 'active'`, [link.id]);
    }
    linkCache.delete(code);
    return sendPage(res, 410, pageExpired());
  }

  // 5. CLICK LIMIT -> limit page. Cached click_count can lag the async queue,
  //    so links with a limit always get a fresh (cheap, indexed) read.
  if (link.max_clicks != null) {
    const fresh = await queryOne('SELECT click_count FROM links WHERE id = ?', [link.id]);
    if (fresh && fresh.click_count >= link.max_clicks) {
      linkCache.delete(code);
      return sendPage(res, 410, pageLimit());
    }
  }

  // 6. PASSWORD -> bcrypt check + short-lived signed cookie (no re-ask).
  if (link.password_hash && !hasValidUnlock(req, link.id)) {
    if (req.method !== 'POST') {
      return sendPage(res, 401, pagePassword(code));
    }
    const attempted = String(req.body?.password || '');
    if (!attempted || !bcrypt.compareSync(attempted, link.password_hash)) {
      return sendPage(res, 401, pagePassword(code, 'Incorrect password. Please try again.'));
    }
    res.cookie(PW_COOKIE, signUnlock(link.id), {
      maxAge: PW_COOKIE_HOURS * 3600 * 1000,
      httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/',
    });
  }

  // 7. DEVICE TARGETING -> per-device destination when configured.
  let target = link.destination_url;
  const rules = parseDeviceRules(link.device_rules);
  if (rules) {
    const candidate = rules[deviceClass(req)];
    if (candidate && /^https?:\/\//i.test(candidate)) target = candidate;
  }

  // 8. REDIRECT + async click logging.
  const event = buildClickEvent(req, link);
  // Issue a first-party visitor id cookie so unique-visitor counting works.
  if (event._issuedVisitorId) {
    res.cookie('lp_vid', event.visitor_id, {
      maxAge: 365 * 864e5, httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/',
    });
  }

  // 302 (not 301) so every hit is measured accurately; never cached.
  res.set('cache-control', 'no-store');

  if (process.env.VERCEL) {
    try {
      await recordClickSync(event);
    } catch (e) {
      console.error('[redirect] click tracking error on Vercel:', e.message);
    }
    return res.redirect(302, target);
  }

  res.redirect(302, target);

  // Fire-and-forget: logging never blocks the redirect response.
  enqueueClick(event);
});

redirectRouter.get('/:code', handler);
redirectRouter.post('/:code', handler); // password form target

// Cache bust after user/admin updates (status, password, expiry, rules...).
export function invalidate(code) {
  linkCache.delete(code);
}
