// Build a click event record from an express req for a given link.
// Never stores raw IP - stores salted SHA-256 hash only.
import crypto from 'node:crypto';
import { UAParser } from 'ua-parser-js';
import { isbot } from 'isbot';
import geoip from 'geoip-lite';
import { config } from '../config.js';
import { nanoid } from 'nanoid';

export function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHmac('sha256', config.ipHashSalt).update(ip).digest('hex').slice(0, 32);
}

// Best-effort client IP behind proxies. Raw IP is hashed immediately, never stored.
function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

// Device class used by redirect rule 7 (device targeting rules: ios/android/desktop).
export function deviceClass(req) {
  const parsed = new UAParser(req.headers['user-agent'] || '').getResult();
  const os = (parsed.os.name || '').toLowerCase();
  if (os.includes('ios')) return 'ios';
  if (os.includes('android')) return 'android';
  return 'desktop';
}

// Allowed ?src= channel tags (QR codes send src=qr, bio pages send src=bio).
const SRC_VALUES = new Set(['qr', 'bio', 'email', 'sms', 'social', 'ad']);

export function buildClickEvent(req, link, { isUnique = false } = {}) {
  const uaString = req.headers['user-agent'] || '';
  const parsed = new UAParser(uaString).getResult();
  const ip = clientIp(req);
  const geo = ip ? geoip.lookup(ip) : null;

  // Visitor identity: prefer a first-party cookie id, else hash of ip+ua.
  let visitorId = req.cookies?.lp_vid;
  let issuedVisitorId = false;
  if (!visitorId) {
    visitorId = nanoid(16);
    issuedVisitorId = true;
  }
  const fallbackKey = hashIp(ip) + ':' + crypto.createHash('sha1').update(uaString).digest('hex').slice(0, 10);

  const referrer = req.headers.referer ? safeHost(req.headers.referer) : null;
  // Campaign/channel tagging via ?src=… - whitelisted so arbitrary query
  // values can't pollute analytics ('qr', 'bio', …). Anything else = direct.
  const src = SRC_VALUES.has(req.query.src) ? req.query.src : 'direct';

  return {
    id: nanoid(),
    link_id: link.id,
    clicked_at: new Date().toISOString(),
    ip_hash: hashIp(ip),
    visitor_id: visitorId,
    visitor_key: visitorId, // uniqueness is by visitor cookie when present
    visitor_key_fallback: fallbackKey,
    referrer,
    device_type: parsed.device.type || 'desktop',
    os: parsed.os.name || null,
    browser: parsed.browser.name || null,
    country: (req.headers['x-vercel-ip-country'] || geo?.country) || null,
    city: (req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : geo?.city) || null,
    is_bot: isbot(uaString) ? 1 : 0,
    is_unique: isUnique ? 1 : 0,
    source: src,
    _issuedVisitorId: issuedVisitorId,
  };
}

function safeHost(u) {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return null;
  }
}
