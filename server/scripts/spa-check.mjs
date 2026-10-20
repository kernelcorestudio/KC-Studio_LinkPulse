const B = 'http://localhost:3001';
const a = await fetch(B + '/links'); const at = await a.text();
console.log('SPA /links:', a.status, a.headers.get('content-type'), 'isHtml=' + at.includes('id="root"'));
const b = await fetch(B + '/links/deep/route'); console.log('SPA deep fallback:', b.status);
const c = await fetch(B + '/api/nope'); console.log('API 404:', c.status, (await c.text()).slice(0, 50));
const d = await fetch(B + '/api/health'); console.log('health:', d.status);
const e = await fetch(B + '/re-seed-me'); console.log('random short 404 page:', e.status, e.headers.get('content-type'));
