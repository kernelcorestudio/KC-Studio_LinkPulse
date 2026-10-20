// Admin panel: platform overview + abuse alerts, link moderation
// (disable with reason / enable), users, and the destination blocklist.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, shortUrl } from '../lib/api';
import { Spinner, ErrorState, StatCard } from '../components/ui';
import { AdminIcon, LinksIcon, UsersIcon, BlockIcon, AlertIcon, CheckIcon } from '../components/Icons';

const TABS = [
  ['overview', 'Overview', AdminIcon],
  ['links', 'Links Matrix', LinksIcon],
  ['users', 'Operators', UsersIcon],
  ['blocklist', 'Domain Blocklist', BlockIcon],
];

function Overview() {
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

      <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e]/80 p-5 shadow-sm backdrop-blur space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <AlertIcon className="h-4 w-4 text-amber-400" />
            <span>Abuse Detection Engine</span>
          </h2>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Automated Threat Guard</span>
        </div>

        {!alerts?.length && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-400">
            <CheckIcon className="h-4 w-4 text-emerald-400" />
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
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {a.type}
                    </span>
                    <span className="truncate">{desc}</span>
                  </div>
                  {a.link && (
                    <Link className="rounded px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition" to={`/links/${a.link.id}`}>
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
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e]/80 p-5 shadow-sm backdrop-blur space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Top Links (Platform-Wide)</h2>
            <span className="text-[11px] text-zinc-400 font-mono">By Engagement</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {stats.topLinks.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2.5 text-xs">
                <Link className="truncate font-mono font-medium text-indigo-400 hover:text-indigo-300 hover:underline" to={`/links/${l.id}`}>
                  {shortUrl(l.short_code)}
                </Link>
                <div className="ml-auto flex items-center gap-2 text-right">
                  <span className="font-semibold text-zinc-200">{l.click_count.toLocaleString()} clicks</span>
                  <span className="text-zinc-400 truncate max-w-[140px]">· {l.owner_email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e]/80 p-5 shadow-sm backdrop-blur space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Top Destination Domains</h2>
            <span className="text-[11px] text-zinc-400 font-mono">Host Distribution</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {stats.topDomains.map((d) => (
              <div key={d.label} className="flex items-center justify-between py-2.5 text-xs">
                <span className="truncate font-mono text-zinc-300">{d.label}</span>
                <span className="text-zinc-400 font-medium">{d.links} {d.links === 1 ? 'link' : 'links'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LinksTab() {
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

  const badge = (s) => ({
    active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    disabled: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    expired: 'bg-zinc-800 text-zinc-400 border border-white/[0.06]',
  }[s] || 'bg-zinc-800 text-zinc-400 border border-white/[0.06]');

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
          <span className="text-xs font-mono text-zinc-400 ml-auto">
            {data.total} total links
          </span>
        )}
      </div>

      {err && <p className="text-xs text-rose-400">{err}</p>}

      {!data ? <Spinner label="Loading links matrix…" /> : (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e]/80 overflow-hidden shadow-sm backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-zinc-900/50 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {data.links.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium">
                      <Link className="text-indigo-400 hover:text-indigo-300 hover:underline" to={`/links/${l.id}`}>
                        {l.short_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-[260px] truncate text-zinc-300" title={l.disabled_reason || undefined}>
                      {l.destination_url}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{l.owner_email}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-200">{l.click_count.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge(l.status)}`}>
                        {l.status}
                      </span>
                      {l.status === 'disabled' && l.disabled_reason && (
                        <p className="mt-1 max-w-[200px] text-[10px] text-rose-400/80">{l.disabled_reason}</p>
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

          <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-3 text-xs text-zinc-400 bg-zinc-900/30">
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

function UsersTab() {
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
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e]/80 overflow-hidden shadow-sm backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] bg-zinc-900/50 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Display Name</th>
                  <th className="py-3 px-4">Access Level</th>
                  <th className="py-3 px-4">Links Created</th>
                  <th className="py-3 px-4">Total Clicks</th>
                  <th className="py-3 px-4">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-200">{u.email}</td>
                    <td className="py-3 px-4 text-zinc-300">{u.name}</td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                          user
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-200">{u.link_count}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-200">{u.total_clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">{String(u.created_at).slice(0, 10)}</td>
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

function BlocklistTab() {
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
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e]/80 p-5 shadow-sm backdrop-blur space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100">Add Forbidden Destination Domain</h2>
        <p className="text-xs text-zinc-400">
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
        {err && <p className="text-xs text-rose-400">{err}</p>}
      </div>

      {!rows ? <Spinner label="Loading blocked domains…" /> : (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e]/80 overflow-hidden shadow-sm backdrop-blur">
          <div className="border-b border-white/[0.08] bg-zinc-900/50 px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Restricted Domains</span>
            <span className="text-xs font-mono text-zinc-400">{rows.length} banned</span>
          </div>

          {rows.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No domains currently blocked in global enforcement matrix.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {rows.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3 text-xs hover:bg-zinc-800/30 transition">
                  <span className="font-mono font-medium text-rose-400">{b.domain}</span>
                  {b.reason && <span className="text-zinc-400 text-xs">— {b.reason}</span>}
                  <span className="ml-auto text-[11px] text-zinc-500 font-mono">
                    by {b.added_by_email || 'system'} · {String(b.created_at).slice(0, 10)}
                  </span>
                  <button
                    className="rounded px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
            <AdminIcon className="h-5 w-5" />
          </span>
          <span>Security & Moderation</span>
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Platform-wide telemetry, threat monitoring, and global domain enforcement.
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-white/[0.08] bg-[#0c0d0e]/60 p-1 backdrop-blur gap-1">
        {TABS.map(([id, label, Icon]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                active
                  ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
              onClick={() => setTab(id)}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'links' && <LinksTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'blocklist' && <BlocklistTab />}
    </div>
  );
}

