import { useState, useEffect } from 'react';

const GOLD = '#c9a840';
const NAVY = '#1c2866';

interface Skill {
  id: number;
  name: string;
  description: string;
  content?: string;
  updated_at: string;
}

export default function SkillsModule() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [view, setView] = useState<'read' | 'edit'>('read');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const r = await fetch('/api/skills');
      if (!r.ok) throw new Error(String(r.status));
      setSkills(await r.json());
      setError(null);
    } catch {
      setError('Could not load skills.');
    }
  }

  async function select(s: Skill) {
    const r = await fetch(`/api/skills/${s.id}`);
    setSelected(await r.json());
    setView('read');
  }

  function startEdit() {
    if (!selected) return;
    setEditName(selected.name);
    setEditDesc(selected.description);
    setEditContent(selected.content ?? '');
    setView('edit');
  }

  async function save() {
    if (!selected || !editName.trim()) return;
    setSaving(true);
    const r = await fetch(`/api/skills/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), description: editDesc, content: editContent }),
    });
    const updated = await r.json();
    setSelected(updated);
    setSkills(ss => ss.map(s => s.id === updated.id ? { ...s, ...updated } : s).sort((a, z) => a.name.localeCompare(z.name)));
    setSaving(false);
    setView('read');
  }

  async function create() {
    if (!newName.trim()) return;
    const r = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: '', content: '' }),
    });
    const s = await r.json();
    setSkills(prev => [...prev, s].sort((a, z) => a.name.localeCompare(z.name)));
    setNewName('');
    setCreating(false);
    select(s);
    startEditFor(s);
  }

  function startEditFor(s: Skill) {
    setSelected(s);
    setEditName(s.name);
    setEditDesc(s.description ?? '');
    setEditContent(s.content ?? '');
    setView('edit');
  }

  async function deleteSkill(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/skills/${id}`, { method: 'DELETE' });
    setSkills(ss => ss.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function fmt(s: string) {
    return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '5px',
    padding: '0.45rem 0.6rem', fontSize: '0.88rem', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Skills list */}
      <div style={{ width: '260px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>Skills</div>
            <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }}>Stored, viewable, editable</div>
          </div>
          <button
            onClick={() => { setCreating(v => !v); setNewName(''); }}
            title="New skill"
            style={{ background: creating ? `${GOLD}22` : 'transparent', border: `1px solid ${creating ? GOLD : '#d1d5db'}`, borderRadius: '5px', padding: '0 0.55rem', height: '28px', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: creating ? GOLD : '#6b7280', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          >+ Skill</button>
        </div>

        {creating && (
          <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Skill name…"
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
          {!error && skills.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }}>No skills yet. Click + Skill.</p>
          )}
          {skills.map(s => (
            <div
              key={s.id}
              onClick={() => select(s)}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: '0.7rem 1rem',
                background: selected?.id === s.id ? `${GOLD}14` : hoveredId === s.id ? '#f3f4f6' : 'transparent',
                borderLeft: selected?.id === s.id ? `3px solid ${GOLD}` : '3px solid transparent',
                cursor: 'pointer', transition: 'background 0.1s',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: selected?.id === s.id ? 600 : 400, color: selected?.id === s.id ? NAVY : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </div>
                {s.description && (
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{s.description}</div>
                )}
              </div>
              {hoveredId === s.id && (
                <button
                  onClick={e => deleteSkill(s.id, e)}
                  title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                >✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a skill, or click + Skill to add one</p>
          </div>
        )}

        {selected && view === 'read' && (
          <>
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY }}>{selected.name}</h2>
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
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>Name</span>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>Description</span>
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="One line about what this skill does" style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>Content</span>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="The skill body. Paste the full skill definition or instructions here."
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
