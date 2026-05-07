import { useState, useEffect } from 'react';

const GOLD = '#c9a840';
const NAVY = '#1c2866';

const STATUS_COLOR: Record<string, string> = {
  planned:     '#9ca3af',
  in_progress: '#f59e0b',
  active:      '#10b981',
  paused:      '#6b7280',
};

const STATUS_LABEL: Record<string, string> = {
  planned:     'Planned',
  in_progress: 'In Progress',
  active:      'Active',
  paused:      'Paused',
};

interface Bridge {
  id: number;
  name: string;
  status: string;
  description: string;
  content?: string;
  updated_at: string;
}

export default function AgentBridges() {
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [selected, setSelected] = useState<Bridge | null>(null);
  const [view, setView] = useState<'read' | 'edit'>('read');
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await fetch('/api/bridges');
    setBridges(await r.json());
  }

  async function select(b: Bridge) {
    const r = await fetch(`/api/bridges/${b.id}`);
    setSelected(await r.json());
    setView('read');
  }

  function startEdit() {
    if (!selected) return;
    setEditName(selected.name);
    setEditStatus(selected.status);
    setEditDesc(selected.description);
    setEditContent(selected.content ?? '');
    setView('edit');
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const r = await fetch(`/api/bridges/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, status: editStatus, description: editDesc, content: editContent }),
    });
    const updated = await r.json();
    setSelected(updated);
    setBridges(bs => bs.map(b => b.id === updated.id ? { ...b, ...updated } : b));
    setSaving(false);
    setView('read');
  }

  async function create() {
    if (!newName.trim()) return;
    const r = await fetch('/api/bridges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), status: 'planned', description: '', content: '' }),
    });
    const b = await r.json();
    setBridges(prev => [...prev, b].sort((a, z) => a.name.localeCompare(z.name)));
    setNewName('');
    setCreating(false);
    select(b);
  }

  async function deleteBridge(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/bridges/${id}`, { method: 'DELETE' });
    setBridges(bs => bs.filter(b => b.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function fmt(s: string) {
    return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Bridge list ── */}
      <div style={{ width: '260px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>Agent Bridges</div>
            <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }}>Connected tools & integrations</div>
          </div>
          <button
            onClick={() => { setCreating(v => !v); setNewName(''); }}
            style={{ background: creating ? `${GOLD}22` : 'transparent', border: `1px solid ${creating ? GOLD : '#d1d5db'}`, borderRadius: '5px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: creating ? GOLD : '#6b7280', fontSize: '1.1rem' }}
          >+</button>
        </div>

        {creating && (
          <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Bridge name…"
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${GOLD}88`, borderRadius: '5px', padding: '0.38rem 0.55rem', fontSize: '0.85rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
              <button onClick={create} style={{ flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>Create</button>
              <button onClick={() => setCreating(false)} style={{ flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0' }}>
          {bridges.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }}>No bridges yet</p>
          )}
          {bridges.map(b => (
            <div
              key={b.id}
              onClick={() => select(b)}
              onMouseEnter={() => setHoveredId(b.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: '0.7rem 1rem',
                background: selected?.id === b.id ? `${GOLD}14` : hoveredId === b.id ? '#f3f4f6' : 'transparent',
                borderLeft: selected?.id === b.id ? `3px solid ${GOLD}` : '3px solid transparent',
                cursor: 'pointer', transition: 'background 0.1s',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: selected?.id === b.id ? 600 : 400, color: selected?.id === b.id ? NAVY : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLOR[b.status] ?? '#9ca3af', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{STATUS_LABEL[b.status] ?? b.status}</span>
                </div>
              </div>
              {hoveredId === b.id && (
                <button
                  onClick={e => deleteBridge(b.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                >✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a bridge to view its documentation</p>
          </div>
        )}

        {selected && view === 'read' && (
          <>
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY }}>{selected.name}</h2>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: `${STATUS_COLOR[selected.status]}18`, border: `1px solid ${STATUS_COLOR[selected.status]}44`, borderRadius: '20px', padding: '0.15rem 0.6rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLOR[selected.status], display: 'inline-block' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_COLOR[selected.status] }}>{STATUS_LABEL[selected.status]}</span>
                  </span>
                </div>
                {selected.description && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{selected.description}</p>
                )}
              </div>
              <button
                onClick={startEdit}
                style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
              >Edit</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
              <pre style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.9rem', lineHeight: 1.8, color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selected.content || <span style={{ color: '#aaa', fontStyle: 'italic' }}>No documentation yet — click Edit to add it.</span>}
              </pre>
              <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#d1d5db' }}>Last updated {fmt(selected.updated_at)}</p>
            </div>
          </>
        )}

        {selected && view === 'edit' && (
          <>
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ fontSize: '1rem', fontWeight: 700, color: NAVY, border: 'none', outline: 'none', background: 'transparent', minWidth: '160px', flex: 1 }}
              />
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                style={{ border: '1px solid #e5e7eb', borderRadius: '5px', padding: '0.3rem 0.5rem', fontSize: '0.82rem', color: '#374151', cursor: 'pointer', outline: 'none' }}
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <input
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Short description…"
                style={{ border: '1px solid #e5e7eb', borderRadius: '5px', padding: '0.3rem 0.6rem', fontSize: '0.82rem', outline: 'none', minWidth: '180px' }}
              />
              <div style={{ display: 'flex', gap: '0.45rem', marginLeft: 'auto' }}>
                <button onClick={() => setView('read')} style={{ background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', padding: '1.5rem 2rem', fontSize: '0.9rem', lineHeight: 1.8, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937', background: '#fff' }}
              placeholder="Document this bridge — accounts, endpoints, phases, resume phrase, agent instructions…"
            />
          </>
        )}
      </div>
    </div>
  );
}
