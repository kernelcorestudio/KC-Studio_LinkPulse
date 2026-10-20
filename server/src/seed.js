// Seed script: realistic demo data so the dashboard looks alive.
// Creates 1 admin + 2 users, 3 campaigns, tags, ~20 links (incl. expired,
// disabled, password-protected, click-limited) and a few thousand click events
// spread across 30 days (with bots, uniques, referrers, countries, devices).
// Run: npm run seed   (destructive: clears existing rows first)
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import geoip from 'geoip-lite';
import { initDb, run, query, transaction, closeDb, dbMode } from './db/index.js';
import { config } from './config.js';

const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const chance = (p) => Math.random() < p;

const DEVICES = [
  ['desktop', 'Windows', 'Chrome'], ['desktop', 'macOS', 'Safari'], ['mobile', 'Android', 'Chrome'],
  ['mobile', 'iOS', 'Safari'], ['desktop', 'Windows', 'Edge'], ['tablet', 'iPad', 'Safari'],
];
const REFERRERS = ['twitter.com', 'facebook.com', 'linkedin.com', 'reddit.com', 'news.ycombinator.com', null, null, 'google.com'];
const COUNTRIES = ['IN', 'US', 'GB', 'DE', 'CA', 'AU', 'BR', 'JP', 'FR'];
const CITIES = { IN: ['New Delhi', 'Mumbai'], US: ['New York', 'San Francisco'], GB: ['London'], DE: ['Berlin'], CA: ['Toronto'], AU: ['Sydney'], BR: ['Sao Paulo'], JP: ['Tokyo'], FR: ['Paris'] };

async function clearAll() {
  const order = ['click_events', 'link_tags', 'links', 'bio_page_links', 'bio_pages', 'tags', 'campaigns', 'workspaces', 'blocked_domains', 'users'];
  for (const t of order) await run(`DELETE FROM ${t}`);
}

async function addUser(name, email, role, pw) {
  const id = nanoid();
  await run('INSERT INTO users (id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)',
    [id, name, email, await bcrypt.hash(pw, 10), role, iso(now - rand(30) * 864e5)]);
  return id;
}

async function addCampaign(owner, name, description, startDaysAgo, endDaysAgo) {
  const id = nanoid();
  await run('INSERT INTO campaigns (id,owner_id,name,description,start_date,end_date,created_at) VALUES (?,?,?,?,?,?,?)',
    [id, owner, name, description, iso(now - startDaysAgo * 864e5), iso(now - endDaysAgo * 864e5), iso(now - startDaysAgo * 864e5)]);
  return id;
}

async function addTag(owner, name) {
  const id = nanoid();
  await run('INSERT INTO tags (id,owner_id,name,created_at) VALUES (?,?,?,?)', [id, owner, name, iso(now)]);
  return id;
}

async function addFolder(owner, name) {
  const id = nanoid();
  await run('INSERT INTO workspaces (id,owner_id,name,created_at) VALUES (?,?,?,?)', [id, owner, name, iso(now)]);
  return id;
}

async function addLink(o) {
  const id = nanoid();
  const code = o.code || nanoid(6).replace(/[^0-9a-zA-Z]/g, 'x').slice(0, 6);
  await run(
    `INSERT INTO links (id,owner_id,campaign_id,short_code,destination_url,title,status,password_hash,expires_at,max_clicks,click_count,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?, ?,?,?,0,?,?)`,
    [id, o.owner, o.campaign || null, code, o.dest, o.title, o.status || 'active',
      o.passwordHash || null, o.expiresAt || null, o.maxClicks || null, iso(o.created || now), iso(o.created || now)]);
  for (const t of o.tags || []) await run('INSERT INTO link_tags (link_id,tag_id) VALUES (?,?) ON CONFLICT DO NOTHING', [id, t]);
  return { id, code };
}

function generateClicks(linkId, count, { botRatio = 0.08, weightRecent = true } = {}) {
  const rows = [];
  const visitorPool = Math.max(5, Math.floor(count * 0.6));
  const visitors = Array.from({ length: visitorPool }, () => nanoid(12));
  for (let i = 0; i < count; i++) {
    // Bias clicks toward recent days when weightRecent.
    let day = rand(30);
    if (weightRecent && chance(0.5)) day = rand(10);
    const ts = now - day * 864e5 - rand(864e5);
    const isBot = chance(botRatio);
    const [device, os, browser] = pick(DEVICES);
    const country = pick(COUNTRIES);
    const city = pick(CITIES[country] || ['Unknown']);
    const visitor = pick(visitors);
    const seen = chance(0.55); // half of clicks per visitor are "repeat"
    rows.push([
      nanoid(), linkId, iso(ts),
      'hash-' + visitor.slice(0, 6), // ip_hash stand-in (never a raw IP)
      isBot ? null : visitor, isBot ? null : pick(REFERRERS),
      device, os, browser, country, city,
      isBot ? 1 : 0, isBot ? 0 : (seen ? 0 : 1),
      chance(0.15) ? 'qr' : 'direct',
    ]);
  }
  return rows;
}

const CLICK_COLS = ['id', 'link_id', 'clicked_at', 'ip_hash', 'visitor_id', 'referrer', 'device_type', 'os', 'browser', 'country', 'city', 'is_bot', 'is_unique', 'source'];

async function insertClicks(rows) {
  // chunk to keep SQL parameter count reasonable
  const CHUNK = 400;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const values = batch.map(() => `(${CLICK_COLS.map(() => '?').join(',')})`).join(',');
    await run(`INSERT INTO click_events (${CLICK_COLS.join(',')}) VALUES ${values}`, batch.flat());
  }
}

async function main() {
  await initDb();
  console.log(`[seed] connected (${dbMode()}), clearing...`);
  await clearAll();

  const admin = await addUser('Admin', 'admin@linkpulse.dev', 'admin', 'admin1234');
  const u1 = await addUser('Ada Lovelace', 'ada@example.com', 'user', 'password123');
  const u2 = await addUser('Grace Hopper', 'grace@example.com', 'user', 'password123');

  // A couple of blocklist entries for the demo.
  await run('INSERT INTO blocked_domains (id,domain,reason,added_by,created_at) VALUES (?,?,?,?,?)',
    [nanoid(), 'malware-bad-domain.com', 'Known malware', admin, iso(now)]);

  const camp1 = await addCampaign(u1, 'Summer Launch', 'Product launch promo', 30, -20);
  const camp2 = await addCampaign(u1, 'Newsletter Q3', 'Weekly newsletter links', 20, -5);
  const camp3 = await addCampaign(u2, 'Conference 2026', 'Event marketing', 25, -1);

  const tPromo = await addTag(u1, 'promo');
  const tBlog = await addTag(u1, 'blog');
  const tSocial = await addTag(u1, 'social');
  const tEvent = await addTag(u2, 'event');

  const fProducts = await addFolder(u1, 'Product');
  const fContent = await addFolder(u1, 'Content');
  const fEvents = await addFolder(u2, 'Event kit');

  const dests = [
    'https://example.com/product', 'https://blog.example.com/post-1', 'https://youtube.com/watch?v=demo',
    'https://github.com/linkpulse', 'https://wikipedia.org/wiki/URL_shortening', 'https://openai.com/research',
    'https://news.ycombinator.com', 'https://twitter.com/search?q=analytics', 'https://vercel.com/docs',
    'https://figma.com/community', 'https://notion.so/template', 'https://spotify.com/playlist',
    'https://amazon.com/dp/demo', 'https://netlify.com/start', 'https://docs.google.com/form',
    'https://medium.com/article', 'https://producthunt.com/launch', 'https://stackoverflow.com/questions',
    'https://codepen.io/collection', 'https://linktr.ee/demo',
  ];

  const owners = [u1, u1, u1, u1, u1, u1, u1, u1, u1, u1, u2, u2, u2, u2, u2, u2, u2, u2, u1, u2];
  // Campaign/tag/folder ids MUST belong to the link's own owner - a foreign id
  // breaks the Settings PATCH (server rejects "Unknown campaign") and leaks
  // another user's names through the join. Arrays below are owner-consistent:
  // indices 0-9,18 = u1 (camp1/camp2, promo/blog/social), 10-17,19 = u2 (camp3, event).
  const camps = [camp1, camp1, camp2, camp1, camp2, camp1, camp2, null, camp1, camp2, camp3, camp3, null, camp3, camp3, null, camp3, null, camp1, camp3];
  const tagsets = [[tPromo], [tBlog], [tSocial, tBlog], [tPromo], [tBlog], [tEvent], [tEvent, tSocial], [], [tPromo], [tBlog], [tEvent], [tEvent], [], [tPromo], [tBlog], [tSocial], [tEvent], [], [tPromo, tBlog], [tEvent]];
  const folders = [fProducts, fContent, null, null, fContent, null, null, null, fProducts, null, fEvents, null, fEvents, null, null, null, null, null, null, fEvents];

  // Defensive: never attach a resource owned by someone other than the link owner.
  const forOwner = (id, linkOwner, ownerMap) => (id && ownerMap[id] === linkOwner ? id : null);
  const resOwner = {
    [camp1]: u1, [camp2]: u1, [camp3]: u2,
    [tPromo]: u1, [tBlog]: u1, [tSocial]: u1, [tEvent]: u2,
    [fProducts]: u1, [fContent]: u1, [fEvents]: u2,
  };

  const special = {
    3: { status: 'disabled', reason: 'Spam reported by users', expiresAt: null },
    7: { status: 'expired', expiresAt: iso(now - 2 * 864e5) },
    11: { password: await bcrypt.hash('opensem3', 10) },
    15: { maxClicks: 50 }, // will be near/at limit
  };

  // d1000 (normal 302) and d1005 (device targeting) are demo showpieces -
  // they must ALWAYS stay active, so they get no random expiry.
  const alwaysActive = new Set([0, 5]);

  const created = [];
  for (let i = 0; i < dests.length; i++) {
    const sp = special[i] || {};
    const owner = owners[i];
    const { id, code } = await addLink({
      owner,
      campaign: forOwner(camps[i], owner, resOwner),
      code: 'd' + String(1000 + i),
      dest: dests[i],
      title: dests[i].replace(/^https?:\/\//, ''),
      status: sp.status || 'active',
      passwordHash: sp.password || null,
      // Random expiry must be genuinely in the FUTURE (1-10 days) so a freshly
      // seeded "active" link is never already expired (the old rand(10) could
      // return 0 = now, expiring the link the instant it was created).
      expiresAt: sp.expiresAt
        || (!alwaysActive.has(i) && chance(0.3) ? iso(now + (1 + rand(10)) * 864e5) : null),
      maxClicks: sp.maxClicks || null,
      tags: (tagsets[i] || []).filter((t) => forOwner(t, owner, resOwner)),
      created: now - rand(30) * 864e5,
    });
    created.push({ id, code, sp, owner });
  }

  // Folders, device targeting + a bio page: demo data for the Phase 4 UI.
  for (let i = 0; i < created.length; i++) {
    const folderId = forOwner(folders[i], created[i].owner, resOwner);
    if (folderId) await run('UPDATE links SET folder_id = ? WHERE id = ?', [folderId, created[i].id]);
  }
  // d1005: iPhone visitors get the app-store page, Android the Play page.
  await run('UPDATE links SET device_rules = ? WHERE id = ?', [
    JSON.stringify({
      ios: 'https://apps.apple.com/app/linkpulse',
      android: 'https://play.google.com/store/apps/details?id=com.linkpulse',
      desktop: 'https://github.com/linkpulse',
    }),
    created[5].id,
  ]);

  const bioId = nanoid();
  await run(
    `INSERT INTO bio_pages (id,owner_id,slug,title,bio,theme,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [bioId, u1, 'ada', 'Ada Lovelace', 'Notes on telemetry, routing engines and cyber matrices. Everything published links through LinkPulse.', 'brand', iso(now), iso(now)],
  );
  const bioPicks = created.filter((c) => c.owner === u1 && !c.sp.status && !c.sp.password).slice(0, 5);
  const bioLabels = ['[PRODUCT] Core Platform', '[DISPATCH] Engineering Log', '[STREAM] Terminal Demo', '[CODE] Source Repository', '[DOCS] Architecture Notes'];
  for (let i = 0; i < bioPicks.length; i++) {
    await run('INSERT INTO bio_page_links (id,bio_page_id,link_id,position,label) VALUES (?,?,?,?,?)',
      [nanoid(), bioId, bioPicks[i].id, i, bioLabels[i] || null]);
  }

  // Generate clicks: popular links more, special links bounded.
  let totalClicks = 0;
  for (let i = 0; i < created.length; i++) {
    const link = created[i];
    let count = 40 + rand(280);
    if (chance(0.2)) count += 200 + rand(400); // a few viral links
    if (link.sp.maxClicks) count = link.sp.maxClicks + 20; // over-limit attempts
    const rows = generateClicks(link.id, count);
    await insertClicks(rows);
    const real = rows.filter((r) => !r[11]).length;
    totalClicks += real;
    // Set stored click_count to match guarded limit semantics.
    const cap = link.sp.maxClicks ? link.sp.maxClicks : real;
    await run('UPDATE links SET click_count = ? WHERE id = ?', [Math.min(real, cap), link.id]);
  }

  // Give the bio page live traffic in analytics: a slice of the clicks on its
  // links are attributed to source 'bio' (what the public page actually sends).
  for (const b of bioPicks) {
    const rows = await query(
      `SELECT id FROM click_events WHERE link_id = ? AND source = 'direct' AND is_bot = 0 LIMIT 40`,
      [b.id],
    );
    for (const r of rows) await run(`UPDATE click_events SET source = 'bio' WHERE id = ?`, [r.id]);
  }

  console.log(`[seed] done: 3 users, 3 campaigns, 3 folders, ${created.length} links, ${totalClicks} real clicks (+~8% bots).`);
  console.log(`[seed] login -> admin@linkpulse.dev / admin1234, ada@example.com / password123, grace@example.com / password123`);
  console.log(`[seed] password link code d1011 password "opensem3", disabled d1003, expired d1007, limited d1015`);
  console.log(`[seed] bio page -> /bio/ada (owned by ada), device-targeted link -> /d1005 (ios/android/desktop rules)`);
  await closeDb();
}

main().catch((e) => {
  console.error('[seed] failed:', e);
  process.exit(1);
});
