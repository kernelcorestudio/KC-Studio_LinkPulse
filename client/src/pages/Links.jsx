// Links list: search, status filter, pagination, quick actions (Sleek Dark SaaS).
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { api, shortUrl, qrUrl } from '../lib/api';
import { Spinner, ErrorState, EmptyState } from '../components/ui';
import {
  LockIcon,
  CheckIcon,
  CreateIcon,
  ShareIcon,
  CopyIcon,
  ExternalLinkIcon,
  QrIcon,
  PowerIcon,
  TrashIcon,
} from '../components/Icons';

const STATUS_STYLES = {
  active: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  disabled: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  expired: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
};

function QrModal({ link, onClose }) {
  const [size, setSize] = useState(320);
  const [copied, setCopied] = useState(false);
  const url = shortUrl(link.short_code);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative m-auto w-full max-w-sm rounded-2xl border border-[#2a1800] bg-gradient-to-b from-[#180c00] to-[#100800] p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular close cross button at top right corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#2a1800] bg-[#1c1000]/90 text-amber-200/70 shadow-md hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-white hover:scale-105 active:scale-95 transition-all duration-150 z-10"
          aria-label="Close QR Modal"
          title="Close"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="pr-10">
          <h3 className="text-base font-semibold text-white">QR Code</h3>
          <p className="text-xs text-amber-200/60 font-mono mt-0.5">/{link.short_code}</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-white p-4 shadow-inner">
          <img
            src={qrUrl(link.short_code, { format: 'png', size })}
            width={200}
            height={200}
            alt={`QR code for ${link.short_code}`}
            className="block"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-200/60 font-medium">Resolution</span>
            <select
              className="rounded-lg border border-[#2a1800] bg-[#1c1000] px-2.5 py-1 text-xs text-amber-200/80 outline-none focus:border-[#F88F22]"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              {[160, 320, 640, 1024].map((s) => (
                <option key={s} value={s}>{s} × {s} px</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <a
              className="btn-primary flex-1 text-center py-2 text-xs"
              href={qrUrl(link.short_code, { format: 'png', size })}
              download={`qr-${link.short_code}.png`}
            >
              Download PNG
            </a>
            <a
              className="btn-ghost flex-1 text-center py-2 text-xs"
              href={qrUrl(link.short_code, { format: 'svg', size })}
              download={`qr-${link.short_code}.svg`}
            >
              Download SVG
            </a>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {}
            }}
            className="w-full btn-ghost py-2 text-xs text-center"
          >
            {copied ? '✓ Short Link Copied' : 'Copy Short Link'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DeleteModal({ link, onConfirm, onCancel, deleting, error }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="relative m-auto w-full max-w-sm rounded-2xl border border-rose-500/30 bg-gradient-to-b from-[#180c00] to-[#100800] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular close cross button at top right corner */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#2a1800] bg-[#1c1000]/90 text-amber-200/70 shadow-md hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-white hover:scale-105 active:scale-95 transition-all duration-150 z-10"
          aria-label="Close"
          title="Close"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <TrashIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete Short Link?</h3>
            <p className="text-xs text-amber-200/60 font-mono">/{link?.short_code}</p>
          </div>
        </div>

        <p className="text-xs text-amber-200/70 leading-relaxed">
          Are you sure you want to delete this short link? All click analytics, QR codes, and routing rules will be permanently removed.
        </p>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 p-2.5 text-xs text-rose-300 leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="btn-ghost flex-1 py-2 text-xs"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border border-rose-500/40 bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Deleting…</span>
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function LinkActions({ link, onToggleStatus, onOpenQr, onRequestDelete }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [toggling, setToggling] = useState(false);
  const url = shortUrl(link.short_code);
  const isActive = link.status === 'active';

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || `Short link: /${link.short_code}`,
          text: link.title ? `${link.title} - ${url}` : url,
          url,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {}
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggleStatus(link);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5">
      {/* 1. Share */}
      <button
        type="button"
        onClick={handleShare}
        className={`relative group h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150 ${
          shared
            ? 'text-emerald-400 bg-emerald-500/15'
            : 'text-amber-200/50 hover:text-indigo-400 hover:bg-indigo-500/10'
        }`}
        title={shared ? 'Link copied!' : 'Share short link'}
        aria-label="Share short link"
      >
        <ShareIcon className="h-3.5 w-3.5" />
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#100800] border border-[#2a1800] px-2 py-0.5 text-[10px] font-medium text-amber-200/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-30">
          {shared ? 'Copied!' : 'Share'}
        </span>
      </button>

      {/* 2. Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className={`relative group h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150 ${
          copied
            ? 'text-emerald-400 bg-emerald-500/15'
            : 'text-amber-200/50 hover:text-[#FBB931] hover:bg-[#F88F22]/10'
        }`}
        title={copied ? 'Copied!' : 'Copy short link'}
        aria-label="Copy short link"
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#100800] border border-[#2a1800] px-2 py-0.5 text-[10px] font-medium text-amber-200/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-30">
          {copied ? 'Copied!' : 'Copy'}
        </span>
      </button>

      {/* 3. Open in new tab */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group h-7 w-7 rounded-md flex items-center justify-center text-amber-200/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-150"
        title="Open in new tab"
        aria-label="Open in new tab"
      >
        <ExternalLinkIcon className="h-3.5 w-3.5" />
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#100800] border border-[#2a1800] px-2 py-0.5 text-[10px] font-medium text-amber-200/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-30">
          Open
        </span>
      </a>

      {/* 4. QR Code */}
      <button
        type="button"
        onClick={() => onOpenQr(link)}
        className="relative group h-7 w-7 rounded-md flex items-center justify-center text-amber-200/50 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150"
        title="QR Code"
        aria-label="QR Code"
      >
        <QrIcon className="h-3.5 w-3.5" />
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#100800] border border-[#2a1800] px-2 py-0.5 text-[10px] font-medium text-amber-200/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-30">
          QR Code
        </span>
      </button>

      {/* 5. Disable / Enable URL (Power) */}
      <button
        type="button"
        disabled={toggling}
        onClick={handleToggle}
        className={`relative group h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150 ${
          isActive
            ? 'text-emerald-400 hover:text-rose-400 hover:bg-rose-500/10 shadow-[0_0_8px_rgba(52,211,153,0.25)]'
            : 'text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10'
        } ${toggling ? 'opacity-50 cursor-wait' : ''}`}
        title={isActive ? 'Disable link' : 'Enable link'}
        aria-label={isActive ? 'Disable link' : 'Enable link'}
      >
        <PowerIcon className="h-3.5 w-3.5" />
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#100800] border border-[#2a1800] px-2 py-0.5 text-[10px] font-medium text-amber-200/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-30">
          {isActive ? 'Disable' : 'Enable'}
        </span>
      </button>

      {/* 6. Delete URL */}
      <button
        type="button"
        onClick={() => onRequestDelete(link)}
        className="relative group h-7 w-7 rounded-md flex items-center justify-center text-amber-200/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
        title="Delete link"
        aria-label="Delete link"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#100800] border border-[#2a1800] px-2 py-0.5 text-[10px] font-medium text-rose-300 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-30">
          Delete
        </span>
      </button>
    </div>
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

  // Modals state
  const [qrLink, setQrLink] = useState(null);
  const [deleteLink, setDeleteLink] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  async function handleToggleStatus(link) {
    const nextStatus = link.status === 'active' ? 'disabled' : 'active';
    try {
      await api.updateLink(link.id, { status: nextStatus });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          links: prev.links.map((l) => (l.id === link.id ? { ...l, status: nextStatus } : l)),
        };
      });
    } catch (err) {
      alert(err.message || 'Failed to update link status');
    }
  }

  async function handleConfirmDelete() {
    if (!deleteLink) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteLink(deleteLink.id);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          links: prev.links.filter((l) => l.id !== deleteLink.id),
          total: Math.max(0, prev.total - 1),
        };
      });
      setDeleteLink(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete link');
    } finally {
      setDeleting(false);
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2a1800]/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Links Directory</h1>
          <p className="text-xs text-amber-200/60 mt-1">
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
            className="w-full rounded-lg border border-[#2a1800] bg-[#1c1000]/90 pl-9 pr-3.5 py-2 text-xs text-[#FFE3B3] placeholder-amber-900/50 outline-none transition focus:border-[#F88F22]"
            placeholder="Search by code, title, or destination target…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="pointer-events-none absolute left-3 top-2.5 text-amber-900/50">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>
        <select
          className="rounded-lg border border-[#2a1800] bg-[#1c1000]/90 px-3 py-2 text-xs text-amber-200/80 outline-none transition focus:border-[#F88F22]"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-[#F88F22]/30 bg-[#F88F22]/10 px-3 py-1 text-[11px] font-medium text-[#FBB931] hover:border-rose-500/40 hover:text-rose-300 transition"
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
          <div className="overflow-hidden rounded-xl border border-[#2a1800]/80 bg-[#150900]/80 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#2a1800] bg-[#1c1000]/50 text-[11px] font-semibold uppercase tracking-wider text-amber-200/60">
                    <th className="px-5 py-3.5">Short Link</th>
                    <th className="px-5 py-3.5">Destination URL</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Clicks</th>
                    <th className="px-5 py-3.5">Created</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a1800]/60 font-mono">
                  {data.links.map((l) => (
                    <tr key={l.id} className="hover:bg-[#1c1000]/60 transition">
                      <td className="px-5 py-3.5">
                        <Link to={`/links/${l.id}`} className="font-semibold text-[#FBB931] hover:text-[#FFE3B3] hover:underline">
                          /{l.short_code}
                        </Link>
                        {l.title && <p className="mt-1 max-w-56 truncate font-sans text-xs text-amber-200/60 font-normal">{l.title}</p>}
                      </td>
                      <td className="max-w-64 truncate px-5 py-3.5 text-amber-200/70">{l.destination_url}</td>
                      <td className="px-5 py-3.5 font-sans">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[l.status] || 'border-[#2a1800] text-amber-200/70'}`}>
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
                      <td className="px-5 py-3.5 text-right font-semibold text-[#FFE3B3]">
                        {Number(l.click_count).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-sans text-xs text-amber-900/60">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <LinkActions
                          link={l}
                          onToggleStatus={handleToggleStatus}
                          onOpenQr={setQrLink}
                          onRequestDelete={(item) => {
                            setDeleteError('');
                            setDeleteLink(item);
                          }}
                        />
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
              <span className="text-amber-200/60 font-mono text-xs">Page {page} of {totalPages}</span>
              <button className="btn-ghost px-3 py-1.5" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* QR Code Modal */}
      {qrLink && <QrModal link={qrLink} onClose={() => setQrLink(null)} />}

      {/* Delete Confirmation Modal */}
      {deleteLink && (
        <DeleteModal
          link={deleteLink}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteLink(null);
            setDeleteError('');
          }}
          deleting={deleting}
          error={deleteError}
        />
      )}
    </div>
  );
}

