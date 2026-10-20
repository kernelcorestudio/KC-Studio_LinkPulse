// Create Link: two-step wizard (Sleek Dark SaaS).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, shortUrl } from '../lib/api';
import {
  LockIcon, ClockIcon, ChartIcon, DeviceIcon,
  SparkleIcon, CheckIcon, EyeIcon, EyeOffIcon,
} from '../components/Icons';

const EMPTY_FORM = {
  destinationUrl: '', alias: '', title: '', tags: '',
  campaignId: '', folderId: '', expiresAt: '', maxClicks: '', password: '',
  ios: '', android: '', desktop: '',
};

function pickDeviceRules(form) {
  const out = {};
  for (const [key, value] of [['ios', form.ios], ['android', form.android], ['desktop', form.desktop]]) {
    const v = (value || '').trim();
    if (!v) continue;
    if (!/^https?:\/\//i.test(v)) return { error: `${key.toUpperCase()} target must start with http:// or https://` };
    out[key] = v;
  }
  return { rules: Object.keys(out).length ? out : null };
}

export default function CreateLink() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [aliasState, setAliasState] = useState({ status: 'idle', message: '' });
  const [warnings, setWarnings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newCampaign, setNewCampaign] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const debounce = useRef();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (step !== 2) return;
    api.listCampaigns().then((r) => setCampaigns(r.campaigns)).catch(() => {});
    api.listFolders().then((r) => setFolders(r.folders)).catch(() => {});
  }, [step]);

  useEffect(() => {
    if (step !== 1) return;
    clearTimeout(debounce.current);
    const alias = form.alias.trim();
    if (!alias) { setAliasState({ status: 'idle', message: '' }); return; }
    setAliasState({ status: 'checking', message: 'Checking availability…' });
    debounce.current = setTimeout(async () => {
      try {
        const r = await api.checkAlias(alias);
        setAliasState(r.available ? { status: 'ok', message: 'Available' } : { status: 'bad', message: r.reason || 'Unavailable' });
      } catch (e) {
        setAliasState({ status: 'bad', message: e.message });
      }
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [form.alias, step]);

  function next() {
    if (!form.destinationUrl.trim()) return setWarnings([{ field: 'destinationUrl', message: 'Destination URL is required' }]);
    if (aliasState.status === 'bad') return setWarnings([{ field: 'alias', message: aliasState.message }]);
    setWarnings([]);
    setStep(2);
  }

  useEffect(() => {
    if (step !== 2) return;
    api.validateLink({ destinationUrl: form.destinationUrl, alias: form.alias.trim() || null, title: form.title })
      .then((r) => setWarnings(r.warnings || []))
      .catch(() => {});
  }, [step]);

  async function addCampaign() {
    if (!newCampaign.trim()) return;
    try {
      const r = await api.createCampaign({ name: newCampaign.trim() });
      setCampaigns([...campaigns, { ...r.campaign, link_count: 0, clicks: 0 }]);
      setForm({ ...form, campaignId: r.campaign.id });
      setNewCampaign('');
    } catch (e) {
      setWarnings((w) => [...w, { field: 'campaign', message: e.message }]);
    }
  }

  async function addFolder() {
    if (!newFolder.trim()) return;
    try {
      const r = await api.createFolder({ name: newFolder.trim() });
      setFolders([...folders, { ...r.folder, link_count: 0 }]);
      setForm({ ...form, folderId: r.folder.id });
      setNewFolder('');
    } catch (e) {
      setWarnings((w) => [...w, { field: 'folder', message: e.message }]);
    }
  }

  async function publish() {
    setBusy(true);
    setWarnings([]);
    const dev = pickDeviceRules(form);
    if (dev.error) {
      setBusy(false);
      setWarnings([{ field: 'deviceRules', message: dev.error }]);
      return;
    }
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const r = await api.createLink({
        destinationUrl: form.destinationUrl.trim(),
        alias: form.alias.trim() || null,
        title: form.title.trim() || null,
        tags: tags.length ? tags : undefined,
        campaignId: form.campaignId || null,
        folderId: form.folderId || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        maxClicks: form.maxClicks ? Number(form.maxClicks) : null,
        password: form.password || null,
        deviceRules: dev.rules || undefined,
      });
      setCreated(r.link);
    } catch (e) {
      setWarnings(e.details?.map((d) => ({ field: d.field, message: d.message })) || [{ field: '_', message: e.message }]);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const url = shortUrl(created.short_code);
    const devRules = (() => { try { return typeof created.device_rules === 'string' ? JSON.parse(created.device_rules) : (created.device_rules || {}); } catch { return {}; } })();
    const devCount = ['ios', 'android', 'desktop'].filter((k) => devRules[k]).length;
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center pt-8">
        <div className="inline-flex rounded-2xl border border-[#F88F22]/30 bg-[#F88F22]/10 p-4 shadow-lg shadow-[#EA6113]/20">
          <SparkleIcon className="h-8 w-8 text-[#FBB931]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Your Short Link is Live</h1>
          <p className="text-xs text-amber-200/60 mt-1">Ready to share, redirect, and collect telemetry data.</p>
        </div>

        <div className="card space-y-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/60">Public Short URL</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={url} target="_blank" rel="noreferrer" className="break-all font-mono text-lg font-bold text-[#FBB931] hover:text-[#FFE3B3] hover:underline">
              {url}
            </a>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                copied
                  ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                  : 'btn-ghost'
              }`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {}
              }}
            >
              {copied ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>

          {(devCount || created.password_hash || created.expires_at || created.max_clicks) && (
            <div className="mt-2 flex flex-wrap justify-center gap-2 pt-2 border-t border-zinc-800">
              {created.password_hash && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                  <LockIcon className="h-3 w-3" /> Password Protected
                </span>
              )}
              {created.expires_at && (
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-[#121212] px-2.5 py-0.5 text-[11px] font-medium text-amber-200/60">
                  <ClockIcon className="h-3 w-3" /> Expires: {new Date(created.expires_at).toLocaleDateString()}
                </span>
              )}
              {created.max_clicks && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#F88F22]/30 bg-[#F88F22]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FBB931]">
                  <ChartIcon className="h-3 w-3" /> Cap: {created.max_clicks} clicks
                </span>
              )}
              {devCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#F88F22]/30 bg-[#F88F22]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FBB931]">
                  <DeviceIcon className="h-3 w-3" /> {devCount} Device Rules
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button className="btn-primary" onClick={() => nav(`/links/${created.id}?tab=analytics`)}>
            View Link Telemetry
          </button>
          <button className="btn-ghost" onClick={() => { setCreated(null); setForm(EMPTY_FORM); setStep(1); }}>
            Create Another Link
          </button>
        </div>
      </div>
    );
  }

  const warnFor = (field) => warnings.filter((w) => w.field === field);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header and Step Indicator */}
      <div className="border-b border-zinc-800/80 pb-4 sm:pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Create Short Link</h1>
        <p className="text-xs text-amber-200/60 mt-0.5 sm:mt-1">Configure your destination target, custom slug, and routing protocols.</p>

        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
            step >= 1
              ? 'border border-[#F88F22]/30 bg-[#F88F22]/10 text-[#FBB931] font-semibold'
              : 'text-amber-200/40'
          }`}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#EA6113] text-[10px] text-white">1</span>
            <span>Target & Slug</span>
          </span>
          <span className="text-zinc-500">→</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
            step >= 2
              ? 'border border-[#F88F22]/30 bg-[#F88F22]/10 text-[#FBB931] font-semibold'
              : 'text-amber-200/40'
          }`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${step >= 2 ? 'bg-[#EA6113] text-white' : 'bg-[#121212] text-amber-200/50'}`}>2</span>
            <span>Settings & Rules</span>
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <label className="label">Destination URL *</label>
            <input
              className="input"
              placeholder="https://example.com/target-landing-page"
              value={form.destinationUrl}
              onChange={set('destinationUrl')}
              autoFocus
            />
            {warnFor('destinationUrl').map((w, i) => (
              <p key={i} className="mt-1.5 text-xs text-rose-400">{w.message}</p>
            ))}
          </div>

          <div>
            <label className="label">Custom Alias / Slug (Optional)</label>
            <div className="relative">
              <input
                className="input pr-28"
                placeholder="summer-promo"
                value={form.alias}
                onChange={set('alias')}
              />
              {aliasState.message && (
                <span className={`absolute right-3 top-2.5 text-xs font-medium ${
                  aliasState.status === 'ok'
                    ? 'text-emerald-400'
                    : aliasState.status === 'bad'
                    ? 'text-rose-400'
                    : 'text-zinc-400'
                }`}>
                  {aliasState.message}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              3–32 characters (alphanumeric, hyphens or underscores). Leave blank to auto-generate a random code.
            </p>
          </div>

          {warnFor('alias').map((w, i) => (
            <p key={i} className="text-xs text-rose-400">{w.message}</p>
          ))}

          <button className="btn-primary w-full py-2.5 text-xs font-semibold" onClick={next}>
            Continue to Advanced Settings →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <div>
            <label className="label">Internal Link Title (Optional)</label>
            <input
              className="input"
              placeholder="Q4 Product Launch Announcement"
              value={form.title}
              onChange={set('title')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Campaign Group</label>
              <select className="input text-xs" value={form.campaignId} onChange={set('campaignId')}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  className="input text-xs"
                  placeholder="Create campaign…"
                  value={newCampaign}
                  onChange={(e) => setNewCampaign(e.target.value)}
                />
                <button type="button" className="btn-ghost text-xs whitespace-nowrap" onClick={addCampaign}>
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="label">Folder Workspace</label>
              <select className="input text-xs" value={form.folderId} onChange={set('folderId')}>
                <option value="">— None —</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  className="input text-xs"
                  placeholder="Create folder…"
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                />
                <button type="button" className="btn-ghost text-xs whitespace-nowrap" onClick={addFolder}>
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input text-xs" placeholder="social, marketing, twitter" value={form.tags} onChange={set('tags')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Expiration Timestamp (Optional)</label>
              <input type="datetime-local" className="input text-xs" value={form.expiresAt} onChange={set('expiresAt')} />
              <p className="mt-1 text-[11px] text-zinc-500">Redirects will expire after this time.</p>
            </div>
            <div>
              <label className="label">Click Limit (Optional)</label>
              <input type="number" min="1" className="input text-xs" placeholder="e.g. 500" value={form.maxClicks} onChange={set('maxClicks')} />
              <p className="mt-1 text-[11px] text-zinc-500">Deactivates after reaching this count.</p>
            </div>
          </div>

          <div>
            <label className="label">Passcode Protection (Optional)</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input text-xs pr-10"
                placeholder="Require visitors to enter a password"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-md text-amber-200/40 hover:text-[#FBB931] hover:bg-[#F88F22]/10 transition-all duration-150 active:scale-90"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Device Targeting Section */}
          <details className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DeviceIcon className="h-4 w-4 text-[#FBB931]" />
                <span>Device-Specific Routing</span>
              </span>
              {(form.ios || form.android || form.desktop) && (
                <span className="rounded-full bg-[#F88F22]/20 px-2 py-0.5 text-[10px] font-medium text-[#FFE3B3]">
                  Active
                </span>
              )}
            </summary>
            <p className="mt-2 text-xs text-amber-200/60">
              Route visitors to specific destinations according to their device operating system.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs">
              <div>
                <label className="label">iOS (Apple)</label>
                <input className="input text-xs" placeholder="https://apps.apple.com/…" value={form.ios} onChange={set('ios')} />
              </div>
              <div>
                <label className="label">Android OS</label>
                <input className="input text-xs" placeholder="https://play.google.com/…" value={form.android} onChange={set('android')} />
              </div>
              <div>
                <label className="label">Desktop</label>
                <input className="input text-xs" placeholder="https://site.com/desktop" value={form.desktop} onChange={set('desktop')} />
              </div>
            </div>
            {warnFor('deviceRules').map((w, i) => (
              <p key={i} className="mt-2 text-xs text-rose-400">{w.message}</p>
            ))}
          </details>

          {/* Configuration Summary Card */}
          <div className="rounded-xl border border-zinc-800 bg-[#080808] p-3.5 sm:p-4 text-xs space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/60 block mb-2">Configuration Summary</span>
            <div className="flex justify-between gap-2"><span className="text-amber-200/40 shrink-0">Destination:</span> <span className="font-mono text-[#FFE3B3] truncate max-w-[170px] sm:max-w-[260px]">{form.destinationUrl}</span></div>
            <div className="flex justify-between gap-2"><span className="text-amber-200/40 shrink-0">Short Code:</span> <span className="font-mono text-[#FBB931]">{form.alias.trim() || 'Auto-generated'}</span></div>
            {form.campaignId && <div className="flex justify-between gap-2"><span className="text-amber-200/40 shrink-0">Campaign:</span> <span className="text-amber-200/80 truncate">{campaigns.find((c) => c.id === form.campaignId)?.name}</span></div>}
            {form.folderId && <div className="flex justify-between gap-2"><span className="text-amber-200/40 shrink-0">Folder:</span> <span className="text-amber-200/80 truncate">{folders.find((f) => f.id === form.folderId)?.name}</span></div>}
            {form.expiresAt && <div className="flex justify-between gap-2"><span className="text-amber-200/40 shrink-0">Expires:</span> <span className="text-amber-200/80">{form.expiresAt.replace('T', ' ')}</span></div>}
            {form.maxClicks && <div className="flex justify-between gap-2"><span className="text-amber-200/40 shrink-0">Click Cap:</span> <span className="text-amber-200/80">{form.maxClicks} clicks</span></div>}
            {form.password && <div className="flex justify-between gap-2"><span className="text-amber-200/40 shrink-0">Protection:</span> <span className="text-amber-400 font-medium">Password Protected</span></div>}
          </div>

          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <span className="font-semibold block mb-1">Validation Notice:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {warnings.map((w, i) => <li key={i}>{w.field}: {w.message}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button className="btn-ghost" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              className="btn-primary flex-1"
              onClick={publish}
              disabled={busy || warnings.filter((w) => w.field !== 'campaign' && w.field !== 'folder').length > 0}
            >
              {busy ? 'Creating Link…' : 'Publish Short Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
