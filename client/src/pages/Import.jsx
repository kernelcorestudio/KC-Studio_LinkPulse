// Bulk CSV import: choose/paste a CSV -> preview rows with errors ->
// import only the valid rows -> download error report (Sleek Dark SaaS).
import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Link } from 'react-router-dom';
import { api, shortUrl } from '../lib/api';
import { ImportIcon } from '../components/Icons';

const SAMPLE = `url,alias,title
https://example.com/summer,summer24,Summer Sale
https://wikipedia.org/wiki/Haldwani,,Haldwani wiki
not-a-url,bad!alias,Broken row`;

function normalizeRow(obj, i) {
  const get = (...keys) => {
    for (const k of keys) {
      const hit = Object.keys(obj).find((h) => h.trim().toLowerCase() === k);
      if (hit && obj[hit] != null) return String(obj[hit]).trim();
    }
    return '';
  };
  return {
    line: i + 2,
    url: get('url', 'destinationurl', 'destination', 'link', 'target'),
    alias: get('alias', 'code', 'shortcode', 'short_code') || null,
    title: get('title', 'name') || null,
  };
}

export default function Import() {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function parse(raw) {
    setText(raw);
    setResult(null);
    setPreview(null);
    if (!raw.trim()) { setRows(null); setParseError(''); return; }
    const p = Papa.parse(raw, { header: true, skipEmptyLines: 'greedy' });
    if (p.errors.length && !p.data.length) {
      setParseError(p.errors[0].message);
      setRows(null);
      return;
    }
    setParseError('');
    setRows(p.data.map(normalizeRow).filter((r) => r.url || r.alias || r.title));
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => parse(String(reader.result || ''));
    reader.readAsText(f);
  }

  async function doPreview() {
    setBusy(true); setErr('');
    try {
      setPreview(await api.importPreview(rows));
      setResult(null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  async function doImport() {
    if (!confirm(`Import ${validCount} valid row(s)? Invalid rows will be skipped.`)) return;
    setBusy(true); setErr('');
    try {
      setResult(await api.importRows(rows));
      setPreview(null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const validCount = useMemo(() => preview?.summary.valid ?? 0, [preview]);

  function downloadErrors() {
    if (!result?.failed?.length) return;
    const csv = Papa.unparse([
      ['line', 'url', 'alias', 'reason'],
      ...result.failed.map((f) => [f.line, f.url, f.alias || '', f.reason]),
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'linkpulse-import-errors.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4 sm:pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ImportIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#FBB931]" />
          <span>Bulk Import</span>
        </h1>
        <p className="text-xs text-amber-200/60 mt-0.5 sm:mt-1">
          Upload a CSV file or paste raw rows with a <code className="text-[#FBB931] font-mono">url</code> column (optional: <code className="text-[#FBB931] font-mono">alias</code>, <code className="text-[#FBB931] font-mono">title</code>). Up to 500 links per batch.
        </p>
      </div>

      {!rows && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <label className="btn-primary cursor-pointer text-xs py-2 px-3.5 text-center">
              <span>Choose CSV File</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            </label>
            <span className="text-xs text-zinc-500 text-center sm:text-left">or paste CSV records directly:</span>
            <button className="btn-ghost text-xs py-2 px-3.5 sm:ml-auto" onClick={() => parse(SAMPLE)}>
              Load Sample CSV
            </button>
          </div>
          <textarea
            className="input h-48 font-mono text-xs leading-relaxed"
            placeholder={SAMPLE}
            value={text}
            onChange={(e) => parse(e.target.value)}
          />
          {parseError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
              CSV Parsing Error: {parseError}
            </div>
          )}
        </div>
      )}

      {rows && !result && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">{rows.length} rows parsed</span>
              <button
                className="btn-ghost text-xs py-1 px-2.5 text-zinc-400"
                onClick={() => { setRows(null); setPreview(null); setText(''); }}
              >
                Clear Buffer
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-xs py-1.5 px-3" onClick={doPreview} disabled={busy || !rows.length}>
                {busy && !preview ? 'Scanning…' : 'Scan & Validate'}
              </button>
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={doImport}
                disabled={busy || !preview || !validCount}
              >
                {busy && preview ? 'Importing…' : `Import ${preview ? `${validCount} Valid` : ''}`}
              </button>
            </div>
          </div>

          {!preview && (
            <p className="text-xs text-zinc-400">
              Click "Scan & Validate" to check for alias collisions and URL formatting before importing.
            </p>
          )}

          {err && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
              {err}
            </div>
          )}

          {preview && (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold uppercase text-zinc-400">
                      <th className="py-2.5 px-3">Row</th>
                      <th className="px-3">Destination</th>
                      <th className="px-3">Alias</th>
                      <th className="px-3">Title</th>
                      <th className="px-3">Status</th>
                      <th className="px-3">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                    {preview.results.map((r) => (
                      <tr key={r.line} className="hover:bg-[#121214]">
                        <td className="py-2 px-3 text-zinc-500">{r.line}</td>
                        <td className="max-w-[240px] truncate px-3 text-amber-200/80">{r.url || '—'}</td>
                        <td className="px-3 text-[#FBB931]">{r.alias || 'auto'}</td>
                        <td className="max-w-[160px] truncate px-3 text-amber-200/60">{r.title || ''}</td>
                        <td className="px-3 font-sans">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.valid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {r.valid ? 'Valid' : 'Invalid'}
                          </span>
                        </td>
                        <td className="px-3 text-rose-400 font-sans">{r.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-zinc-800 p-3 text-xs text-zinc-400 bg-zinc-900/60 flex justify-between">
                <span>Summary: {preview.summary.valid} valid links, {preview.summary.invalid} rejected.</span>
                <span>Only valid links will be committed.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-semibold text-emerald-400">Batch Ingestion Completed</h2>
            <div className="mt-2 flex gap-4 text-xs font-mono">
              <span className="text-emerald-400 font-bold">+{result.importedCount} Imported Successfully</span>
              {result.failedCount > 0 && <span className="text-rose-400 font-bold">-{result.failedCount} Skipped</span>}
            </div>
          </div>

          {result.imported.length > 0 && (
            <ul className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs font-mono">
              {result.imported.map((l) => (
                <li key={l.id} className="flex items-center gap-2">
                  <Link className="font-semibold text-[#FBB931] hover:underline" to={`/links/${l.id}`}>
                    {shortUrl(l.short_code)}
                  </Link>
                  <span className="text-amber-900/60">→</span>
                  <span className="truncate text-amber-200/70 max-w-sm">{l.destination_url}</span>
                </li>
              ))}
            </ul>
          )}

          {result.failed.length > 0 && (
            <div className="space-y-2">
              <details className="text-xs rounded-lg border border-rose-500/30 bg-rose-950/10 p-3" open>
                <summary className="cursor-pointer font-semibold text-rose-400">
                  Skipped Records ({result.failed.length})
                </summary>
                <ul className="mt-2 space-y-1 font-mono text-zinc-400 text-[11px]">
                  {result.failed.map((f) => (
                    <li key={f.line}>
                      Row {f.line}: {f.url || '(empty)'} — <span className="text-rose-300">{f.reason}</span>
                    </li>
                  ))}
                </ul>
              </details>
              <button className="btn-ghost text-xs py-1.5 px-3" onClick={downloadErrors}>
                Download Error Report (.csv)
              </button>
            </div>
          )}

          <button className="btn-primary" onClick={() => { setResult(null); setRows(null); setText(''); }}>
            Import Another Batch
          </button>
        </div>
      )}
    </div>
  );
}
