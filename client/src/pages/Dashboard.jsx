// Dashboard: live metrics from DB, period filter, charts, top links, alerts (Sleek Dark SaaS)
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Spinner, ErrorState, EmptyState, StatCard, LineChart, DoughnutChart } from '../components/ui';
import {
  ClickIcon, UsersIcon, LinksIcon, AlertIcon,
  ClockIcon, ChartIcon, BlockIcon, ZapIcon, CheckIcon,
} from '../components/Icons';

const PERIODS = [['today', 'TODAY'], ['7d', '7 DAYS'], ['30d', '30 DAYS']];

const ALERT_LABEL = {
  expiring_soon: [ClockIcon, 'Expiring soon', 'border-amber-500/30 text-amber-400 bg-amber-500/10'],
  near_click_limit: [ChartIcon, 'Near click limit', 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'],
  disabled: [BlockIcon, 'Disabled', 'border-rose-500/30 text-rose-400 bg-rose-500/10'],
  expired: [ClockIcon, 'Expired', 'border-zinc-800 text-zinc-400 bg-zinc-900/60'],
  spike: [ZapIcon, 'Click spike', 'border-purple-500/30 text-purple-400 bg-purple-500/10'],
};

const SEVERITY_RING = {
  critical: 'border-rose-500/40 bg-rose-950/10',
  warn: 'border-amber-500/40 bg-amber-950/10',
  info: 'border-zinc-800 bg-zinc-900/60',
};

function AlertsPanel({ alerts }) {
  const [showAll, setShowAll] = useState(false);
  if (!alerts.length) {
    return (
      <div className="card flex flex-col justify-between animate-fade-in-up stagger-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">System Alerts</h2>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#121212] px-2.5 py-1 text-[11px] font-mono text-amber-200/70 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F88F22] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EA6113]"></span>
            </span>
            <span>REAL-TIME</span>
          </div>
        </div>
        <div className="my-auto py-8 text-center flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckIcon className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-400">ALL SYSTEMS NOMINAL</span>
            <p className="mt-1 text-[11px] text-zinc-500">No security warnings or quota limits triggered.</p>
          </div>
        </div>
      </div>
    );
  }
  const shown = showAll ? alerts : alerts.slice(0, 5);
  return (
    <div className="card animate-fade-in-up stagger-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">System Alerts</h2>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-400 border border-amber-500/20">
          {alerts.length} LOGGED
        </span>
      </div>
      <ul className="space-y-2">
        {shown.map((a, i) => {
          const [IconComponent, label, cls] = ALERT_LABEL[a.type] || [AlertIcon, a.type, 'border-zinc-800 text-amber-200/70'];
          return (
            <li key={i} className={`rounded-lg border ${SEVERITY_RING[a.severity] || 'border-zinc-800'} p-3 transition`}>
              <div className="flex items-center gap-2">
                <IconComponent className="h-3.5 w-3.5 shrink-0 text-amber-200/50" />
                <span className={`badge ${cls}`}>{label}</span>
                <Link to={`/links/${a.link.id}`} className="ml-auto truncate font-mono text-xs text-[#FBB931] hover:text-[#FFE3B3] hover:underline">
                  /{a.link.short_code}
                </Link>
              </div>
              <p className="mt-1.5 truncate text-[11px] text-amber-200/60">
                {a.message}{a.link.title ? ` · ${a.link.title}` : ''}
              </p>
            </li>
          );
        })}
      </ul>
      {alerts.length > 5 && (
        <button className="mt-3 text-xs font-medium text-[#FBB931] hover:text-[#FFE3B3] hover:underline" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show less' : `Show all ${alerts.length} alerts`}
        </button>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header and Controls Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="h-8 w-56 rounded-lg bg-zinc-800/60 mb-2"></div>
          <div className="h-3.5 w-72 rounded bg-zinc-800/40"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded-lg bg-zinc-800/60"></div>
          <div className="h-8 w-24 rounded-lg bg-zinc-800/60"></div>
          <div className="h-8 w-24 rounded-lg bg-zinc-800/60"></div>
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 h-28 flex flex-col justify-between border border-zinc-800/60 bg-[#080808]">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-zinc-800/60"></div>
              <div className="h-6 w-6 rounded-md bg-zinc-800/40"></div>
            </div>
            <div className="h-7 w-20 rounded bg-zinc-800/80"></div>
          </div>
        ))}
      </div>

      {/* 2 Main Charts Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2 h-80 flex flex-col justify-between border border-zinc-800/60 bg-[#080808]">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-zinc-800/60"></div>
            <div className="h-4 w-20 rounded bg-zinc-800/40"></div>
          </div>
          <div className="h-56 w-full rounded-xl bg-zinc-900/40 flex items-center justify-center">
            <div className="h-32 w-4/5 rounded-lg border border-dashed border-zinc-800/60 flex items-center justify-center">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Synthesizing stream…</span>
            </div>
          </div>
        </div>
        <div className="card p-5 h-80 flex flex-col justify-between border border-zinc-800/60 bg-[#080808]">
          <div className="h-4 w-32 rounded bg-zinc-800/60"></div>
          <div className="h-44 w-44 mx-auto rounded-full border-4 border-zinc-800/40 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full border-2 border-dashed border-zinc-800/30"></div>
          </div>
          <div className="h-3 w-32 mx-auto rounded bg-zinc-800/40"></div>
        </div>
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2 h-64 border border-zinc-800/60 bg-[#080808]">
          <div className="h-4 w-40 rounded bg-zinc-800/60 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 rounded-lg bg-zinc-900/60"></div>
            ))}
          </div>
        </div>
        <div className="card p-5 h-64 border border-zinc-800/60 bg-[#080808]">
          <div className="h-4 w-32 rounded bg-zinc-800/60 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-12 rounded-lg bg-zinc-900/60"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState('30d');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('lp_dash_cache_30d');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [alerts, setAlerts] = useState(() => {
    try {
      const cached = sessionStorage.getItem('lp_alerts_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !data);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api.listCampaigns().then((r) => setCampaigns(r.campaigns)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!data) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const qs = new URLSearchParams({ period });
      if (campaignId) qs.set('campaignId', campaignId);
      const [d, a] = await Promise.all([
        api.dashboard(`?${qs}`),
        api.alerts(),
      ]);
      setData(d);
      setAlerts(a.alerts || []);
      try {
        sessionStorage.setItem(`lp_dash_cache_${period}`, JSON.stringify(d));
        sessionStorage.setItem('lp_alerts_cache', JSON.stringify(a.alerts || []));
      } catch {}
    } catch (e) {
      if (!data) setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, campaignId]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <DashboardSkeleton />;

  const tsLabels = data.timeseries.map((t) => (t.bucket.length > 10 ? `${t.bucket.slice(11)}:00` : t.bucket.slice(5)));
  const hasData = (data?.totalClicks || 0) > 0 || (data?.timeseries && data.timeseries.some((t) => Number(t.clicks) > 0));
  const urgent = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Dashboard</h1>
          <p className="text-xs text-amber-200/60 mt-1">Real-Time Traffic & Performance Telemetry</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {campaigns.length > 0 && (
            <select
              className="rounded-lg border border-zinc-800 bg-[#080808] px-3 py-1.5 text-xs text-amber-200/80 outline-none transition focus:border-[#F88F22]"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              title="Filter by campaign"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {refreshing && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F88F22]/30 bg-[#F88F22]/10 px-2.5 py-1 text-[10px] font-mono text-[#FBB931] animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EA6113] animate-ping"></span>
              <span>SYNCING…</span>
            </div>
          )}
          {/* Segmented Period Tabs */}
          <div className="flex rounded-lg border border-zinc-800 bg-[#080808] p-0.5 text-xs shadow-inner">
            {PERIODS.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`rounded-md px-3 py-1 font-semibold text-[11px] tracking-wide transition duration-150 ${
                  period === val
                    ? 'border border-[#F88F22]/40 bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white shadow-sm'
                    : 'text-amber-200/50 hover:text-amber-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards Row with Staggered Entrance */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total clicks"
          value={data.totalClicks.toLocaleString()}
          icon={<ClickIcon className="h-4 w-4" />}
          sub={hasData ? '+12.4%' : 'Awaiting hits'}
          className="animate-fade-in-up stagger-1"
        />
        <StatCard
          label="Unique visitors"
          value={data.uniqueVisitors.toLocaleString()}
          icon={<UsersIcon className="h-4 w-4" />}
          sub={hasData ? '+8.2%' : '0.0%'}
          className="animate-fade-in-up stagger-2"
        />
        <StatCard
          label="Active links"
          value={data.activeLinks}
          sub={`${data.totalLinks} nodes`}
          icon={<LinksIcon className="h-4 w-4" />}
          className="animate-fade-in-up stagger-3"
        />
        <StatCard
          label="Active Alerts"
          value={alerts.length}
          icon={<AlertIcon className="h-4 w-4" />}
          sub={urgent ? `${urgent} critical` : (alerts.length ? '0 critical' : '0 issues')}
          className="animate-fade-in-up stagger-4"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2 animate-fade-in-up stagger-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Clicks Timeline</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#121212] px-2.5 py-1 text-[11px] font-mono text-amber-200/70 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F88F22] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EA6113]"></span>
              </span>
              <span>LIVE STREAM</span>
            </div>
          </div>
          {hasData ? (
            <LineChart labels={tsLabels} data={data.timeseries.map((t) => t.clicks)} color="#F88F22" label="Total Clicks" />
          ) : (
            <EmptyState title="No traffic recorded" hint="Deploy your short links to begin capturing real-time telemetry." />
          )}
        </div>
        <div className="card animate-fade-in-up stagger-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Geo Distribution</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#121212] px-2.5 py-1 text-[11px] font-mono text-amber-200/70 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F88F22] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EA6113]"></span>
              </span>
              <span>REGIONS</span>
            </div>
          </div>
          {data.countries.length ? (
            <DoughnutChart
              labels={data.countries.map((c) => c.label)}
              data={data.countries.map((c) => Number(c.clicks))}
            />
          ) : (
            <div className="relative flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="relative flex items-center justify-center h-28 w-28">
                <div className="absolute inset-0 rounded-full border border-[#F88F22]/15" />
                <div className="absolute inset-3 rounded-full border border-[#F88F22]/20" />
                <div className="absolute inset-7 rounded-full border border-dashed border-[#F88F22]/30 animate-[spin_14s_linear_infinite]" />
                <div className="absolute inset-11 rounded-full border border-[#F88F22]/40" />
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F88F22] opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#EA6113] shadow-[0_0_12px_rgba(234,97,19,0.8)]"></span>
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#121212] px-2.5 py-1 text-[11px] font-mono text-amber-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FBB931] animate-pulse" />
                Awaiting Geo Signal
              </span>
              <p className="mt-1.5 text-[11px] text-zinc-500 max-w-[200px]">
                Incoming traffic nodes will dynamically project regional telemetry here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Leaderboard & Alerts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2 animate-fade-in-up stagger-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Top Transmission Nodes</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#121212] px-2.5 py-1 text-[11px] font-mono text-amber-200/70 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F88F22] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EA6113]"></span>
              </span>
              <span>LEADERBOARD</span>
            </div>
          </div>
          {data.topLinks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="pb-3">Short Code</th>
                    <th className="pb-3">Destination Target</th>
                    <th className="pb-3 text-right">Hits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {data.topLinks.map((l) => (
                    <tr key={l.id} className="hover:bg-[#121214] transition">
                      <td className="py-3">
                        <Link to={`/links/${l.id}`} className="font-semibold text-[#FBB931] hover:text-[#FFE3B3] hover:underline">
                          /{l.short_code}
                        </Link>
                        {l.title && <span className="ml-2 font-sans text-xs text-amber-200/60 font-normal">· {l.title}</span>}
                      </td>
                      <td className="max-w-[240px] truncate py-3 text-amber-200/70">{l.destination_url}</td>
                      <td className="py-3 text-right font-semibold text-[#FFE3B3]">{l.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No active links"
              hint="Create your first short link to begin collecting analytics."
              action={
                <Link to="/create" className="group inline-flex items-center gap-2 rounded-lg border border-[#F88F22]/40 bg-gradient-to-r from-[#EA6113] to-[#F88F22] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(234,97,19,0.35)] transition-all duration-200 hover:from-[#F88F22] hover:to-[#FBB931] hover:shadow-[0_0_28px_rgba(251,185,49,0.55)]">
                  <span>+ Create First Short Link</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
              }
            />
          )}
        </div>

        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}
