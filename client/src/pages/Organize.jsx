// Organize: manage tags and folders. Both list the matching links in one click (Sleek Dark SaaS).
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Spinner, EmptyState, ErrorState } from '../components/ui';
import { TagIcon, FolderIcon } from '../components/Icons';

function useCollection(fetcher) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    fetcher().then(setItems).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return { items, error, load, setError };
}

function RenameRow({ item, onSave, onCancel }) {
  const [name, setName] = useState(item.name);
  return (
    <div className="flex flex-1 items-center gap-2">
      <input className="input py-1 text-xs" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <button className="btn-primary text-xs py-1 px-3" onClick={() => onSave(name.trim())}>Save</button>
      <button className="btn-ghost text-xs py-1 px-3" onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default function Organize() {
  const tags = useCollection(() => api.listTags().then((r) => r.tags));
  const folders = useCollection(() => api.listFolders().then((r) => r.folders));
  const [newFolder, setNewFolder] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function createFolder(e) {
    e.preventDefault();
    if (!newFolder.trim()) return;
    setBusy(true);
    try {
      await api.createFolder({ name: newFolder.trim() });
      setNewFolder('');
      folders.load();
    } catch (err) {
      folders.setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(name) {
    const { kind, id } = editing;
    if (!name) return;
    setBusy(true);
    try {
      if (kind === 'tag') await api.renameTag(id, { name });
      else await api.renameFolder(id, { name });
      setEditing(null);
      tags.load();
      folders.load();
    } catch (err) {
      (kind === 'tag' ? tags : folders).setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(kind, item) {
    if (!confirm(`Delete ${kind} "${item.name}"? Links are kept${kind === 'tag' ? ' (the tag is just unassigned)' : ' and become unfiled'}.`)) return;
    try {
      if (kind === 'tag') await api.deleteTag(item.id);
      else await api.deleteFolder(item.id);
      tags.load();
      folders.load();
    } catch (err) {
      (kind === 'tag' ? tags : folders).setError(err.message);
    }
  }

  const { items: tagList, error: tagErr } = tags;
  const { items: folderList, error: folderErr } = folders;
  if ((tagErr || folderErr) && !tagList && !folderList) {
    return <ErrorState message={tagErr || folderErr} onRetry={() => { tags.load(); folders.load(); }} />;
  }
  if (!tagList || !folderList) return <Spinner label="Loading organization structure…" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4 sm:pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Tags & Folders</h1>
        <p className="text-xs text-zinc-400 mt-0.5 sm:mt-1">
          Structure and categorize your link collection with flexible tags and folders.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tags Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80 flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-[#FBB931]" />
              <span>Tags</span>
            </h2>
            <span className="text-xs font-mono text-amber-200/60">{tagList.length} tags</span>
          </div>

          {tagList.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500">
              No tags configured yet. Add tags directly when creating short links.
            </p>
          )}

          <div className="space-y-2">
            {tagList.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#080808] p-3 text-xs transition hover:border-[#F88F22]/40"
              >
                {editing?.kind === 'tag' && editing.id === t.id ? (
                  <RenameRow item={t} onSave={saveRename} onCancel={() => setEditing(null)} />
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center rounded-full border border-[#F88F22]/30 bg-[#F88F22]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#FBB931]">
                        #{t.name}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">{t.link_count} links</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link className="btn-ghost text-xs py-1 px-2.5" to={`/links?tagId=${t.id}`}>
                        Links
                      </Link>
                      <button
                        className="btn-ghost text-xs py-1 px-2.5"
                        onClick={() => setEditing({ kind: 'tag', id: t.id, name: t.name })}
                      >
                        Rename
                      </button>
                      <button
                        className="btn-ghost text-xs py-1 px-2 text-rose-400 hover:text-rose-300"
                        onClick={() => remove('tag', t)}
                        title="Delete tag"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {tagErr && <p className="text-xs text-rose-400">{tagErr}</p>}
        </div>

        {/* Folders Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80 flex items-center gap-2">
              <FolderIcon className="h-4 w-4 text-[#FBB931]" />
              <span>Folders</span>
            </h2>
            <span className="text-xs font-mono text-amber-200/60">{folderList.length} folders</span>
          </div>

          <form className="flex gap-2" onSubmit={createFolder}>
            <input
              className="input text-xs py-2 flex-1 min-w-0"
              placeholder="New folder name…"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
            />
            <button className="btn-primary text-xs whitespace-nowrap" disabled={busy}>
              + Add Folder
            </button>
          </form>

          {folderList.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500">
              No folders created yet. Folders help you organize links by client or project.
            </p>
          )}

          <div className="space-y-2">
            {folderList.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#080808] p-3 text-xs transition hover:border-[#F88F22]/40"
              >
                {editing?.kind === 'folder' && editing.id === f.id ? (
                  <RenameRow item={f} onSave={saveRename} onCancel={() => setEditing(null)} />
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderIcon className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-200 truncate">{f.name}</span>
                      <span className="text-[11px] font-mono text-zinc-500 shrink-0">({f.link_count})</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link className="btn-ghost text-xs py-1 px-2.5" to={`/links?folderId=${f.id}`}>
                        Links
                      </Link>
                      <button
                        className="btn-ghost text-xs py-1 px-2.5"
                        onClick={() => setEditing({ kind: 'folder', id: f.id, name: f.name })}
                      >
                        Rename
                      </button>
                      <button
                        className="btn-ghost text-xs py-1 px-2 text-rose-400 hover:text-rose-300"
                        onClick={() => remove('folder', f)}
                        title="Delete folder"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {folderErr && <p className="text-xs text-rose-400">{folderErr}</p>}
        </div>
      </div>
    </div>
  );
}
