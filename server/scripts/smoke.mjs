// End-to-end smoke test against a running server (default http://localhost:3001).
// Usage: node scripts/smoke.mjs  (server must already be running)
const BASE = process.env.SMOKE_BASE || 'http://localhost:3001';
const email = `smoke-${Date.now()}@example.com`;

async function j(path, opts = {}, token) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
}

function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; }
  else console.log('ok  -', msg);
}

const reg = await j('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Smoke', email, password: 'password123' }) });
assert(reg.status === 201 && reg.body.token, 'register returns token');
const token = reg.body.token;

const bad = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'javascript:alert(1)' }) }, token);
assert(bad.status === 400, 'rejects unsafe scheme');

const dup = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com', alias: 'api' }) }, token);
assert(dup.status === 400, 'rejects reserved alias "api"');

const created = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com/page?x=1', title: 'Smoke link', tags: ['demo'] }) }, token);
assert(created.status === 201 && created.body.link.short_code, `create link -> code ${created.body.link?.short_code}`);
const code = created.body.link.short_code;
const linkId = created.body.link.id;

const avail = await j('/api/links/available?code=' + code, {}, token);
assert(avail.body.available === false, 'alias availability reports taken code as unavailable');

// Redirect: expect 302 to destination.
const red = await fetch(`${BASE}/${code}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120' , referer: 'https://twitter.com/x' } });
assert(red.status === 302, `redirect 302 (got ${red.status})`);
assert((red.headers.get('location') || '').includes('example.com'), 'redirect Location is the destination');

const notFound = await fetch(`${BASE}/nope99`, { redirect: 'manual' });
assert(notFound.status === 404, 'unknown code -> 404');

// Wait for the async click queue to flush (1s interval + margin).
await new Promise((r) => setTimeout(r, 1800));

const an = await j(`/api/analytics/link/${linkId}?period=30d`, {}, token);
assert(an.status === 200, 'link analytics returns 200');
assert(an.body.totalClicks >= 1, `analytics counted click (clicks=${an.body.totalClicks}, uniques=${an.body.uniqueVisitors})`);
assert(Array.isArray(an.body.timeseries), 'analytics has timeseries');
assert(an.body.referrers.some((x) => x.label === 'twitter.com'), 'referrer twitter.com captured');

const dash = await j('/api/analytics/dashboard?period=30d', {}, token);
assert(dash.status === 200 && dash.body.totalLinks >= 1, 'dashboard summary returns metrics');

const alerts = await j('/api/analytics/alerts', {}, token);
assert(alerts.status === 200 && Array.isArray(alerts.body.alerts), 'alerts endpoint returns array');

// ---------------------------------------------------------------------------
// Phase 2: redirect rules, PATCH settings, campaigns/tags/folders API.
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Rule 4 - expiry: a link created with a past expiry must 410 (never deleted).
const expLink = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com/exp', alias: 'smokeexp' + Date.now(), expiresAt: new Date(Date.now() - 3600e3).toISOString() }) }, token);
assert(expLink.status === 201, 'create link with past expiry (stored, not deleted)');
const expRes = await fetch(`${BASE}/${expLink.body.link.short_code}`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
assert(expRes.status === 410 && (await expRes.text()).includes('expired'), 'expired link -> 410 expired page');

// Rule 5 - click limit: 2-click limit stops the 3rd visitor with a limit page.
const limLink = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com/lim', alias: 'smokelim' + Date.now(), maxClicks: 2 }) }, token);
const limCode = limLink.body.link.short_code;
let limitOk = true;
for (let i = 0; i < 2; i++) {
  const r = await fetch(`${BASE}/${limCode}?u=${i}`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
  if (r.status !== 302) limitOk = false;
  await wait(1600); // let the async click queue flush and bump the counter
}
const r3 = await fetch(`${BASE}/${limCode}`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
assert(limitOk && r3.status === 410 && (await r3.text()).includes('limit'), 'click limit enforced after 2 real clicks -> 410 limit page');

// Rule 6 - password: 401 form -> wrong pw 401 -> right pw 302 + cookie -> re-visit skips form.
const pwLink = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com/pw', alias: 'smokepw' + Date.now(), password: 'ses3ame' }) }, token);
const pwCode = pwLink.body.link.short_code;
const pwGet = await fetch(`${BASE}/${pwCode}`, { redirect: 'manual' });
const pwBody = await pwGet.text();
assert(pwGet.status === 401 && pwBody.includes('This link is protected'), 'password link -> 401 unlock form');
const formPost = (pw) => fetch(`${BASE}/${pwCode}`, {
  method: 'POST', redirect: 'manual',
  headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': CHROME },
  body: 'password=' + pw,
});
const pwBad = await formPost('wrong');
assert(pwBad.status === 401 && (await pwBad.text()).includes('Incorrect'), 'wrong password rejected');
const pwGood = await formPost('ses3ame');
const setCookie = pwGood.headers.get('set-cookie') || '';
assert(pwGood.status === 302 && setCookie.includes('lp_pw='), 'correct password -> 302 + signed unlock cookie');
const pwRevisit = await fetch(`${BASE}/${pwCode}`, { redirect: 'manual', headers: { 'user-agent': CHROME, cookie: setCookie.split(';')[0] } });
assert(pwRevisit.status === 302, 'return visit with cookie skips the form');

// Rule 7 - device targeting: iPhone UA gets the ios rule, desktop gets default.
const devLink = await j('/api/links', { method: 'POST', body: JSON.stringify({
  destinationUrl: 'https://example.com/desktop-page', alias: 'smokedev' + Date.now(),
  deviceRules: { ios: 'https://example.com/ios-app' },
}) }, token);
const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const devIos = await fetch(`${BASE}/${devLink.body.link.short_code}`, { redirect: 'manual', headers: { 'user-agent': iPhoneUA } });
const devDesk = await fetch(`${BASE}/${devLink.body.link.short_code}`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
assert(devIos.status === 302 && (devIos.headers.get('location') || '').includes('ios-app'), 'device targeting: iPhone -> ios rule');
assert(devDesk.status === 302 && (devDesk.headers.get('location') || '').includes('desktop-page'), 'device targeting: desktop -> default destination');

// PATCH settings: password removal applies instantly (cache busted).
const p1 = await j(`/api/links/${pwLink.body.link.id}`, { method: 'PATCH', body: JSON.stringify({ password: null }) }, token);
assert(p1.status === 200 && p1.body.link.password_hash === null, 'PATCH clears password');
const p2 = await fetch(`${BASE}/${pwCode}`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
assert(p2.status === 302, 'unprotected link redirects immediately after PATCH');

// Campaigns / folders / filters.
const camp = await j('/api/campaigns', { method: 'POST', body: JSON.stringify({ name: 'Smoke Q' + Date.now() }) }, token);
assert(camp.status === 201 && camp.body.campaign.id, 'create campaign');
const campId = camp.body.campaign.id;
const folder = await j('/api/folders', { method: 'POST', body: JSON.stringify({ name: 'Smoke F' + Date.now() }) }, token);
assert(folder.status === 201, 'create folder');
const withCamp = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com/c', campaignId: campId, folderId: folder.body.folder.id, tags: ['smoke'] }) }, token);
assert(withCamp.status === 201 && withCamp.body.link.campaign_id === campId, 'create link in campaign + folder');
const campList = await j('/api/campaigns', {}, token);
assert(campList.body.campaigns.some((c) => c.id === campId && Number(c.link_count) === 1), 'campaign list shows link stats');
const filtered = await j(`/api/links?campaignId=${campId}`, {}, token);
assert(filtered.body.links.length === 1 && filtered.body.links[0].id === withCamp.body.link.id, 'links filter by campaignId');
const tagList = await j('/api/tags', {}, token);
assert(tagList.body.tags.some((t) => t.name === 'smoke'), 'tags list includes wizard-created tag');
const dashCamp = await j(`/api/analytics/dashboard?period=30d&campaignId=${campId}`, {}, token);
assert(dashCamp.status === 200 && dashCamp.body.totalLinks >= 1, 'dashboard campaign filter works');
const campDel = await j(`/api/campaigns/${campId}`, { method: 'DELETE' }, token);
const afterDel = await j(`/api/links/${withCamp.body.link.id}`, {}, token);
assert(campDel.status === 200 && afterDel.body.link.campaign_id === null, 'campaign delete keeps links (SET NULL)');

// ---------------------------------------------------------------------------
// Phase 3: QR codes, CSV import, admin panel, blocklist.

// QR: PNG magic bytes + SVG markup for the link created in Phase 1.
const qrP = await fetch(`${BASE}/api/qr/${code}.png`);
const qrBuf = Buffer.from(await qrP.arrayBuffer());
assert(qrP.status === 200 && (qrP.headers.get('content-type') || '').includes('image/png')
  && qrBuf.subarray(1, 4).toString('ascii') === 'PNG', 'QR PNG returns a real image');
const qrS = await fetch(`${BASE}/api/qr/${code}.svg?size=200`);
assert(qrS.status === 200 && (await qrS.text()).includes('<svg'), 'QR SVG returns markup');
const qr404 = await fetch(`${BASE}/api/qr/zznosuchcodezz.png`);
assert(qr404.status === 404, 'QR for unknown code -> 404');

// Non-admins cannot touch the admin API.
const forb = await j('/api/admin/stats', {}, token);
assert(forb.status === 403, 'admin API blocks non-admin (403)');
const al = await j('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@linkpulse.dev', password: 'admin1234' }) });
assert(al.status === 200 && al.body.token, 'admin login returns token');
const aToken = al.body.token;

// Blocklist CRUD + enforcement (incl. subdomain inheritance).
const badDomain = `smokebad${Date.now()}.com`;
const blk = await j('/api/admin/blocklist', { method: 'POST', body: JSON.stringify({ domain: `https://${badDomain}/track?x=1`, reason: 'smoke test' }) }, aToken);
assert(blk.status === 201 && blk.body.domain.domain === badDomain, 'blocklist add normalizes to bare domain');
const blkDup = await j('/api/admin/blocklist', { method: 'POST', body: JSON.stringify({ domain: badDomain }) }, aToken);
assert(blkDup.status === 409, 'blocklist duplicate -> 409');
const blockedCreate = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: `https://www.${badDomain}/sub` }) }, token);
assert(blockedCreate.status === 400, 'creating a link to a blocked domain (subdomain) -> 400');

// CSV import: 1 good row + 4 bad ones (invalid url, empty url, taken alias, blocked domain).
const csvRows = [
  { line: 2, url: 'https://example.com/csv-ok', alias: 'smokecsv' + Date.now(), title: 'CSV ok' },
  { line: 3, url: 'not a url at all' },
  { line: 4, url: '' },
  { line: 5, url: 'https://wikipedia.org/wiki/India', alias: code },
  { line: 6, url: `https://${badDomain}/x`, title: 'blocked row' },
];
const prev = await j('/api/links/import/preview', { method: 'POST', body: JSON.stringify({ rows: csvRows }) }, token);
assert(prev.status === 200 && prev.body.summary.valid === 1 && prev.body.summary.invalid === 4,
  `import preview: ${prev.body?.summary?.valid} valid / ${prev.body?.summary?.invalid} invalid (no writes)`);
assert(prev.body.results[4].errors.some((e) => /blocklist/i.test(e)), 'preview flags blocked domain');
const imp = await j('/api/links/import', { method: 'POST', body: JSON.stringify({ rows: csvRows }) }, token);
assert(imp.status === 200 && imp.body.importedCount === 1 && imp.body.failedCount === 4, 'import: valid rows only');
const impList = await j(`/api/links?search=smokecsv`, {}, token);
assert(impList.body.links.some((l) => l.short_code === csvRows[0].alias), 'imported link exists');

// Admin link moderation: disable with reason -> instant 410 showing reason -> enable -> 302.
const dis = await j(`/api/admin/links/${linkId}/disable`, { method: 'POST', body: JSON.stringify({ reason: 'smoke moderation test' }) }, aToken);
assert(dis.status === 200 && dis.body.link.status === 'disabled', 'admin disables link');
const disGet = await fetch(`${BASE}/${code}`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
const disBody = await disGet.text();
assert(disGet.status === 410 && disBody.includes('smoke moderation test'), 'disabled link -> 410 page shows reason (cache busted)');
assert(disGet.headers.get('cache-control') === 'no-store', 'error pages send no-store (no stale cached 410)');
const en = await j(`/api/admin/links/${linkId}/enable`, { method: 'POST', body: JSON.stringify({}) }, aToken);
const enGet = await fetch(`${BASE}/${code}`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
assert(en.status === 200 && enGet.status === 302, 'admin enables link -> redirect live again');

// Admin views + unblock cleanup.
const aLinks = await j('/api/admin/links?search=' + email, {}, aToken);
assert(aLinks.status === 200 && aLinks.body.links.length >= 1 && aLinks.body.links[0].owner_email === email, 'admin links list joins owner email');
const aUsers = await j('/api/admin/users?search=' + email, {}, aToken);
assert(aUsers.status === 200 && aUsers.body.users.some((u) => u.email === email && Number(u.link_count) >= 1), 'admin users list has counts');
const aStats = await j('/api/admin/stats', {}, aToken);
assert(aStats.status === 200 && Number(aStats.body.links) > 0 && Array.isArray(aStats.body.timeseries), 'platform stats returned');
const aAlerts = await j('/api/admin/alerts', {}, aToken);
assert(aAlerts.status === 200 && Array.isArray(aAlerts.body.alerts), 'abuse alerts endpoint returns array');
const unblock = await j(`/api/admin/blocklist/${blk.body.domain.id}`, { method: 'DELETE' }, aToken);
const afterUnblock = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: `https://${badDomain}/ok`, alias: 'smokeunb' + Date.now() }) }, token);
assert(unblock.status === 200 && afterUnblock.status === 201, 'unblock restores creatability');

// ---------------------------------------------------------------------------
// Phase 4: bio pages (API + public page + ?src=bio attribution), alert messages.

// Alerts now explain themselves (message + severity) for the dashboard panel.
assert(alerts.body.alerts.every((a) => a.message && a.severity), 'every alert carries a message + severity');

// Data-ownership invariant (E2E regression: seed once attached another user's
// campaign, making Settings saves 400): every link's campaign must be the
// OWNER's own campaign.
const ownCampIds = new Set((await j('/api/campaigns', {}, token)).body.campaigns.map((c) => c.id));
const ownLinks = await j('/api/links?limit=100', {}, token);
assert(ownLinks.body.links.every((l) => !l.campaign_id || ownCampIds.has(l.campaign_id)),
  'no link references a campaign its owner does not own');

const slug = 'smoke' + Date.now();
const bioBad = await j('/api/bio', { method: 'POST', body: JSON.stringify({ slug: 'Has Spaces' }) }, token);
assert(bioBad.status === 400, 'bio slug with spaces -> 400');
const bio1 = await j('/api/bio', { method: 'POST', body: JSON.stringify({ slug, title: 'Smoke bio', bio: 'hello world', theme: 'sunset' }) }, token);
assert(bio1.status === 201 && bio1.body.page.slug === slug, `bio page created (/bio/${slug})`);
const bioId = bio1.body.page.id;
const bioDup = await j('/api/bio', { method: 'POST', body: JSON.stringify({ slug }) }, token);
assert(bioDup.status === 409, 'duplicate bio slug -> 409');

// Two links + one expired link: the page lists the active ones in our order.
const bioLinkA = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com/bio-a', alias: 'smokebioa' + Date.now() }) }, token);
const bioLinkB = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com/bio-b', alias: 'smokebiob' + Date.now() }) }, token);
const codeA = bioLinkA.body.link.short_code;
const codeB = bioLinkB.body.short_code || bioLinkB.body.link.short_code;
const bioPutForeign = await j(`/api/bio/${bioId}/links`, { method: 'PUT', body: JSON.stringify({ links: [{ linkId: 'not-yours' }] }) }, token);
assert(bioPutForeign.status === 400, 'cannot put someone else\'s link on your bio page');
const bioPut = await j(`/api/bio/${bioId}/links`, {
  method: 'PUT',
  body: JSON.stringify({ links: [
    { linkId: bioLinkB.body.link.id, label: 'Second first' },
    { linkId: bioLinkA.body.link.id, label: null },
    { linkId: expLink.body.link.id, label: 'the expired one' },
  ] }),
}, token);
assert(bioPut.status === 200 && bioPut.body.page.links.length === 3, 'bio page link order saved');
assert(bioPut.body.page.links[0].short_code === codeB, 'position 0 is the first submitted link');

const pubRes = await fetch(`${BASE}/bio/${slug}`, { headers: { 'user-agent': CHROME } });
const pubHtml = await pubRes.text();
assert(pubRes.status === 200 && pubHtml.includes('Smoke bio'), 'public /bio/:slug renders server-side');
assert(pubHtml.includes(`href="/${codeB}?src=bio"`), 'bio buttons route through the redirect engine with ?src=bio');
assert(!pubHtml.includes(`/${expLink.body.link.short_code}`), 'expired/disabled links are not shown on the public page');

const pubMissing = await fetch(`${BASE}/bio/nosuchslug${Date.now()}`);
assert(pubMissing.status === 404, 'unknown bio slug -> 404');

const bioAsOther = await j(`/api/bio/${bioId}`, {}, aToken);
assert(bioAsOther.status === 404, "another user's bio page is not visible");

// Click it the way a visitor would: from the bio page (?src=bio).
await fetch(`${BASE}/${codeA}?src=bio`, { redirect: 'manual', headers: { 'user-agent': CHROME } });
await wait(1800);
const bioAn = await j(`/api/analytics/link/${bioLinkA.body.link.id}?period=30d`, {}, token);
assert(bioAn.body.sources.some((s) => s.label === 'bio' && Number(s.clicks) >= 1), 'click attributed to source "bio"');
const bioList = await j('/api/bio', {}, token);
const mine = bioList.body.pages.find((p) => p.id === bioId);
assert(Number(mine.link_count) === 3 && Number(mine.bio_clicks) >= 1, 'bio list carries link count + clicks from the page');

const bioRename = await j(`/api/bio/${bioId}`, { method: 'PATCH', body: JSON.stringify({ theme: 'ocean', title: 'Renamed bio' }) }, token);
assert(bioRename.status === 200 && bioRename.body.page.theme === 'ocean', 'bio page theme/title updated');
const bioDel = await j(`/api/bio/${bioId}`, { method: 'DELETE' }, token);
const afterBioDel = await fetch(`${BASE}/bio/${slug}`);
assert(bioDel.status === 200 && afterBioDel.status === 404, 'bio page deleted -> public page gone');
const stillLinks = await j(`/api/links?search=${codeA}`, {}, token);
assert(stillLinks.body.links.length === 1, 'deleting a bio page keeps its links');

// ---------------------------------------------------------------------------
// Rate limiting (last, so the 60s window doesn't affect other steps): the
// create limiter is 30/min per user. Invalid payloads = 400s, no DB writes,
// but they still consume the quota until the limiter answers 429.
let limited;
for (let i = 0; i < 40; i++) {
  const r = await j('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'not a url' }) }, token);
  if (r.status === 429) { limited = r.body; break; }
}
assert(limited && /slow down/i.test(limited.error || ''), 'create rate limiter answers 429 after 30/min');

console.log(process.exitCode ? '\nSMOKE: SOME FAILURES' : '\nSMOKE: ALL PASSED');
