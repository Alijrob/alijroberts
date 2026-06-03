import { useState, useEffect, useCallback } from 'react';

const GOLD = '#c9a840';
const NAVY = '#1c2866';

export type Bucket = 'library' | 'lab' | 'fixes';

interface Prompt {
  id: number;
  bucket: string;
  name: string;
  description: string;
  content?: string;
  status: string;
  trigger: string;
  folder_id: number | null;
  updated_at: string;
}

interface Folder {
  id: number;
  name: string;
}

interface BucketConfig {
  title: string;
  subtitle: string;
  addLabel: string;
  namePlaceholder: string;
  nameLabel: string;
  contentLabel: string;
  contentPlaceholder: string;
  emptyText: string;
  showTrigger: boolean;
  triggerLabel: string;
  triggerPlaceholder: string;
  showStatus: boolean;
  showPromote: boolean;
}

const LAB_STATUSES = ['draft', 'testing', 'ready'];

const CONFIG: Record<Bucket, BucketConfig> = {
  library: {
    title: 'Prompt Library',
    subtitle: 'Finished, reusable prompts',
    addLabel: '+ Prompt',
    namePlaceholder: 'Prompt name…',
    nameLabel: 'Name',
    contentLabel: 'Prompt',
    contentPlaceholder: 'The full prompt text. Paste the prompt you want to reuse here.',
    emptyText: 'Select a prompt, or click + Prompt to add one',
    showTrigger: false,
    triggerLabel: '',
    triggerPlaceholder: '',
    showStatus: false,
    showPromote: false,
  },
  lab: {
    title: 'Prompt Lab',
    subtitle: 'Draft, test, and refine',
    addLabel: '+ Draft',
    namePlaceholder: 'Draft name…',
    nameLabel: 'Name',
    contentLabel: 'Draft prompt',
    contentPlaceholder: 'Work in progress. Iterate here, then promote to the Library when it is ready.',
    emptyText: 'Select a draft, or click + Draft to start one',
    showTrigger: false,
    triggerLabel: '',
    triggerPlaceholder: '',
    showStatus: true,
    showPromote: true,
  },
  fixes: {
    title: 'Prompt Fixes',
    subtitle: 'Problem → corrective fix',
    addLabel: '+ Fix',
    namePlaceholder: 'Fix title…',
    nameLabel: 'Fix title',
    contentLabel: 'Fix',
    contentPlaceholder: 'The corrective instruction to apply when the problem shows up.',
    emptyText: 'Select a fix, or click + Fix to add one',
    showTrigger: true,
    triggerLabel: 'Problem / symptom',
    triggerPlaceholder: 'What goes wrong that this fix addresses',
    showStatus: false,
    showPromote: false,
  },
};

export default function PromptCenter({ bucket }: { bucket: Bucket }) {
  const cfg = CONFIG[bucket];
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [view, setView] = useState<'read' | 'edit'>('read');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTrigger, setEditTrigger] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [collapsed, setCollapsed] = useState<Set<number | string>>(new Set());
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pr, fr] = await Promise.all([
        fetch(`/api/prompts?bucket=${bucket}`),
        fetch(`/api/prompt-folders?bucket=${bucket}`),
      ]);
      if (!pr.ok) throw new Error(String(pr.status));
      setPrompts(await pr.json());
      setFolders(fr.ok ? await fr.json() : []);
      setError(null);
    } catch {
      setError('Could not load this section.');
    }
  }, [bucket]);

  // Reload (and reset selection) whenever the bucket tab changes.
  useEffect(() => {
    setSelected(null);
    setCreating(false);
    setCreatingFolder(false);
    void load();
  }, [load]);

  async function select(p: Prompt) {
    const r = await fetch(`/api/prompts/${p.id}`);
    setSelected(await r.json());
    setView('read');
  }

  function startEdit() {
    if (!selected) return;
    setEditName(selected.name);
    setEditDesc(selected.description);
    setEditTrigger(selected.trigger ?? '');
    setEditStatus(selected.status || 'draft');
    setEditContent(selected.content ?? '');
    setView('edit');
  }

  function startEditFor(p: Prompt) {
    setSelected(p);
    setEditName(p.name);
    setEditDesc(p.description ?? '');
    setEditTrigger(p.trigger ?? '');
    setEditStatus(p.status || 'draft');
    setEditContent(p.content ?? '');
    setView('edit');
  }

  async function save() {
    if (!selected || !editName.trim()) return;
    setSaving(true);
    const r = await fetch(`/api/prompts/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDesc,
        content: editContent,
        trigger: cfg.showTrigger ? editTrigger : undefined,
        status: cfg.showStatus ? editStatus : undefined,
      }),
    });
    const updated = await r.json();
    setSelected(updated);
    setPrompts(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p).sort((a, z) => a.name.localeCompare(z.name)));
    setSaving(false);
    setView('read');
  }

  async function create() {
    if (!newName.trim()) return;
    const r = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket,
        name: newName.trim(),
        status: bucket === 'lab' ? 'draft' : 'active',
      }),
    });
    const p = await r.json();
    setPrompts(prev => [...prev, p].sort((a, z) => a.name.localeCompare(z.name)));
    setNewName('');
    setCreating(false);
    startEditFor(p);
  }

  async function createFolder() {
    if (!newFolder.trim()) return;
    const r = await fetch('/api/prompt-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket, name: newFolder.trim() }),
    });
    const f = await r.json();
    setFolders(prev => [...prev, f].sort((a, z) => a.name.localeCompare(z.name)));
    setNewFolder('');
    setCreatingFolder(false);
  }

  async function deleteFolder(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this folder? Its prompts stay and become ungrouped.')) return;
    await fetch(`/api/prompt-folders/${id}`, { method: 'DELETE' });
    setFolders(fs => fs.filter(f => f.id !== id));
    setPrompts(ps => ps.map(p => p.folder_id === id ? { ...p, folder_id: null } : p));
  }

  async function moveToFolder(prompt: Prompt, folderId: number | null) {
    const r = await fetch(`/api/prompts/${prompt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    });
    const updated = await r.json();
    setPrompts(ps => ps.map(p => p.id === updated.id ? { ...p, folder_id: updated.folder_id } : p));
    setSelected(sel => sel && sel.id === updated.id ? { ...sel, folder_id: updated.folder_id } : sel);
  }

  // Lab only: move a finished draft into the Library bucket. Folders are
  // bucket-scoped, so the prompt is ungrouped on the way over.
  async function promote() {
    if (!selected) return;
    if (!confirm('Promote this draft into the Prompt Library?')) return;
    await fetch(`/api/prompts/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: 'library', status: 'active', folder_id: null }),
    });
    setPrompts(ps => ps.filter(p => p.id !== selected.id));
    setSelected(null);
  }

  async function deletePrompt(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
    setPrompts(ps => ps.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function toggleCollapse(key: number | string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function fmt(s: string) {
    return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '5px',
    padding: '0.45rem 0.6rem', fontSize: '0.88rem', outline: 'none',
  };

  function promptRow(p: Prompt, indented: boolean) {
    const secondary = bucket === 'fixes' ? p.trigger : p.description;
    return (
      <div
        key={p.id}
        onClick={() => select(p)}
        onMouseEnter={() => setHoveredId(p.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          padding: '0.55rem 1rem',
          paddingLeft: indented ? '1.6rem' : '1rem',
          background: selected?.id === p.id ? `${GOLD}14` : hoveredId === p.id ? '#f3f4f6' : 'transparent',
          borderLeft: selected?.id === p.id ? `3px solid ${GOLD}` : '3px solid transparent',
          cursor: 'pointer', transition: 'background 0.1s',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.86rem', fontWeight: selected?.id === p.id ? 600 : 400, color: selected?.id === p.id ? NAVY : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            {bucket === 'lab' && p.status && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: NAVY, background: `${NAVY}14`, borderRadius: '4px', padding: '0.05rem 0.35rem', flexShrink: 0 }}>{p.status}</span>
            )}
          </div>
          {secondary && (
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{secondary}</div>
          )}
        </div>
        {hoveredId === p.id && (
          <button
            onClick={e => deletePrompt(p.id, e)}
            title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
          >✕</button>
        )}
      </div>
    );
  }

  const ungrouped = prompts.filter(p => p.folder_id == null);

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* List */}
      <div style={{ width: '260px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{cfg.title}</div>
            <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }}>{cfg.subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={() => { setCreatingFolder(v => !v); setNewFolder(''); setCreating(false); }}
              title="New folder"
              style={{ background: creatingFolder ? `${NAVY}14` : 'transparent', border: `1px solid ${creatingFolder ? NAVY : '#d1d5db'}`, borderRadius: '5px', padding: '0 0.5rem', height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: creatingFolder ? NAVY : '#6b7280', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >+ Folder</button>
            <button
              onClick={() => { setCreating(v => !v); setNewName(''); setCreatingFolder(false); }}
              title={cfg.addLabel}
              style={{ background: creating ? `${GOLD}22` : 'transparent', border: `1px solid ${creating ? GOLD : '#d1d5db'}`, borderRadius: '5px', padding: '0 0.5rem', height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: creating ? GOLD : '#6b7280', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >{cfg.addLabel}</button>
          </div>
        </div>

        {creatingFolder && (
          <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
            <input
              autoFocus
              value={newFolder}
              onChange={e => setNewFolder(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setCreatingFolder(false); }}
              placeholder="Folder name…"
              style={{ ...inputStyle, border: `1px solid ${NAVY}55` }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
              <button onClick={createFolder} style={{ flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>Create folder</button>
              <button onClick={() => setCreatingFolder(false)} style={{ flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {creating && (
          <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false); }}
              placeholder={cfg.namePlaceholder}
              style={{ ...inputStyle, border: `1px solid ${GOLD}88` }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
              <button onClick={create} style={{ flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>Create</button>
              <button onClick={() => setCreating(false)} style={{ flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0' }}>
          {error && <p style={{ fontSize: '0.78rem', color: '#ef4444', padding: '0.75rem 1rem', margin: 0 }}>{error}</p>}
          {!error && prompts.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }}>Nothing here yet. Click {cfg.addLabel}.</p>
          )}

          {folders.map(f => {
            const items = prompts.filter(p => p.folder_id === f.id);
            const open = !collapsed.has(f.id);
            return (
              <div key={f.id}>
                <div
                  onClick={() => toggleCollapse(f.id)}
                  onMouseEnter={() => setHoveredId(-f.id - 1000)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }}>▶</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: NAVY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#bbb' }}>{items.length}</span>
                  {hoveredId === -f.id - 1000 && (
                    <button onClick={e => deleteFolder(f.id, e)} title="Delete folder" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.75rem', padding: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}>✕</button>
                  )}
                </div>
                {open && items.length === 0 && (
                  <p style={{ fontSize: '0.72rem', color: '#c4c4c4', fontStyle: 'italic', margin: 0, padding: '0.15rem 1rem 0.4rem 1.6rem' }}>Empty</p>
                )}
                {open && items.map(p => promptRow(p, true))}
              </div>
            );
          })}

          {folders.length > 0 && ungrouped.length > 0 && (
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#aaa', padding: '0.5rem 1rem 0.25rem' }}>Ungrouped</div>
          )}
          {(folders.length > 0 ? ungrouped : prompts).map(p => promptRow(p, false))}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{cfg.emptyText}</p>
          </div>
        )}

        {selected && view === 'read' && (
          <>
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '1rem' }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{selected.name}</span>
                  {cfg.showStatus && selected.status && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: GOLD, background: `${GOLD}1f`, borderRadius: '4px', padding: '0.1rem 0.45rem' }}>{selected.status}</span>
                  )}
                </h2>
                {selected.description && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{selected.description}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                <select
                  value={selected.folder_id ?? ''}
                  onChange={e => moveToFolder(selected, e.target.value === '' ? null : Number(e.target.value))}
                  title="Move to folder"
                  style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.8rem', color: '#374151', background: '#fff', cursor: 'pointer', maxWidth: '160px' }}
                >
                  <option value="">No folder</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {cfg.showPromote && (
                  <button
                    onClick={promote}
                    title="Move this draft into the Prompt Library"
                    style={{ background: GOLD, color: '#1a1a1a', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >Promote</button>
                )}
                <button
                  onClick={startEdit}
                  style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >Edit</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
              {cfg.showTrigger && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '0.35rem' }}>{cfg.triggerLabel}</div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                    {selected.trigger || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Not set.</span>}
                  </p>
                </div>
              )}
              {cfg.showTrigger && (
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '0.35rem' }}>{cfg.contentLabel}</div>
              )}
              <pre style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.85rem', lineHeight: 1.7, color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selected.content || <span style={{ color: '#aaa', fontStyle: 'italic', fontFamily: 'system-ui' }}>No content yet. Click Edit to add it.</span>}
              </pre>
              <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#d1d5db' }}>Last updated {fmt(selected.updated_at)}</p>
            </div>
          </>
        )}

        {selected && view === 'edit' && (
          <>
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, justifyContent: 'flex-end' }}>
              <button
                onClick={save}
                disabled={saving || !editName.trim()}
                style={{ background: GOLD, color: '#1a1a1a', border: 'none', borderRadius: '6px', padding: '0.38rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: saving || !editName.trim() ? 'default' : 'pointer', opacity: saving || !editName.trim() ? 0.6 : 1 }}
              >{saving ? 'Saving…' : 'Save'}</button>
              <button
                onClick={() => setView('read')}
                style={{ background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer' }}
              >Cancel</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>{cfg.nameLabel}</span>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>Description</span>
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="One line about what this is for" style={inputStyle} />
              </label>
              {cfg.showStatus && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>Status</span>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {LAB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              )}
              {cfg.showTrigger && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>{cfg.triggerLabel}</span>
                  <input value={editTrigger} onChange={e => setEditTrigger(e.target.value)} placeholder={cfg.triggerPlaceholder} style={inputStyle} />
                </label>
              )}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>{cfg.contentLabel}</span>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder={cfg.contentPlaceholder}
                  style={{ ...inputStyle, minHeight: '320px', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.83rem', lineHeight: 1.6 }}
                />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
