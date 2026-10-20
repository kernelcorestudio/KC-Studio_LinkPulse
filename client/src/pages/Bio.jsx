// Bio pages: manage public link-in-bio landing pages (/bio/<slug>) (Sleek Dark SaaS).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, bioUrl, shortUrl } from '../lib/api';
import { Spinner, ErrorState, EmptyState } from '../components/ui';
import { BioIcon } from '../components/Icons';

const THEMES = [
  ['dark', 'Obsidian Dark'],
  ['light', 'Clean Light'],
  ['brand', 'Electric Indigo'],
  ['sunset', 'Sunset Glow'],
  ['ocean', 'Deep Ocean'],
];

const emptyForm = { slug: '', title: '', bio: '', theme: 'brand' };

export default function Bio() {
  const [pages, setPages] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await api.listBio();
      setPages(r.pages);
      setSelectedId((cur) => cur || r.pages[0]?.id || '');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(() => (pages || []).find((p) => p.id === selectedId), [pages, selectedId]);

  useEffect(() => {
    if (selected) setForm({ slug: selected.slug, title: selected.title || '', bio: selected.bio || '', theme: selected.theme || 'dark' });
  }, [selected?.id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function create() {
    if (!form.slug.trim()) { setMsg({ kind: 'err', text: 'A slug is required' }); return; }
    setBusy(true);
    try {
      const r = await api.createBio({
        slug: form.slug.trim().toLowerCase(),
        title: form.title.trim() || null,
        bio: form.bio.trim() || null,
        theme: form.theme,
      });
      setCreating(false);
      setMsg({ kind: 'ok', text: `Bio page created successfully and available at ${bioUrl(r.page.slug)}` });
      await load();
      setSelectedId(r.page.id);
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(page) {
    if (!window.confirm(`Delete bio page /${page.slug}? The links themselves will stay.`)) return;
    try {
      await api.deleteBio(page.id);
      setSelectedId('');
      setMsg(null);
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!pages) return <Spinner label="Loading bio pages…" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BioIcon className="h-6 w-6 text-indigo-400" />
            <span>Link-in-Bio Pages</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build mobile-optimized profile landing pages for social channels and bio links.
          </p>
        </div>
        <button
          className="btn-primary text-xs py-2 px-3.5"
          onClick={() => { setCreating(true); setForm(emptyForm); setMsg(null); }}
        >
          + Create Bio Page
        </button>
      </div>

      {msg && (
        <div className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium ${msg.kind === 'ok' ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border-rose-500/30 bg-rose-950/20 text-rose-300'}`}>
          {msg.text}
        </div>
      )}

      {creating && (
        <div className="card space-y-4">
          <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-semibold text-white">Create New Bio Profile</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Page Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">/bio/</span>
                <input className="input font-mono text-xs" placeholder="my-brand" value={form.slug} onChange={set('slug')} />
              </div>
            </div>
            <div>
              <label className="label">Visual Theme</label>
              <select className="input text-xs" value={form.theme} onChange={set('theme')}>
                {THEMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Profile Title</label>
              <input className="input text-xs" placeholder="Ada Lovelace" value={form.title} onChange={set('title')} />
            </div>
            <div>
              <label className="label">Bio Description</label>
              <input className="input text-xs" placeholder="Lead researcher and software operator" value={form.bio} onChange={set('bio')} />
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button className="btn-ghost text-xs" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn-primary text-xs" disabled={busy} onClick={create}>
              {busy ? 'Creating…' : 'Create Profile'}
            </button>
          </div>
        </div>
      )}

      {!pages.length && !creating && (
        <EmptyState title="No bio profiles configured" hint="Create your first bio page to showcase your links in one link-in-bio hub." />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Bio pages list */}
        <div className="space-y-3">
          {pages.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-4 transition cursor-pointer ${
                selectedId === p.id
                  ? 'border-indigo-500/50 bg-[#14141c] shadow-lg shadow-indigo-500/10'
                  : 'border-white/[0.08] bg-[#0e0f12] hover:border-white/[0.16]'
              }`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm text-indigo-400">/{p.slug}</p>
                  <p className="truncate text-xs text-zinc-400 mt-0.5">{p.title || 'Untitled Bio'}</p>
                </div>
                <a
                  href={bioUrl(p.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-zinc-400 hover:text-white transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  View ↗
                </a>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>{p.link_count} links</span>
                <span>·</span>
                <span>{Number(p.clicks).toLocaleString()} link clicks</span>
                <span>·</span>
                <span>{Number(p.bio_clicks).toLocaleString()} views</span>
              </div>
              <button
                className="mt-2 text-[11px] text-rose-400 hover:text-rose-300 transition"
                onClick={(e) => { e.stopPropagation(); remove(p); }}
              >
                Delete page
              </button>
            </div>
          ))}
        </div>

        {/* Right: Bio editor */}
        <div className="lg:col-span-2">
          {selected ? (
            <Editor key={selected.id} pageId={selected.id} onSaved={load} />
          ) : (
            <EmptyState title="Select a bio page" hint="Choose a bio page on the left to edit its links, colors, and layout." />
          )}
        </div>
      </div>
    </div>
  );
}

function Editor({ pageId, onSaved }) {
  const [page, setPage] = useState(null);
  const [form, setForm] = useState({ slug: '', title: '', bio: '', theme: 'dark' });
  const [rows, setRows] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getBio(pageId)
      .then((r) => {
        if (!alive) return;
        setPage(r.page);
        setForm({ slug: r.page.slug, title: r.page.title || '', bio: r.page.bio || '', theme: r.page.theme || 'dark' });
        setRows(r.page.links || []);
        setOrderDirty(false);
      })
      .catch((e) => setMsg({ kind: 'err', text: e.message }));
    return () => { alive = false; };
  }, [pageId]);

  useEffect(() => {
    api.listLinks('?limit=100').then((r) => setAllLinks(r.links)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const available = useMemo(() => {
    const inPage = new Set(rows.map((r) => r.id));
    const q = search.trim().toLowerCase();
    return allLinks
      .filter((l) => !inPage.has(l.id))
      .filter((l) => !q || l.short_code.toLowerCase().includes(q) || (l.title || '').toLowerCase().includes(q) || l.destination_url.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allLinks, rows, search]);

  function addLink(l) {
    setRows([...rows, { id: l.id, short_code: l.short_code, title: l.title, destination_url: l.destination_url, label: '' }]);
    setOrderDirty(true);
  }

  function move(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    setOrderDirty(true);
  }

  function removeAt(i) {
    setRows(rows.filter((_, j) => j !== i));
    setOrderDirty(true);
  }

  async function saveAll() {
    setBusy(true);
    setMsg(null);
    try {
      await api.updateBio(page.id, {
        slug: form.slug.trim().toLowerCase(),
        title: form.title.trim() || null,
        bio: form.bio.trim() || null,
        theme: form.theme,
      });
      await api.setBioLinks(page.id, rows.map((r) => ({ linkId: r.id, label: r.label?.trim() || null })));
      setMsg({ kind: 'ok', text: 'Changes saved and live immediately.' });
      onSaved();
    } catch (e) {
      setMsg({ kind: 'err', text: e.details?.map((d) => d.message).join('; ') || e.message });
    } finally {
      setBusy(false);
    }
  }

  if (!page) return <Spinner label="Loading page details…" />;
  const slugChanged = form.slug.trim().toLowerCase() !== page.slug;

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-semibold text-white">Edit Profile /{page.slug}</h3>
        <a
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
          href={bioUrl(page.slug)}
          target="_blank"
          rel="noreferrer"
        >
          Open Public Bio Page ↗
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Custom Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">/bio/</span>
            <input className="input font-mono text-xs" value={form.slug} onChange={set('slug')} />
          </div>
          {slugChanged && <p className="mt-1 text-[11px] text-amber-400">Notice: Changing slug will invalidate old links to this page.</p>}
        </div>
        <div>
          <label className="label">Visual Theme</label>
          <select className="input text-xs" value={form.theme} onChange={set('theme')}>
            {THEMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Profile Header Title</label>
          <input className="input text-xs" placeholder="Your name or company" value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className="label">Profile Bio Text</label>
          <input className="input text-xs" maxLength={280} placeholder="A short description of what you do" value={form.bio} onChange={set('bio')} />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="label">Featured Links (Ordered Top to Bottom)</label>
        {!rows.length && (
          <p className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800 rounded-lg">
            No links added to this bio yet. Add links using the search bar below.
          </p>
        )}
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex flex-col gap-1">
                <button
                  className="text-xs text-zinc-400 hover:text-white disabled:opacity-30"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  className="text-xs text-zinc-400 hover:text-white disabled:opacity-30"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  title="Move down"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <input
                  className="input py-1 text-xs"
                  placeholder={r.title || `/${r.short_code}`}
                  value={r.label || ''}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <p className="mt-1 truncate text-[11px] text-zinc-500 font-mono">
                  <span className="text-indigo-400 font-medium">{shortUrl(r.short_code).replace(/^https?:\/\//, '')}</span> · {r.destination_url}
                </p>
              </div>
              <button className="text-xs text-rose-400 hover:text-rose-300 ml-2" onClick={() => removeAt(i)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <label className="label">Add Existing Links to Bio</label>
        <input
          className="input text-xs"
          placeholder="Search your links by short code, title, or target URL…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {available.map((l) => (
            <button key={l.id} className="btn-ghost text-xs py-1 px-2.5" onClick={() => addLink(l)}>
              + /{l.short_code}{l.title ? ` · ${l.title.slice(0, 24)}` : ''}
            </button>
          ))}
          {!available.length && <p className="text-xs text-zinc-500">All available links already attached.</p>}
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-3 py-2 text-xs font-medium ${msg.kind === 'ok' ? 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border border-rose-500/30 bg-rose-950/20 text-rose-300'}`}>
          {msg.text}
        </div>
      )}

      <button className="btn-primary" disabled={busy} onClick={saveAll}>
        {busy ? 'Saving changes…' : orderDirty ? 'Save Profile (Order Changed)' : 'Save Profile'}
      </button>
    </div>
  );
}
