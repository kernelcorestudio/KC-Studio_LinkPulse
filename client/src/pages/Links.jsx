// Links list: search, status filter, pagination, copy-short-url (Sleek Dark SaaS).
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, shortUrl } from '../lib/api';
import { Spinner, ErrorState, EmptyState } from '../components/ui';
import { LockIcon, CheckIcon, CreateIcon } from '../components/Icons';

const STATUS_STYLES = {
  active: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  disabled: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  expired: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
};

function CopyButton({ url }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }
  return (
    <button
      onClick={copy}
      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition duration-150 ${
        done
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
          : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
      title="Copy short link"
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function Links() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);
  const search = params.get('search') || '';
  const status = params.get('status') || '';
  const campaignId = params.get('campaignId') || '';
  const tagId = params.get('tagId') || '';
  const folderId = params.get('folderId') || '';
  const PER_PAGE = 15;

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE, search, status });
      if (campaignId) qs.set('campaignId', campaignId);
      if (tagId) qs.set('tagId', tagId);
      if (folderId) qs.set('folderId', folderId);
      setData(await api.listLinks(`?${qs}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, campaignId, tagId, folderId]);

  useEffect(() => { load(); }, [load]);

  function applyFilters(e) {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (q) p.set('search', q);
    if (status) p.set('status', status);
    if (campaignId) p.set('campaignId', campaignId);
    if (tagId) p.set('tagId', tagId);
    if (folderId) p.set('folderId', folderId);
    setParams(p);
  }
  function setStatus(nextStatus) {
    const p = new URLSearchParams(params);
    if (nextStatus) p.set('status', nextStatus); else p.delete('status');
    p.delete('page');
    setParams(p);
  }
  function clearOrgFilter(key) {
    const p = new URLSearchParams(params);
    p.delete(key);
    p.delete('page');
    setParams(p);
  }
  function goPage(p) {
    const next = new URLSearchParams(params);
    next.set('page', p);
    setParams(next);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;
  const orgChips = [
    campaignId && ['campaignId', 'CAMPAIGN'],
    tagId && ['tagId', 'TAG'],
    folderId && ['folderId', 'FOLDER'],
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Links Directory</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {data ? `${data.total} total short links tracked` : 'Manage your short links and routing'}
          </p>
        </div>
        <Link to="/create" className="btn-primary">
          <CreateIcon className="h-4 w-4" />
          <span>+ Create Link</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-indigo-500"
            placeholder="Search by code, title, or destination target…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="pointer-events-none absolute left-3 top-2.5 text-zinc-500">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>
        <select
          className="rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-300 outline-none transition focus:border-indigo-500"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="expired">Expired</option>
        </select>
        <button type="submit" className="btn-ghost text-xs py-2">
          Filter
        </button>
      </form>

      {orgChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {orgChips.map(([key, label]) => (
            <button
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-300 hover:border-rose-500/40 hover:text-rose-300 transition"
              onClick={() => clearOrgFilter(key)}
              title="Remove filter"
            >
              <span>{label} Filter</span>
              <span className="font-bold">✕</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Spinner label="Scanning links directory…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : data.links.length === 0 ? (
        <EmptyState
          title={search || status ? 'No matching short links' : 'No links created yet'}
          hint={search || status ? 'Try adjusting your search criteria or resetting filters.' : 'Generate your first branded link to start collecting click analytics.'}
          action={!search && !status && <Link to="/create" className="btn-primary">+ Create Link</Link>}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f12] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="px-5 py-3.5">Short Link</th>
                    <th className="px-5 py-3.5">Destination URL</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Clicks</th>
                    <th className="px-5 py-3.5">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {data.links.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Link to={`/links/${l.id}`} className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                            /{l.short_code}
                          </Link>
                          <CopyButton url={shortUrl(l.short_code)} />
                        </div>
                        {l.title && <p className="mt-1 max-w-56 truncate font-sans text-xs text-zinc-400 font-normal">{l.title}</p>}
                      </td>
                      <td className="max-w-64 truncate px-5 py-3.5 text-zinc-400">{l.destination_url}</td>
                      <td className="px-5 py-3.5 font-sans">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[l.status] || 'border-zinc-800 text-zinc-300'}`}>
                            {l.status}
                          </span>
                          {l.password_hash && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400" title="Password protected">
                              <LockIcon className="h-2.5 w-2.5" />
                              <span>Pass</span>
                            </span>
                          )}
                          {l.expires_at && new Date(l.expires_at) < new Date() && l.status === 'active' && (
                            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-zinc-200">
                        {Number(l.click_count).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-sans text-xs text-zinc-500">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-xs pt-3">
              <button className="btn-ghost px-3 py-1.5" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                Previous
              </button>
              <span className="text-zinc-400 font-mono text-xs">Page {page} of {totalPages}</span>
              <button className="btn-ghost px-3 py-1.5" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
