// Campaigns: list with live stats, inline create/rename/delete, and an
// expandable analytics panel (Sleek Dark SaaS).
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Spinner, EmptyState, ErrorState, LineChart } from '../components/ui';
import { CampaignIcon } from '../components/Icons';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // {id, name}
  const [openId, setOpenId] = useState(null);
  const [stats, setStats] = useState(null);     // analytics for the open campaign
  const [statsPeriod, setStatsPeriod] = useState('30d');
  const [statsLoading, setStatsLoading] = useState(false);

  const load = useCallback(() => {
    setError('');
    api.listCampaigns().then((r) => setCampaigns(r.campaigns)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function create(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createCampaign({ name: name.trim() });
      setName('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveRename() {
    setBusy(true);
    try {
      await api.updateCampaign(editing.id, { name: editing.name, description: editing.description });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!confirm(`Delete campaign "${c.name}"? Its links will be preserved.`)) return;
    try {
      await api.deleteCampaign(c.id);
      if (openId === c.id) { setOpenId(null); setStats(null); }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStats(c) {
    if (openId === c.id) { setOpenId(null); setStats(null); return; }
    setOpenId(c.id);
    setStats(null);
    setStatsPeriod('30d');
    loadStats(c.id, '30d');
  }

  async function loadStats(id, period) {
    setStatsLoading(true);
    try {
      setStats(await api.campaignAnalytics(id, `?period=${period}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }

  if (error && !campaigns) return <ErrorState message={error} onRetry={load} />;
  if (!campaigns) return <Spinner label="Loading campaigns…" />;

  const topId = campaigns.length
    ? campaigns.reduce((a, b) => (Number(b.clicks) > Number(a.clicks) ? b : a)).id
    : null;

  return (
    <div className="space-y-6">
      {/* Header and Create Campaign */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CampaignIcon className="h-6 w-6 text-indigo-400" />
            <span>Campaigns</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Group links into initiatives and track cross-channel marketing performance.
          </p>
        </div>
        <form className="flex gap-2" onSubmit={create}>
          <input
            className="input w-auto min-w-[200px] text-xs py-2"
            placeholder="New campaign title…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn-primary text-xs whitespace-nowrap" disabled={busy}>
            + Add Campaign
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
          {error}
        </div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns created"
          hint="Group short links by marketing channels, product launches, or seasonal promotions."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editing?.id === c.id ? (
                      <input
                        className="input text-xs py-1"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-semibold text-sm text-zinc-100 truncate">{c.name}</h3>
                    )}
                    {c.description && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{c.description}</p>}
                  </div>
                  {c.id === topId && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
                      Top Performer
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Links</span>
                    <span className="text-sm font-bold text-white font-mono">{c.link_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Clicks</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">{c.clicks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Uniques</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{c.uniques}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs">
                <button
                  className={`btn-ghost text-xs py-1 px-2.5 ${openId === c.id ? 'border-indigo-500 text-indigo-300' : ''}`}
                  onClick={() => toggleStats(c)}
                >
                  {openId === c.id ? 'Hide Stats' : 'Analytics'}
                </button>
                <Link className="btn-ghost text-xs py-1 px-2.5" to={`/links?campaignId=${c.id}`}>
                  View Links
                </Link>
                {editing?.id === c.id ? (
                  <>
                    <button className="btn-primary text-xs py-1 px-2.5" disabled={busy} onClick={saveRename}>Save</button>
                    <button className="btn-ghost text-xs py-1 px-2.5" onClick={() => setEditing(null)}>Cancel</button>
                  </>
                ) : (
                  <button
                    className="btn-ghost text-xs py-1 px-2.5"
                    onClick={() => setEditing({ id: c.id, name: c.name, description: c.description })}
                  >
                    Rename
                  </button>
                )}
                <button
                  className="btn-ghost text-xs py-1 px-2.5 text-rose-400 hover:text-rose-300 ml-auto"
                  onClick={() => remove(c)}
                >
                  Delete
                </button>
              </div>

              {openId === c.id && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Campaign Timeline</span>
                    <div className="flex gap-1 rounded-md border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
                      {['7d', '30d', '90d'].map((p) => (
                        <button
                          key={p}
                          onClick={() => { setStatsPeriod(p); loadStats(c.id, p); }}
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${statsPeriod === p ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {statsLoading ? (
                    <Spinner label="Loading campaign metrics…" />
                  ) : stats && (
                    <>
                      <LineChart labels={stats.timeseries.map((t) => t.bucket)} data={stats.timeseries.map((t) => t.clicks)} color="#6366f1" />
                      {stats.countries?.length > 0 && (
                        <p className="text-[11px] text-zinc-400 pt-1">
                          Top regions: {stats.countries.slice(0, 3).map((x) => `${x.label} (${x.clicks})`).join(' · ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
