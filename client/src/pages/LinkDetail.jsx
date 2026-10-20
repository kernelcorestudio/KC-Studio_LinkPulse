// Link detail: Overview + Analytics + Settings tabs (Sleek Dark SaaS).
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, shortUrl, qrUrl } from '../lib/api';
import { Spinner, ErrorState, StatCard, LineChart, BarChart, DoughnutChart } from '../components/ui';
import { LockIcon, ClockIcon, ChartIcon, DeviceIcon, WorldIcon, UsersIcon, ClickIcon } from '../components/Icons';

const PERIODS = [['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days']];

function QrPanel({ code }) {
  const [size, setSize] = useState(320);
  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Dynamic QR Code</h3>
        <p className="text-xs text-zinc-400 mt-0.5">High-resolution scannable QR code. Scans are tracked automatically.</p>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="rounded-xl border border-zinc-800 bg-white p-2.5 shadow-md">
          <img
            src={qrUrl(code, { format: 'png', size })}
            width={140}
            height={140}
            alt={`QR code for ${code}`}
            className="block"
          />
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-xs text-amber-200/60 font-medium">Resolution:</label>
            <select
              className="rounded-lg border border-zinc-800 bg-[#121212] px-2.5 py-1 text-xs text-amber-200/80 outline-none focus:border-[#F88F22]"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              {[160, 320, 640, 1024].map((s) => <option key={s} value={s}>{s} × {s} px</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <a className="btn-primary text-xs py-1.5 px-3" href={qrUrl(code, { format: 'png', size })} download>
              Download PNG
            </a>
            <a className="btn-ghost text-xs py-1.5 px-3" href={qrUrl(code, { format: 'svg', size })} download>
              Download SVG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Overview({ link }) {
  const [copied, setCopied] = useState(false);
  const url = shortUrl(link.short_code);
  const devices = parseDeviceRules(link.device_rules);
  const deviceCount = ['ios', 'android', 'desktop'].filter((k) => devices[k]).length;

  return (
    <div className="space-y-5">
      {/* Short URL Banner */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/60">Short Link URL</span>
          <div className="mt-1 flex items-center gap-3">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="break-all font-mono text-base sm:text-lg font-semibold text-[#FBB931] hover:text-[#FFE3B3] hover:underline"
            >
              {url}
            </a>
          </div>
        </div>
        <button
          className="btn-ghost text-xs py-1.5 px-3 self-start sm:self-auto shrink-0"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
        >
          {copied ? '✓ Copied' : 'Copy Short Link'}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/60">Destination Target</span>
          <p className="break-all font-mono text-xs text-amber-200/80 leading-relaxed pt-1">
            <a href={link.destination_url} target="_blank" rel="noreferrer" className="hover:text-[#FBB931] hover:underline">
              {link.destination_url}
            </a>
          </p>
        </div>

        <div className="card space-y-2.5 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Link Properties</span>
          <div className="divide-y divide-zinc-800/80 pt-1">
            <div className="flex justify-between py-2"><span className="text-zinc-400">Status</span><span className="font-semibold uppercase text-emerald-400">{link.status}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Total Clicks</span><span className="font-mono font-semibold text-zinc-100">{Number(link.click_count).toLocaleString()}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Protection</span><span>{link.password_hash ? <span className="inline-flex items-center gap-1 text-amber-400 font-medium"><LockIcon className="h-3 w-3" /> Password Protected</span> : 'None'}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Expiration</span><span>{link.expires_at ? <span className="text-zinc-300 font-mono">{new Date(link.expires_at).toLocaleString()}</span> : 'Never'}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Click Limit</span><span>{link.max_clicks != null ? `${link.max_clicks} clicks` : 'Unlimited'}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Campaign</span><span className="text-zinc-300">{link.campaign_name || '—'}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Folder</span><span className="text-zinc-300">{link.folder_name || '—'}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Device Routing</span><span>{deviceCount ? `${deviceCount} custom rule${deviceCount > 1 ? 's' : ''}` : 'Default'}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-400">Created At</span><span className="text-zinc-400">{new Date(link.created_at).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>

      <QrPanel code={link.short_code} />
    </div>
  );
}

function Analytics({ linkId }) {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.linkAnalytics(linkId, `?period=${period}&tzOffset=${new Date().getTimezoneOffset()}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [linkId, period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner label="Loading telemetry analytics…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const tsLabels = data.timeseries.map((t) => (t.bucket.length > 10 ? `${t.bucket.slice(11)}:00` : t.bucket.slice(5)));
  const top = (arr, n = 8) => arr.slice(0, n);

  return (
    <div className="space-y-6">
      {/* Period Selector & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <button className="btn-ghost text-xs py-1.5" onClick={load}>Refresh Data</button>
      </div>

      {/* Top 4 Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Clicks" value={data.totalClicks.toLocaleString()} icon={<ClickIcon className="h-4 w-4" />} />
        <StatCard label="Unique Visitors" value={data.uniqueVisitors.toLocaleString()} icon={<UsersIcon className="h-4 w-4" />} />
        <StatCard label="QR Code Scans" value={(data.sources.find((s) => s.label === 'qr')?.clicks || 0).toLocaleString()} icon={<DeviceIcon className="h-4 w-4" />} />
        <StatCard label="Target Countries" value={data.countries.length} icon={<WorldIcon className="h-4 w-4" />} />
      </div>

      {/* Main Clicks Chart */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Clicks Timeline</h3>
          <span className="font-mono text-[10px] text-amber-900/60">[ HISTORICAL ]</span>
        </div>
        <LineChart labels={tsLabels} data={data.timeseries.map((t) => t.clicks)} color="#F88F22" label="Total Clicks" />
      </div>

      {/* Breakdown Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-200/80">Top Referrers</h3>
          {data.referrers.length ? (
            <BarChart horizontal labels={top(data.referrers).map((r) => r.label)} data={top(data.referrers).map((r) => Number(r.clicks))} color="#EA6113" />
          ) : (
            <p className="py-12 text-center text-xs text-amber-900/60">No referrer data recorded yet</p>
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-200/80">Device Breakdown</h3>
          {data.devices.length ? (
            <DoughnutChart labels={data.devices.map((d) => d.label)} data={data.devices.map((d) => Number(d.clicks))} />
          ) : (
            <p className="py-12 text-center text-xs text-amber-900/60">No device data recorded yet</p>
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-200/80">Top Browsers</h3>
          {data.browsers.length ? (
            <BarChart horizontal color="#FBB931" labels={top(data.browsers).map((b) => b.label)} data={top(data.browsers).map((b) => Number(b.clicks))} />
          ) : (
            <p className="py-12 text-center text-xs text-amber-900/60">No browser data recorded yet</p>
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-200/80">Geographic Regions</h3>
          {data.countries.length ? (
            <BarChart horizontal color="#F88F22" labels={top(data.countries).map((c) => c.label)} data={top(data.countries).map((c) => Number(c.clicks))} />
          ) : (
            <p className="py-12 text-center text-xs text-amber-900/60">No geographic data recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parseDeviceRules(raw) {
  if (!raw) return {};
  try {
    const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return r && typeof r === 'object' ? r : {};
  } catch {
    return {};
  }
}

function Settings({ link, onSaved }) {
  const devices = parseDeviceRules(link.device_rules);
  const [form, setForm] = useState({
    destinationUrl: link.destination_url,
    title: link.title || '',
    campaignId: link.campaign_id || '',
    folderId: link.folder_id || '',
    tags: (link.tags || []).join(', '),
    expiresAt: toLocalInput(link.expires_at),
    maxClicks: link.max_clicks ?? '',
    password: '',
    clearPassword: false,
    ios: devices.ios || '',
    android: devices.android || '',
    desktop: devices.desktop || '',
  });
  const [campaigns, setCampaigns] = useState([]);
  const [folders, setFolders] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listCampaigns().then((r) => setCampaigns(r.campaigns)).catch(() => {});
    api.listFolders().then((r) => setFolders(r.folders)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!campaigns.length) return;
    if (form.campaignId && !campaigns.some((c) => c.id === form.campaignId)) {
      setForm((f) => ({ ...f, campaignId: '' }));
    }
  }, [campaigns]);

  useEffect(() => {
    if (!folders.length) return;
    if (form.folderId && !folders.some((w) => w.id === form.folderId)) {
      setForm((f) => ({ ...f, folderId: '' }));
    }
  }, [folders]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(extra = {}) {
    setBusy(true);
    setMsg(null);
    const deviceRules = {};
    for (const k of ['ios', 'android', 'desktop']) {
      const v = (form[k] || '').trim();
      if (!v) continue;
      if (!/^https?:\/\//i.test(v)) {
        setBusy(false);
        setMsg({ kind: 'err', text: `Device target for ${k} must start with http:// or https://` });
        return;
      }
      deviceRules[k] = v;
    }
    try {
      const patch = {
        destinationUrl: form.destinationUrl.trim(),
        title: form.title.trim() || null,
        campaignId: form.campaignId || null,
        folderId: form.folderId || null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        maxClicks: form.maxClicks === '' ? null : Number(form.maxClicks),
        deviceRules: Object.keys(deviceRules).length ? deviceRules : null,
        ...extra,
      };
      if (form.clearPassword) patch.password = null;
      else if (form.password) patch.password = form.password;
      const r = await api.updateLink(link.id, patch);
      onSaved(r.link);
      setForm({ ...form, password: '', clearPassword: false });
      setMsg({ kind: 'ok', text: 'Settings updated successfully and cached redirects purged.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e.details?.map((d) => d.message).join('; ') || e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card max-w-2xl space-y-4">
      {link.status === 'expired' && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5">
          <p className="text-xs text-amber-300">This link is currently <b>expired</b>. Incoming traffic lands on the expired screen.</p>
          <button className="btn-primary text-xs" disabled={busy} onClick={() => save({ status: 'active' })}>Reactivate Link</button>
        </div>
      )}

      <div>
        <label className="label">Destination Target URL</label>
        <input className="input" value={form.destinationUrl} onChange={set('destinationUrl')} />
      </div>
      <div>
        <label className="label">Link Title</label>
        <input className="input" value={form.title} onChange={set('title')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Campaign</label>
          <select className="input" value={form.campaignId} onChange={set('campaignId')}>
            <option value="">— None —</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Folder</label>
          <select className="input" value={form.folderId} onChange={set('folderId')}>
            <option value="">— None —</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Tags (comma separated)</label>
        <input className="input" value={form.tags} onChange={set('tags')} placeholder="marketing, launch, 2026" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Expires At</label>
          <input type="datetime-local" className="input" value={form.expiresAt} onChange={set('expiresAt')} />
          <p className="mt-1 text-[11px] text-zinc-500">Leave blank for indefinite lifespan.</p>
        </div>
        <div>
          <label className="label">Max Allowed Clicks</label>
          <input type="number" min="1" className="input" value={form.maxClicks} onChange={set('maxClicks')} placeholder="Unlimited" />
          <p className="mt-1 text-[11px] text-zinc-500">Currently {Number(link.click_count).toLocaleString()} clicks recorded.</p>
        </div>
      </div>
      <div>
        <label className="label">Access Password</label>
        {link.password_hash ? (
          <div className="flex items-center gap-3">
            <input type="password" className="input" placeholder="Set new password…" value={form.password} onChange={set('password')} autoComplete="new-password" />
            <label className="whitespace-nowrap text-xs text-zinc-400 flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.clearPassword} onChange={(e) => setForm({ ...form, clearPassword: e.target.checked })} />
              <span>Remove</span>
            </label>
          </div>
        ) : (
          <input type="password" className="input" placeholder="Optional password protection" value={form.password} onChange={set('password')} autoComplete="new-password" />
        )}
      </div>

      {/* Device Targeting Box */}
      <div className="rounded-xl border border-zinc-800 bg-[#080808] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DeviceIcon className="h-4 w-4 text-[#FBB931]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Device Targeting Rules</h4>
        </div>
        <p className="text-[11px] text-amber-200/60">Route visitors to dedicated platform targets based on their user agent.</p>
        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <div>
            <label className="label">iOS (iPhone/iPad)</label>
            <input className="input" placeholder="https://apps.apple.com/…" value={form.ios} onChange={set('ios')} />
          </div>
          <div>
            <label className="label">Android</label>
            <input className="input" placeholder="https://play.google.com/…" value={form.android} onChange={set('android')} />
          </div>
          <div>
            <label className="label">Desktop</label>
            <input className="input" placeholder="https://site.com/desktop" value={form.desktop} onChange={set('desktop')} />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-3 py-2 text-xs font-medium ${msg.kind === 'ok' ? 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border border-rose-500/30 bg-rose-950/20 text-rose-300'}`}>
          {msg.text}
        </div>
      )}

      <button className="btn-primary" disabled={busy} onClick={() => save()}>
        {busy ? 'Saving changes…' : 'Save Configuration'}
      </button>
    </div>
  );
}

export default function LinkDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'overview');
  const [link, setLink] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getLink(id).then((r) => setLink(r.link)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!link) return <Spinner />;

  const tabs = [['overview', 'Overview'], ['analytics', 'Analytics'], ['settings', 'Settings']];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Link Header */}
      <div>
        <Link to="/links" className="text-xs font-medium text-amber-200/60 hover:text-white transition flex items-center gap-1 mb-2">
          <span>← Back to Links</span>
        </Link>
        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
          <h1 className="font-mono text-xl sm:text-2xl font-bold text-white break-all">/{link.short_code}</h1>
          {link.title && <span className="text-xs sm:text-sm text-amber-200/60 font-normal">· {link.title}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition ${
              tab === key
                ? 'border-[#F88F22] text-[#FFE3B3]'
                : 'border-transparent text-amber-200/50 hover:text-amber-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview link={link} />}
      {tab === 'analytics' && <Analytics linkId={link.id} />}
      {tab === 'settings' && <Settings link={link} onSaved={setLink} />}
    </div>
  );
}
