// Admin panel: platform overview + abuse alerts, link moderation
// (disable with reason / enable), users, and the destination blocklist.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, shortUrl } from '../lib/api';
import { Spinner, ErrorState, StatCard } from '../components/ui';
import { AdminIcon, LinksIcon, UsersIcon, BlockIcon, AlertIcon, CheckIcon } from '../components/Icons';
import { useTheme } from '../lib/theme';

const TABS = [
  ['overview', 'Overview', AdminIcon],
  ['links', 'Links Matrix', LinksIcon],
  ['users', 'Operators', UsersIcon],
  ['blocklist', 'Domain Blocklist', BlockIcon],
];

function Overview({ isLight }) {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([api.adminStats(), api.adminAlerts()])
      .then(([s, a]) => { setStats(s); setAlerts(a.alerts); })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} />;
  if (!stats) return <Spinner label="Loading platform stats…" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered Users" value={stats.users} />
        <StatCard
          label="Total Links"
          value={stats.links}
          sub={`${stats.active_links} active · ${stats.disabled_links} disabled`}
        />
        <StatCard
          label="Clicks (Real)"
          value={Number(stats.clicks).toLocaleString()}
          sub={`${Number(stats.unique_visitors).toLocaleString()} uniques`}
        />
        <StatCard
          label="Bot Ratio"
          value={`${stats.botRatio}%`}
          sub={`${Number(stats.bot_clicks).toLocaleString()} filtered`}
        />
      </div>

      <div className={`rounded-xl border p-5 shadow-sm backdrop-blur space-y-4 ${
        isLight
          ? 'border-[#EA6113]/25 bg-[#FFF8EB] shadow-[0_4px_20px_rgba(234,97,19,0.06)]'
          : 'border-white/[0.08] bg-[#0c0d0e]/80'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-[#1F0E02]' : 'text-zinc-100'}`}>
            <AlertIcon className="h-4 w-4 text-amber-500" />
            <span>Abuse Detection Engine</span>
          </h2>
          <span className={`text-[11px] font-mono uppercase tracking-wider ${isLight ? 'text-[#8C5523]' : 'text-zinc-400'}`}>
            Automated Threat Guard
          </span>
        </div>

        {!alerts?.length && (
          <div className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-xs font-medium ${
            isLight
              ? 'border-emerald-600/30 bg-emerald-50 text-emerald-800'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          }`}>
            <CheckIcon className={`h-4 w-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <span>Status Nominal — Zero active threats or anomalous spikes detected</span>
          </div>
        )}

        {alerts?.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const link = a.link || a.user;
              const desc = a.type === 'bot_heavy'
                ? `${link.bots}/${link.total} clicks are bots on ${link.short_code}`
                : a.type === 'spike'
                  ? `Spike on ${link.short_code}: ${link.recent} clicks in 24h (prev 24h: ${link.prev})`
                  : `New account ${link.email} created ${link.links} links in its first 24h`;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-xs ${
                    isLight
                      ? 'border-amber-600/30 bg-amber-50/80 text-[#6B3B10]'
                      : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                      isLight
                        ? 'bg-[#FFEDCC] text-[#8C5523] border-[#EA6113]/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {a.type}
                    </span>
                    <span className="truncate">{desc}</span>
                  </div>
                  {a.link && (
                    <Link
                      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                        isLight
                          ? 'text-[#EA6113] hover:bg-[#FFE3B3]/60'
                          : 'text-amber-300 hover:bg-amber-500/20'
                      }`}
                      to={`/links/${a.link.id}`}
                    >
                      Inspect
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-xl border p-5 shadow-sm backdrop-blur space-y-3 ${
          isLight
            ? 'border-[#EA6113]/25 bg-[#FFF8EB] shadow-[0_4px_20px_rgba(234,97,19,0.06)]'
            : 'border-white/[0.08] bg-[#0c0d0e]/80'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-semibold ${isLight ? 'text-[#1F0E02]' : 'text-zinc-100'}`}>Top Links (Platform-Wide)</h2>
            <span className={`text-[11px] font-mono ${isLight ? 'text-[#8C5523]' : 'text-zinc-400'}`}>By Engagement</span>
          </div>
          <div className={`divide-y ${isLight ? 'divide-[#EA6113]/15' : 'divide-zinc-800/60'}`}>
            {stats.topLinks.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2.5 text-xs">
                <Link
                  className={`truncate font-mono font-medium hover:underline ${
                    isLight ? 'text-[#EA6113] hover:text-[#C54A00]' : 'text-[#FBB931] hover:text-[#FFE3B3]'
                  }`}
                  to={`/links/${l.id}`}
                >
                  {shortUrl(l.short_code)}
                </Link>
                <div className="ml-auto flex items-center gap-2 text-right">
                  <span className={`font-semibold ${isLight ? 'text-[#1F0E02]' : 'text-[#FFE3B3]'}`}>{l.click_count.toLocaleString()} clicks</span>
                  <span className={`truncate max-w-[140px] ${isLight ? 'text-[#8C5523]' : 'text-amber-200/60'}`}>· {l.owner_email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm backdrop-blur space-y-3 ${
          isLight
            ? 'border-[#EA6113]/25 bg-[#FFF8EB] shadow-[0_4px_20px_rgba(234,97,19,0.06)]'
            : 'border-white/[0.08] bg-[#0c0d0e]/80'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-semibold ${isLight ? 'text-[#1F0E02]' : 'text-zinc-100'}`}>Top Destination Domains</h2>
            <span className={`text-[11px] font-mono ${isLight ? 'text-[#8C5523]' : 'text-zinc-400'}`}>Host Distribution</span>
          </div>
          <div className={`divide-y ${isLight ? 'divide-[#EA6113]/15' : 'divide-white/[0.06]'}`}>
            {stats.topDomains.map((d) => (
              <div key={d.label} className="flex items-center justify-between py-2.5 text-xs">
                <span className={`truncate font-mono ${isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}`}>{d.label}</span>
                <span className={`font-medium ${isLight ? 'text-[#8C5523]' : 'text-zinc-400'}`}>{d.links} {d.links === 1 ? 'link' : 'links'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LinksTab({ isLight }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams({ limit: '20', offset: String(offset) });
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    api.adminLinks(`?${qs}`).then((r) => { setData(r); setErr(''); }).catch((e) => setErr(e.message));
  }, [search, status, offset]);
  useEffect(load, [load]);

  async function toggle(l) {
    setBusyId(l.id); setErr('');
    try {
      if (l.status === 'disabled') {
        await api.adminEnableLink(l.id);
      } else {
        const reason = prompt(`Disable ${shortUrl(l.short_code)}?\nReason (shown to the owner):`, 'Violates terms of service');
        if (!reason || reason.trim().length < 3) return;
        await api.adminDisableLink(l.id, reason.trim());
      }
      load();
    } catch (e) { setErr(e.message); } finally { setBusyId(null); }
  }

  const badge = (s) => {
    if (isLight) {
      return ({
        active: 'bg-emerald-50 text-emerald-800 border border-emerald-600/30',
        disabled: 'bg-rose-50 text-rose-800 border border-rose-600/30',
        expired: 'bg-[#FFEDCC] text-[#8C5523] border border-[#EA6113]/25',
      }[s] || 'bg-[#FFEDCC] text-[#8C5523] border border-[#EA6113]/25');
    }
    return ({
      active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      disabled: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      expired: 'bg-zinc-800 text-zinc-400 border border-white/[0.06]',
    }[s] || 'bg-zinc-800 text-zinc-400 border border-white/[0.06]');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            className="input w-full"
            placeholder="Search url, slug or owner email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          />
        </div>
        <select
          className="input w-auto cursor-pointer"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
        >
          <option value="">All Statuses</option>
          {['active', 'disabled', 'expired'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        {data && (
          <span className={`text-xs font-mono ml-auto ${isLight ? 'text-[#8C5523]' : 'text-zinc-400'}`}>
            {data.total} total links
          </span>
        )}
      </div>

      {err && <p className="text-xs text-rose-500 font-medium">{err}</p>}

      {!data ? <Spinner label="Loading links matrix…" /> : (
        <div className={`rounded-xl border overflow-hidden shadow-sm backdrop-blur ${
          isLight
            ? 'border-[#EA6113]/25 bg-[#FFF8EB] shadow-[0_4px_20px_rgba(234,97,19,0.06)]'
            : 'border-white/[0.08] bg-[#0c0d0e]/80'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b uppercase tracking-wider text-[11px] font-semibold ${
                isLight
                  ? 'border-[#EA6113]/20 bg-[#F7D8A7]/70 text-[#6B3B10]'
                  : 'border-white/[0.08] bg-zinc-900/50 text-zinc-400'
              }`}>
                <tr>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-[#EA6113]/15' : 'divide-white/[0.06]'}`}>
                {data.links.map((l) => (
                  <tr key={l.id} className={`transition ${isLight ? 'hover:bg-[#FBE3BF]/50' : 'hover:bg-zinc-800/30'}`}>
                    <td className="py-3 px-4 font-mono font-medium">
                      <Link
                        className={`hover:underline ${isLight ? 'text-[#EA6113] hover:text-[#C54A00]' : 'text-indigo-400 hover:text-indigo-300'}`}
                        to={`/links/${l.id}`}
                      >
                        {l.short_code}
                      </Link>
                    </td>
                    <td className={`py-3 px-4 max-w-[260px] truncate ${isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}`} title={l.disabled_reason || undefined}>
                      {l.destination_url}
                    </td>
                    <td className={`py-3 px-4 font-mono text-[11px] ${isLight ? 'text-[#8C5523]' : 'text-zinc-400'}`}>{l.owner_email}</td>
                    <td className={`py-3 px-4 font-semibold ${isLight ? 'text-[#1F0E02]' : 'text-zinc-200'}`}>{l.click_count.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge(l.status)}`}>
                        {l.status}
                      </span>
                      {l.status === 'disabled' && l.disabled_reason && (
                        <p className={`mt-1 max-w-[200px] text-[10px] ${isLight ? 'text-rose-700 font-medium' : 'text-rose-400/80'}`}>{l.disabled_reason}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="btn-ghost text-xs py-1 px-2.5"
                        disabled={busyId === l.id}
                        onClick={() => toggle(l)}
                      >
                        {l.status === 'disabled' ? 'Enable' : 'Disable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`flex items-center justify-between border-t px-4 py-3 text-xs ${
            isLight
              ? 'border-[#EA6113]/20 bg-[#F7D8A7]/40 text-[#6B3B10]'
              : 'border-white/[0.08] bg-zinc-900/30 text-zinc-400'
          }`}>
            <button
              className="btn-ghost text-xs disabled:opacity-40"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - 20))}
            >
              ← Previous
            </button>
            <span className="font-mono text-[11px]">
              {data.links.length > 0 ? offset + 1 : 0}–{offset + data.links.length} of {data.total}
            </span>
            <button
              className="btn-ghost text-xs disabled:opacity-40"
              disabled={offset + 20 >= data.total}
              onClick={() => setOffset(offset + 20)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab({ isLight }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams({ limit: '50' });
    if (search) qs.set('search', search);
    api.adminUsers(`?${qs}`).then(setData).catch(() => {});
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <input
          className="input w-full"
          placeholder="Search operator name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!data ? <Spinner label="Loading operators…" /> : (
        <div className={`rounded-xl border overflow-hidden shadow-sm backdrop-blur ${
          isLight
            ? 'border-[#EA6113]/25 bg-[#FFF8EB] shadow-[0_4px_20px_rgba(234,97,19,0.06)]'
            : 'border-white/[0.08] bg-[#0c0d0e]/80'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b uppercase tracking-wider text-[11px] font-semibold ${
                isLight
                  ? 'border-[#EA6113]/20 bg-[#F7D8A7]/70 text-[#6B3B10]'
                  : 'border-white/[0.08] bg-zinc-900/50 text-zinc-400'
              }`}>
                <tr>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Display Name</th>
                  <th className="py-3 px-4">Access Level</th>
                  <th className="py-3 px-4">Links Created</th>
                  <th className="py-3 px-4">Total Clicks</th>
                  <th className="py-3 px-4">Registered</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-[#EA6113]/15' : 'divide-white/[0.06]'}`}>
                {data.users.map((u) => (
                  <tr key={u.id} className={`transition ${isLight ? 'hover:bg-[#FBE3BF]/50' : 'hover:bg-zinc-800/30'}`}>
                    <td className={`py-3 px-4 font-mono font-medium ${isLight ? 'text-[#1F0E02]' : 'text-zinc-200'}`}>{u.email}</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}`}>{u.name}</td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isLight
                            ? 'bg-amber-100 text-[#EA6113] border border-[#EA6113]/30 font-semibold'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          admin
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isLight
                            ? 'bg-[#FFEDCC] text-[#8C5523] border border-[#EA6113]/25'
                            : 'bg-zinc-800 text-zinc-400 border border-white/[0.06]'
                        }`}>
                          user
                        </span>
                      )}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${isLight ? 'text-[#1F0E02]' : 'text-zinc-200'}`}>{u.link_count}</td>
                    <td className={`py-3 px-4 font-semibold ${isLight ? 'text-[#1F0E02]' : 'text-zinc-200'}`}>{u.total_clicks.toLocaleString()}</td>
                    <td className={`py-3 px-4 font-mono text-[11px] ${isLight ? 'text-[#8C5523]' : 'text-zinc-400'}`}>{String(u.created_at).slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BlocklistTab({ isLight }) {
  const [rows, setRows] = useState(null);
  const [domain, setDomain] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.adminBlocklist().then((r) => setRows(r.domains)).catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  async function add(e) {
    e.preventDefault();
    if (!domain.trim()) return;
    setBusy(true); setErr('');
    try {
      await api.adminAddBlocked({ domain: domain.trim(), reason: reason.trim() || null });
      setDomain(''); setReason('');
      load();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }

  async function remove(row) {
    if (!confirm(`Un-block ${row.domain}? Existing links to it stay live; new ones can be created again.`)) return;
    try { await api.adminRemoveBlocked(row.id); load(); } catch (e) { setErr(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-5 shadow-sm backdrop-blur space-y-3 ${
        isLight
          ? 'border-[#EA6113]/25 bg-[#FFF8EB] shadow-[0_4px_20px_rgba(234,97,19,0.06)]'
          : 'border-white/[0.08] bg-[#0c0d0e]/80'
      }`}>
        <h2 className={`text-sm font-semibold ${isLight ? 'text-[#1F0E02]' : 'text-zinc-100'}`}>Add Forbidden Destination Domain</h2>
        <p className={`text-xs ${isLight ? 'text-[#6B3B10]/80' : 'text-zinc-400'}`}>
          Blocked domains (and their subdomains) are forbidden as redirect destinations. Attempts to visit existing links will yield 403 Forbidden.
        </p>

        <form className="flex flex-wrap gap-2.5 pt-1" onSubmit={add}>
          <input
            className="input max-w-[240px] font-mono text-xs"
            placeholder="malicious-domain.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <input
            className="input max-w-[300px] text-xs"
            placeholder="Reason (optional, e.g. Phishing)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition disabled:opacity-50"
            disabled={busy || !domain.trim()}
          >
            {busy ? 'Blocking…' : 'Block Domain'}
          </button>
        </form>
        {err && <p className="text-xs text-rose-500 font-medium">{err}</p>}
      </div>

      {!rows ? <Spinner label="Loading blocked domains…" /> : (
        <div className={`rounded-xl border overflow-hidden shadow-sm backdrop-blur ${
          isLight
            ? 'border-[#EA6113]/25 bg-[#FFF8EB] shadow-[0_4px_20px_rgba(234,97,19,0.06)]'
            : 'border-white/[0.08] bg-[#0c0d0e]/80'
        }`}>
          <div className={`border-b px-4 py-3 flex items-center justify-between ${
            isLight
              ? 'border-[#EA6113]/20 bg-[#F7D8A7]/70'
              : 'border-white/[0.08] bg-zinc-900/50'
          }`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#6B3B10]' : 'text-zinc-400'}`}>
              Restricted Domains
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-[#6B3B10]' : 'text-zinc-400'}`}>{rows.length} banned</span>
          </div>

          {rows.length === 0 ? (
            <div className={`py-8 text-center text-xs ${isLight ? 'text-[#8C5523]' : 'text-zinc-500'}`}>
              No domains currently blocked in global enforcement matrix.
            </div>
          ) : (
            <div className={`divide-y ${isLight ? 'divide-[#EA6113]/15' : 'divide-white/[0.06]'}`}>
              {rows.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-3 px-4 py-3 text-xs transition ${
                    isLight ? 'hover:bg-[#FBE3BF]/50' : 'hover:bg-zinc-800/30'
                  }`}
                >
                  <span className={`font-mono font-medium ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>{b.domain}</span>
                  {b.reason && <span className={`text-xs ${isLight ? 'text-[#6B3B10]/80' : 'text-zinc-400'}`}>— {b.reason}</span>}
                  <span className={`ml-auto text-[11px] font-mono ${isLight ? 'text-[#8C5523]' : 'text-zinc-500'}`}>
                    by {b.added_by_email || 'system'} · {String(b.created_at).slice(0, 10)}
                  </span>
                  <button
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      isLight
                        ? 'text-[#8C5523] hover:text-rose-600 hover:bg-rose-50'
                        : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10'
                    }`}
                    onClick={() => remove(b)}
                  >
                    Un-block
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const { isLight } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isLight ? 'text-[#1F0E02]' : 'text-white'}`}>
          <span className={`rounded-lg p-2 border ${
            isLight
              ? 'bg-[#EA6113]/10 text-[#EA6113] border-[#EA6113]/25'
              : 'bg-[#F88F22]/10 text-[#FBB931] border-[#F88F22]/20'
          }`}>
            <AdminIcon className="h-5 w-5" />
          </span>
          <span>Security & Moderation</span>
        </h1>
        <p className={`mt-1 text-xs ${isLight ? 'text-[#6B3B10]' : 'text-amber-200/60'}`}>
          Platform-wide telemetry, threat monitoring, and global domain enforcement.
        </p>
      </div>

      <div className={`inline-flex rounded-xl border p-1 backdrop-blur gap-1 ${
        isLight
          ? 'border-[#EA6113]/25 bg-[#FFF6E5]/90 shadow-sm'
          : 'border-zinc-800 bg-[#080808]/80'
      }`}>
        {TABS.map(([id, label, Icon]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                active
                  ? (isLight
                      ? 'bg-white text-[#1F0E02] font-semibold shadow-sm border border-[#EA6113]/40'
                      : 'bg-[#1a1a1a] text-white shadow-sm border border-zinc-700')
                  : (isLight
                      ? 'text-[#6B3B10]/80 hover:text-[#1F0E02] hover:bg-[#FFE8C2]/60'
                      : 'text-amber-200/50 hover:text-amber-100 hover:bg-[#121212]')
              }`}
              onClick={() => setTab(id)}
            >
              <Icon className={`h-3.5 w-3.5 ${
                active
                  ? (isLight ? 'text-[#EA6113]' : 'text-[#FBB931]')
                  : (isLight ? 'text-[#EA6113]/50' : 'text-amber-200/40')
              }`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <Overview isLight={isLight} />}
      {tab === 'links' && <LinksTab isLight={isLight} />}
      {tab === 'users' && <UsersTab isLight={isLight} />}
      {tab === 'blocklist' && <BlocklistTab isLight={isLight} />}
    </div>
  );
}
