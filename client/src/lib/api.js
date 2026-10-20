// Single API client. In dev, Vite proxies /api to the backend; in production
// VITE_API_BASE points at the deployed backend (Render/Railway).
export const API_BASE = (import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

// The host that serves short links (redirect engine). Resolution order:
// explicit VITE_SHORT_BASE -> VITE_API_BASE -> current page origin, so the
// single-service Render deploy (SPA + API same host) needs no env at all.
export const SHORT_BASE = (import.meta.env.VITE_SHORT_BASE || API_BASE || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

export function shortUrl(code) {
  return `${SHORT_BASE}/${code}`;
}

// Public QR image URLs (no auth needed - a QR only encodes the short link).
export function qrUrl(code, { format = 'png', size = 320 } = {}) {
  return `${API_BASE}/api/qr/${encodeURIComponent(code)}.${format}?size=${size}`;
}

// Public link-in-bio page (server-rendered on the short-link host).
export function bioUrl(slug) {
  return `${SHORT_BASE}/bio/${encodeURIComponent(slug)}`;
}

function getToken() {
  return localStorage.getItem('lp_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('lp_token', token);
  else localStorage.removeItem('lp_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (auth && getToken()) headers.authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  register: (p) => request('/api/auth/register', { method: 'POST', body: p, auth: false }),
  login: (p) => request('/api/auth/login', { method: 'POST', body: p, auth: false }),
  me: () => request('/api/auth/me'),
  // links
  listLinks: (qs = '') => request(`/api/links${qs}`),
  getLink: (id) => request(`/api/links/${id}`),
  createLink: (p) => request('/api/links', { method: 'POST', body: p }),
  updateLink: (id, p) => request(`/api/links/${id}`, { method: 'PATCH', body: p }),
  checkAlias: (code) => request(`/api/links/available?code=${encodeURIComponent(code)}`),
  validateLink: (p) => request(`/api/links/validate`, { method: 'POST', body: p }),
  // campaigns / tags / folders
  listCampaigns: () => request('/api/campaigns'),
  createCampaign: (p) => request('/api/campaigns', { method: 'POST', body: p }),
  updateCampaign: (id, p) => request(`/api/campaigns/${id}`, { method: 'PATCH', body: p }),
  deleteCampaign: (id) => request(`/api/campaigns/${id}`, { method: 'DELETE' }),
  listTags: () => request('/api/tags'),
  renameTag: (id, p) => request(`/api/tags/${id}`, { method: 'PATCH', body: p }),
  deleteTag: (id) => request(`/api/tags/${id}`, { method: 'DELETE' }),
  listFolders: () => request('/api/folders'),
  createFolder: (p) => request('/api/folders', { method: 'POST', body: p }),
  renameFolder: (id, p) => request(`/api/folders/${id}`, { method: 'PATCH', body: p }),
  deleteFolder: (id) => request(`/api/folders/${id}`, { method: 'DELETE' }),
  // bulk import
  importPreview: (rows) => request('/api/links/import/preview', { method: 'POST', body: { rows } }),
  importRows: (rows) => request('/api/links/import', { method: 'POST', body: { rows } }),
  // bio pages (link-in-bio)
  listBio: () => request('/api/bio'),
  getBio: (id) => request(`/api/bio/${id}`),
  createBio: (p) => request('/api/bio', { method: 'POST', body: p }),
  updateBio: (id, p) => request(`/api/bio/${id}`, { method: 'PATCH', body: p }),
  setBioLinks: (id, links) => request(`/api/bio/${id}/links`, { method: 'PUT', body: { links } }),
  deleteBio: (id) => request(`/api/bio/${id}`, { method: 'DELETE' }),
  // admin
  adminStats: () => request('/api/admin/stats'),
  adminAlerts: () => request('/api/admin/alerts'),
  adminLinks: (qs = '') => request(`/api/admin/links${qs}`),
  adminUsers: (qs = '') => request(`/api/admin/users${qs}`),
  adminDisableLink: (id, reason) => request(`/api/admin/links/${id}/disable`, { method: 'POST', body: { reason } }),
  adminEnableLink: (id) => request(`/api/admin/links/${id}/enable`, { method: 'POST', body: {} }),
  adminBlocklist: () => request('/api/admin/blocklist'),
  adminAddBlocked: (p) => request('/api/admin/blocklist', { method: 'POST', body: p }),
  adminRemoveBlocked: (id) => request(`/api/admin/blocklist/${id}`, { method: 'DELETE' }),
  // analytics
  dashboard: (qs) => request(`/api/analytics/dashboard${qs}`),
  linkAnalytics: (id, qs) => request(`/api/analytics/link/${id}${qs}`),
  campaignAnalytics: (id, qs) => request(`/api/analytics/campaign/${id}${qs}`),
  alerts: () => request('/api/analytics/alerts'),
};
