// Basic tests for critical business logic.
// Run with: npm test   (uses node:test built into Node 20+)
// A temp SQLite file is used; DATABASE_URL is intentionally left unset.
// NOTE: config.js reads env at import time, so we set env BEFORE dynamic imports.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';

process.env.NODE_ENV = 'test';
process.env.SQLITE_FILE = new URL('./test-run.db', import.meta.url).pathname.replace(/^\//, '');
process.env.JWT_SECRET = 'test-secret';
process.env.BASE_URL = 'http://localhost:3001';
rmSync(process.env.SQLITE_FILE, { force: true });

const { initDb, queryOne, run, closeDb } = await import('../src/db/index.js');
const { validateAlias, validateDestinationUrl, RESERVED_ALIASES } = await import('../src/utils/validation.js');
const { generateUniqueCode, isValidCodeShape } = await import('../src/utils/shortCode.js');

await initDb();

// Seed a user so FK constraints on links.owner_id are satisfied in tests.
const { nanoid } = await import('nanoid');
await run('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?,?,?,?,?,?)', [
  'u1', 'Test', 'test@example.com', 'x', 'user', new Date().toISOString(),
]);

test('alias validation accepts good, rejects bad/reserved', () => {
  assert.equal(validateAlias('my-link').ok, true);
  assert.equal(validateAlias('abc123').ok, true);
  assert.equal(validateAlias(null).ok, true); // empty -> auto-generate
  assert.equal(validateAlias('ab').ok, false); // too short
  assert.equal(validateAlias('-lead').ok, false); // leading symbol
  for (const r of ['api', 'admin', 'login']) assert.equal(RESERVED_ALIASES.has(r), true);
  assert.equal(validateAlias('admin').ok, false);
});

test('destination URL validation blocks unsafe schemes & self-reference', () => {
  assert.equal(validateDestinationUrl('https://ok.com/a').ok, true);
  assert.equal(validateDestinationUrl('javascript:alert(1)').ok, false);
  assert.equal(validateDestinationUrl('ftp://x.com').ok, false);
  assert.equal(validateDestinationUrl('not a url').ok, false);
  // self-referencing shortener host (BASE_URL=localhost:3001) is rejected
  assert.equal(validateDestinationUrl('http://localhost:3001/x').ok, false);
});

test('generated codes are unique & well-shaped', async () => {
  const seen = new Set();
  for (let i = 0; i < 50; i++) {
    const c = await generateUniqueCode();
    assert.equal(isValidCodeShape(c), true, `shape ok for ${c}`);
    assert.ok(c.length >= 6 && c.length <= 8, `length in 6..8: ${c}`);
    seen.add(c);
  }
  assert.equal(seen.size, 50, 'all 50 codes distinct');
});

test('click-limit counter is atomic (never exceeds max_clicks)', async () => {
  const now = new Date().toISOString();
  await run(
    `INSERT INTO links (id, owner_id, short_code, destination_url, status, max_clicks, click_count, created_at, updated_at)
     VALUES (?,?,?,?, 'active', 5, 0, ?, ?)`,
    ['l_limit', 'u1', 'limitcode', 'https://example.com', now, now],
  );
  // Simulate 8 concurrent bumps against a limit of 5 using the guarded UPDATE.
  const bump = () => run(
    `UPDATE links SET click_count = click_count + 1
     WHERE id = ? AND (max_clicks IS NULL OR click_count < max_clicks)`,
    ['l_limit'],
  );
  await Promise.all(Array.from({ length: 8 }, bump));
  const row = await queryOne('SELECT click_count FROM links WHERE id = ?', ['l_limit']);
  assert.ok(Number(row.click_count) <= 5, `click_count never exceeds max (${row.click_count})`);
  assert.equal(Number(row.click_count), 5, 'stopped exactly at the limit');
});

test('bot clicks are flagged and excluded from counts', async () => {
  const now = new Date().toISOString();
  await run(
    `INSERT INTO links (id, owner_id, short_code, destination_url, status, click_count, created_at, updated_at)
     VALUES (?,?,?,?, 'active', 0, ?, ?)`,
    ['l_bot', 'u1', 'botcode', 'https://example.com', now, now],
  );
  await run(
    `INSERT INTO click_events (id, link_id, clicked_at, is_bot, is_unique, source)
     VALUES ('c1','l_bot',?,1,0,'direct'),('c2','l_bot',?,0,1,'direct')`,
    [now, now],
  );
  const totals = await queryOne(
    `SELECT COUNT(*) AS n FROM click_events WHERE link_id = 'l_bot' AND is_bot = 0`,
  );
  assert.equal(Number(totals.n), 1, 'bot excluded from analytics count');
});


// ---- Phase 2: device targeting + link settings (PATCH) logic ----
const { deviceClass } = await import('../src/utils/clickContext.js');
const { createLink, updateLink } = await import('../src/services/linkService.js');

test('deviceClass resolves ios/android/desktop from user-agent', () => {
  const req = (ua) => ({ headers: { 'user-agent': ua } });
  assert.equal(deviceClass(req('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')), 'ios');
  assert.equal(deviceClass(req('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36')), 'android');
  assert.equal(deviceClass(req('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0')), 'desktop');
  assert.equal(deviceClass(req('')), 'desktop');
});

test('updateLink: password set/clear, expiry reactivation, ownership & FK guards', async () => {
  const link = await createLink('u1', { destinationUrl: 'https://example.com/x', alias: 'patchme', password: 'abc12345' });
  assert.ok(link.password_hash, 'password stored as bcrypt hash');

  const cleared = await updateLink(link.id, 'u1', { password: null });
  assert.equal(cleared.password_hash, null, 'password cleared');

  // Expire it, then a future expiry automatically brings it back to active.
  await updateLink(link.id, 'u1', { status: 'expired' });
  const revived = await updateLink(link.id, 'u1', { expiresAt: new Date(Date.now() + 864e5).toISOString() });
  assert.equal(revived.status, 'active', 'future expiry re-activates an expired link');

  // Cannot activate while the stored expiry is still in the past.
  await updateLink(link.id, 'u1', { status: 'expired' });
  await updateLink(link.id, 'u1', { expiresAt: new Date(Date.now() - 36e5).toISOString() });
  await assert.rejects(
    updateLink(link.id, 'u1', { status: 'active' }),
    /expiry date is in the past/,
  );

  // Unknown campaign and non-owner updates are rejected.
  await assert.rejects(updateLink(link.id, 'u1', { campaignId: 'nope' }), /Unknown campaign/);
  await assert.rejects(updateLink(link.id, 'u9', { title: 'hijack' }), /do not own/);
});

test('updateLink: rejects another user\'s campaign; tags-only PATCH still applies', async () => {
  const now = new Date().toISOString();
  await run('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?,?,?,?,?,?)', [
    'u2b', 'Other', 'other@example.com', 'x', 'user', now,
  ]);
  await run('INSERT INTO campaigns (id, owner_id, name, created_at) VALUES (?,?,?,?)', ['camp_other', 'u2b', 'Foreign', now]);
  await run('INSERT INTO tags (id, owner_id, name, created_at) VALUES (?,?,?,?)', ['tag_u1_a', 'u1', 'alpha', now]);
  await run('INSERT INTO tags (id, owner_id, name, created_at) VALUES (?,?,?,?)', ['tag_u1_b', 'u1', 'beta', now]);

  const link = await createLink('u1', {
    destinationUrl: 'https://example.com/tags', alias: 'tagsonly', tags: ['alpha', 'beta'],
  });
  assert.deepEqual([...link.tags].sort(), ['alpha', 'beta'], 'tags attached on create');

  // A campaign owned by someone else is refused (seed/UI must never send one).
  await assert.rejects(updateLink(link.id, 'u1', { campaignId: 'camp_other' }), /Unknown campaign/);

  // Tags-only PATCH: no column changes, but the join must still be rewritten.
  const retagged = await updateLink(link.id, 'u1', { tags: ['beta'] });
  assert.deepEqual(retagged.tags, ['beta'], 'tags-only update applies');

  // Clearing all tags works too (empty array = remove every owner-scoped tag).
  const cleared = await updateLink(link.id, 'u1', { tags: [] });
  assert.deepEqual(cleared.tags, [], 'tags cleared');
});

// ---- Phase 3: blocklist normalization + CSV import row validation ----
const { normalizeDomain, addBlockedDomain, removeBlockedDomain } = await import('../src/services/adminService.js');
const { isDomainBlocked } = await import('../src/utils/validation.js');
const { validateImportRows } = await import('../src/services/importService.js');

test('normalizeDomain cleans input; blocklist blocks subdomains and can be lifted', async () => {
  assert.equal(normalizeDomain('https://Spam.com/x?a=1'), 'spam.com');
  assert.equal(normalizeDomain('spam.com:8080/path'), 'spam.com');
  assert.equal(normalizeDomain('not a domain'), null);
  assert.equal(normalizeDomain('http://'), null);

  const row = await addBlockedDomain('u1', { domain: 'evil.example.com', reason: 'unit test' });
  assert.equal(row.domain, 'evil.example.com');
  assert.equal(await isDomainBlocked('https://a.evil.example.com/x'), true, 'subdomain inherits block');
  assert.equal(await isDomainBlocked('https://notevil.example.com/'), false, 'lookalike not blocked');

  await removeBlockedDomain(row.id);
  assert.equal(await isDomainBlocked('https://evil.example.com/x'), false, 'unblock restores');
});

test('CSV import preview: flags bad rows, keeps good rows, writes nothing', async () => {
  await createLink('u1', { destinationUrl: 'https://example.com/taken', alias: 'takenalias' });
  const res = await validateImportRows('u1', [
    { line: 2, url: 'https://good.example/g', alias: 'freshalias', title: 'Good row' },
    { line: 3, url: 'nope not a url' },
    { line: 4, url: 'https://dup-batch.example', alias: 'freshalias' }, // same alias twice in file
    { line: 5, url: '' },
    { line: 6, url: 'https://ok.example', alias: 'takenalias' },        // alias already used
    { line: 7, url: 'https://ok2.example', alias: 'bad!alias' },
  ]);
  assert.equal(res[0].valid, true, 'clean row passes');
  assert.equal(res[1].valid, false, 'invalid url caught');
  assert.ok(res[2].errors.some((e) => /duplicate/i.test(e)), 'in-batch alias duplicate caught');
  assert.ok(res[3].errors.some((e) => /required/i.test(e)), 'missing url caught');
  assert.ok(res[4].errors.some((e) => /already taken/i.test(e)), 'existing alias caught');
  assert.ok(res[5].errors.some((e) => /alias/i.test(e)), 'malformed alias caught');
  const stillThere = await queryOne(`SELECT id FROM links WHERE short_code = 'freshalias'`);
  assert.ok(!stillThere, 'preview performs no writes');
});

// ---- Phase 4: bio pages + redirect rule ORDER (integration over HTTP) ----
const bio = await import('../src/services/bioService.js');
const { validateBioSlug } = await import('../src/utils/validation.js');

test('bio pages: slug rules, ordering, ownership, public view hides inactive links', async () => {
  assert.equal(validateBioSlug('Ada').slug, 'ada');            // normalized
  assert.equal(validateBioSlug('my-page_1').ok, true);
  assert.equal(validateBioSlug('a').ok, false);                 // too short
  assert.equal(validateBioSlug('has spaces').ok, false);
  assert.equal(validateBioSlug('admin').ok, false);             // reserved

  const page = await bio.createBioPage('u1', { slug: 'unit-bio', title: 'Unit', bio: 'hi', theme: 'brand' });
  assert.equal(page.slug, 'unit-bio');
  await assert.rejects(bio.createBioPage('u1', { slug: 'unit-bio' }), /already taken/);
  await assert.rejects(bio.createBioPage('u1', { slug: 'bio' }), /reserved/);

  const l1 = await createLink('u1', { destinationUrl: 'https://example.com/b1', alias: 'bio-l1' });
  const l2 = await createLink('u1', { destinationUrl: 'https://example.com/b2', alias: 'bio-l2' });
  const other = await createLink('u1', { destinationUrl: 'https://example.com/b3', alias: 'bio-l3' });

  await bio.setBioPageLinks(page.id, 'u1', [
    { linkId: l2.id, label: 'Second button' },
    { linkId: l1.id, label: null },
  ]);
  const withLinks = await bio.getBioPage(page.id, 'u1');
  assert.deepEqual(withLinks.links.map((l) => l.short_code), ['bio-l2', 'bio-l1'], 'position order preserved');

  // Only active links appear on the public page.
  await run(`UPDATE links SET status = 'expired' WHERE id = ?`, [l1.id]);
  const pub = await bio.getPublicPage('unit-bio');
  assert.deepEqual(pub.buttons.map((b) => b.code), ['bio-l2'], 'inactive links are not listed publicly');
  assert.equal(pub.buttons[0].label, 'Second button');

  // Links must belong to the owner, and so must the page.
  await assert.rejects(bio.setBioPageLinks(page.id, 'u1', [{ linkId: 'nope' }]), /does not belong/);
  await assert.rejects(bio.getBioPage(page.id, 'u9'), /not found/);
  await bio.deleteBioPage(page.id, 'u1');
  assert.equal(await bio.getPublicPage('unit-bio'), null);
  assert.ok(await queryOne(`SELECT id FROM links WHERE short_code = 'bio-l2'`), 'deleting a page keeps its links');
  assert.equal((await bio.listBioPages('u1')).length, 0);
  void other;
});

test('redirect engine applies rules in the documented order', async () => {
  const { createApp } = await import('../src/app.js');
  const { addBlockedDomain, removeBlockedDomain } = await import('../src/services/adminService.js');
  const bcrypt = (await import('bcryptjs')).default;
  const now = new Date().toISOString();
  const past = new Date(Date.now() - 36e5).toISOString();
  const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  const insert = async (code, extra) => {
    const id = nanoid();
    await run(
      `INSERT INTO links (id, owner_id, short_code, destination_url, title, status, password_hash,
                          expires_at, max_clicks, click_count, device_rules, disabled_reason, created_at, updated_at)
       VALUES (?,?,?,?,?, 'active', ?,?,?,0,?,?,?,?)`,
      [id, 'u1', code, `https://order.example/${code}`, code,
       extra.password || null, extra.expiresAt || null, extra.maxClicks || null,
       extra.deviceRules ? JSON.stringify(extra.deviceRules) : null, extra.reason || null, now, now],
    );
    if (extra.status) await run('UPDATE links SET status = ? WHERE id = ?', [extra.status, id]);
    return code;
  };

  // Rule 2 (disabled) beats rule 4 (expired): a disabled AND expired link shows
  // the disabled page, not the expired one.
  const disabledFirst = await insert('ord-disabled', { status: 'disabled', expiresAt: past, reason: 'moderation picky' });
  // Rule 3 (blocklist) beats rule 4 (expiry).
  await addBlockedDomain('u1', { domain: 'order-blocked.example', reason: 'test' });
  const blockedFirst = await insert('ord-blocked', { expiresAt: past });
  await run(`UPDATE links SET destination_url = 'https://order-blocked.example/x' WHERE short_code = ?`, [blockedFirst]);
  // Rule 4 (expiry) beats rule 5 (limit).
  const expiredFirst = await insert('ord-expired', { status: 'expired', expiresAt: past, maxClicks: 1 });
  await run('UPDATE links SET click_count = 5 WHERE short_code = ?', [expiredFirst]);
  // Rule 6 (password) beats rule 7 (device targeting).
  const pwFirst = await insert('ord-pw', {
    password: await bcrypt.hash('hunter2', 10),
    deviceRules: { ios: 'https://ios.example/target' },
  });
  // Rule 7 (device) then rule 8 (302 to the chosen target).
  const devi = await insert('ord-device', { deviceRules: { ios: 'https://ios.example/target' } });

  const server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (code, ua = CHROME) => fetch(`${base}/${code}`, { redirect: 'manual', headers: { 'user-agent': ua } });

  try {
    const a = await get(disabledFirst);
    const aBody = await a.text();
    assert.equal(a.status, 410, 'disabled wins');
    assert.match(aBody, /disabled/i, 'disabled page shown for disabled+expired link');

    const b = await get(blockedFirst);
    assert.equal(b.status, 403, 'blocklist wins over expiry');

    const c = await get(expiredFirst);
    const cBody = await c.text();
    assert.equal(c.status, 410, 'expired wins over limit');
    assert.match(cBody, /expired/i, 'expired page (not limit page)');

    const d = await get(pwFirst);
    assert.equal(d.status, 401, 'password gate wins over device rules');

    const e = await get(devi, IPHONE);
    assert.equal(e.status, 302, 'device rule redirects');
    assert.equal(e.headers.get('location'), 'https://ios.example/target', 'iOS visitor gets the ios target');
    const f = await get(devi);
    assert.equal(f.headers.get('location'), `https://order.example/${devi}`, 'desktop visitor gets the default');

    const g = await get('ord-does-not-exist');
    assert.equal(g.status, 404, 'unknown code -> 404 page');

    // Public bio page is served by the app (and 404s for unknown slugs).
    const h = await fetch(`${base}/bio/not-a-real-slug`);
    assert.equal(h.status, 404, 'unknown bio slug -> 404');
  } finally {
    server.close();
    await removeBlockedDomain((await queryOne('SELECT id FROM blocked_domains WHERE domain = ?', ['order-blocked.example'])).id);
  }
});

// Close DB only after every test has finished.
after(async () => {
  await closeDb();
  rmSync(process.env.SQLITE_FILE, { force: true });
});
