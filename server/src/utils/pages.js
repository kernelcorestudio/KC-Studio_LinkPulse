// Minimal branded HTML pages for the redirect engine (404 / blocked / expired).
const wrap = (title, badgeText, badgeClass, heading, body) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · LinkPulse</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{
  margin:0;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:#09090b;
  color:#f4f4f5;
  display:grid;
  min-height:100vh;
  place-items:center;
  padding:24px 16px;
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.12), transparent 70%),
    radial-gradient(ellipse at 50% 100%, rgba(99, 102, 241, 0.04), transparent 60%);
}
.card{
  width:100%;
  max-width:440px;
  padding:36px 32px;
  background:#0e0f12;
  border:1px solid rgba(255,255,255,0.08);
  border-radius:16px;
  text-align:center;
  box-shadow:0 20px 40px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02);
  backdrop-filter:blur(16px);
}
.icon-box{
  width:44px;
  height:44px;
  margin:0 auto 18px;
  border-radius:12px;
  display:grid;
  place-items:center;
  background:rgba(99,102,241,0.1);
  border:1px solid rgba(99,102,241,0.25);
  color:#818cf8;
}
.badge{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:4px 12px;
  border-radius:9999px;
  font-size:11px;
  font-weight:600;
  letter-spacing:0.04em;
  text-transform:uppercase;
  margin-bottom:16px;
}
.badge-indigo{background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:#a5b4fc}
.badge-rose{background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.25);color:#fda4af}
.badge-amber{background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);color:#fcd34d}
.badge-zinc{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#d4d4d8}

h1{margin:0 0 10px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#ffffff}
p{margin:0 0 24px;color:#a1a1aa;line-height:1.6;font-size:13.5px}
.btn-primary{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:100%;
  padding:10px 16px;
  border-radius:8px;
  border:1px solid #6366f1;
  background:#4f46e5;
  color:#ffffff;
  font-weight:600;
  font-family:inherit;
  font-size:13px;
  text-decoration:none;
  cursor:pointer;
  transition:all .15s ease;
  box-shadow:0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15);
}
.btn-primary:hover{background:#4338ca;border-color:#4f46e5}
.btn-ghost{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:8px 16px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,0.1);
  background:rgba(255,255,255,0.03);
  color:#d4d4d8;
  font-size:13px;
  font-weight:500;
  text-decoration:none;
  transition:all .15s ease;
}
.btn-ghost:hover{background:rgba(255,255,255,0.08);color:#ffffff;border-color:rgba(255,255,255,0.2)}
input{
  width:100%;
  padding:10px 14px;
  border-radius:8px;
  border:1px solid rgba(255,255,255,0.12);
  background:#14151a;
  color:#ffffff;
  margin-bottom:12px;
  font-family:inherit;
  font-size:13.5px;
  transition:all .15s ease;
}
input:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.2)}
.error-msg{color:#f87171;font-size:12.5px;margin-bottom:12px;text-align:left}
</style></head><body><div class="card">
  ${badgeText ? `<div class="badge ${badgeClass || 'badge-zinc'}">${badgeText}</div>` : ''}
  <h1>${heading}</h1>
  ${body}
</div></body></html>`;

// Link-in-bio public page. Server-rendered so it works with no JS,
// is indexable, and every button goes through the redirect engine (?src=bio)
// -> clicks are tracked exactly like any other short link hit.
const BIO_THEMES = {
  dark: { bg: '#09090b', fg: '#f4f4f5', sub: '#a1a1aa', card: '#0e0f12', btn: '#14151b', btnFg: '#ffffff', ring: 'rgba(255,255,255,0.08)', ringHover: 'rgba(99,102,241,0.4)', accent: '#6366f1' },
  light: { bg: '#f8fafc', fg: '#0f172a', sub: '#64748b', card: '#ffffff', btn: '#ffffff', btnFg: '#0f172a', ring: '#e2e8f0', ringHover: '#cbd5e1', accent: '#4f46e5' },
  brand: { bg: '#090a16', fg: '#f8fafc', sub: '#94a3b8', card: '#0f1224', btn: '#151936', btnFg: '#ffffff', ring: 'rgba(99,102,241,0.25)', ringHover: 'rgba(99,102,241,0.6)', accent: '#6366f1' },
  sunset: { bg: '#0d090d', fg: '#faf5ff', sub: '#a8a29e', card: '#181018', btn: '#221622', btnFg: '#ffffff', ring: 'rgba(244,63,94,0.25)', ringHover: 'rgba(244,63,94,0.6)', accent: '#f43f5e' },
  ocean: { bg: '#060d13', fg: '#f0fdfa', sub: '#94a3b8', card: '#0a1622', btn: '#0f2030', btnFg: '#ffffff', ring: 'rgba(14,165,233,0.25)', ringHover: 'rgba(14,165,233,0.6)', accent: '#0ea5e9' },
};

export function pageBio({ title, bio, theme = 'dark', buttons = [], slug = '' }) {
  const t = BIO_THEMES[theme] || BIO_THEMES.dark;
  const buttonsHtml = buttons
    .map((b) => {
      const href = `/${encodeURIComponent(b.code)}?src=bio`;
      const label = b.label || b.title || b.code;
      return `<a class="btn" href="${href}">
        <span class="ico">${escapeHtml(b.emoji || '⚡')}</span>
        <span class="lbl">${escapeHtml(label)}</span>
        <span class="arrow">→</span>
      </a>`;
    })
    .join('\n');

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title || slug || 'Links')} · LinkPulse</title>
<meta name="description" content="${escapeHtml(bio || '')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{
  margin:0;
  min-height:100vh;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:${t.bg};
  color:${t.fg};
  display:flex;
  justify-content:center;
  padding:48px 16px;
  background-image:radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08), transparent 60%);
}
.wrap{width:100%;max-width:480px}
.head{text-align:center;margin-bottom:32px}
.avatar{
  width:72px;
  height:72px;
  margin:0 auto 16px;
  border-radius:20px;
  display:grid;
  place-items:center;
  font-size:20px;
  font-weight:700;
  background:${t.card};
  border:1px solid ${t.ring};
  color:${t.accent};
  box-shadow:0 8px 24px rgba(0,0,0,0.25);
}
h1{margin:0;font-size:22px;font-weight:700;line-height:1.3;letter-spacing:-0.02em}
p.bio{margin:10px auto 0;max-width:380px;color:${t.sub};font-size:13.5px;line-height:1.6;white-space:pre-wrap}
.links{display:flex;flex-direction:column;gap:12px;margin:28px 0}
.btn{
  display:flex;
  align-items:center;
  gap:12px;
  padding:14px 18px;
  border-radius:12px;
  text-decoration:none;
  background:${t.btn};
  color:${t.btnFg};
  border:1px solid ${t.ring};
  font-weight:500;
  font-size:14px;
  box-shadow:0 2px 8px rgba(0,0,0,0.15);
  transition:all .18s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn:hover{
  transform:translateY(-2px);
  border-color:${t.ringHover};
  box-shadow:0 8px 20px rgba(0,0,0,0.3);
}
.ico{font-size:16px;display:grid;place-items:center;width:24px}
.lbl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.arrow{font-size:14px;color:${t.sub};transition:transform .15s}
.btn:hover .arrow{transform:translateX(3px);color:${t.accent}}
.foot{text-align:center;color:${t.sub};font-size:12px;margin-top:24px}
.foot a{color:${t.fg};text-decoration:none;font-weight:600;opacity:0.8}
.foot a:hover{opacity:1;text-decoration:underline}
.empty{text-align:center;color:${t.sub};font-size:13px;padding:32px 0}
</style></head><body><div class="wrap">
<div class="head">
  <div class="avatar">⚡</div>
  <h1>${escapeHtml(title || slug)}</h1>
  ${bio ? `<p class="bio">${escapeHtml(bio)}</p>` : ''}
</div>
<div class="links">
  ${buttonsHtml || '<p class="empty">No active links on this profile yet.</p>'}
</div>
<p class="foot">Powered by <a href="/" rel="noreferrer">LinkPulse</a></p>
</div></body></html>`;
}

export function page404() {
  return wrap(
    'Link Not Found',
    '404 Not Found',
    'badge-zinc',
    'This short link doesn\'t exist',
    `<p>The destination short code does not map to any active link or profile.</p>
     <a class="btn-ghost" href="/">Return to Home</a>`
  );
}

export function pageDisabled(reason) {
  return wrap(
    'Link Disabled',
    'Disabled',
    'badge-rose',
    'This link has been disabled',
    `<p>${reason ? `Notice: ${escapeHtml(reason)}` : 'This link was deactivated by an administrator or owner.'}</p>
     <a class="btn-ghost" href="/">Return to Home</a>`
  );
}

export function pageBlocked(domain) {
  return wrap(
    'Destination Restricted',
    'Restricted Domain',
    'badge-rose',
    'Destination Not Allowed',
    `<p><strong>${escapeHtml(domain || '')}</strong> is prohibited by the platform security blocklist.</p>
     <a class="btn-ghost" href="/">Return to Home</a>`
  );
}

export function pageExpired() {
  return wrap(
    'Link Expired',
    'Expired',
    'badge-amber',
    'This short link has expired',
    `<p>The validity period set for this short link has elapsed and it is no longer routing traffic.</p>
     <a class="btn-ghost" href="/">Return to Home</a>`
  );
}

export function pageLimit() {
  return wrap(
    'Click Limit Reached',
    'Quota Reached',
    'badge-amber',
    'Click limit reached',
    `<p>This link has reached its maximum configured redirect quota and is no longer accessible.</p>
     <a class="btn-ghost" href="/">Return to Home</a>`
  );
}

export function pagePassword(code, error) {
  return wrap(
    'Protected Link',
    'Password Protected',
    'badge-indigo',
    'This link is protected',
    `${error ? `<p class="error-msg">${escapeHtml(error)}</p>` : '<p>Please enter the required passcode to unlock this destination.</p>'}
     <form method="POST" action="/${encodeURIComponent(code)}">
       <input type="password" name="password" placeholder="Enter link password" autofocus required>
       <button class="btn-primary" type="submit">Unlock Destination</button>
     </form>`
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

