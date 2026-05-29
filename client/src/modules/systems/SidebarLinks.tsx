import { useEffect, useState } from 'react';
import { SIDEBAR_ICON_KEYS, SIDEBAR_ICON_LABELS, renderSidebarIcon, type SidebarIconKey } from './sidebarIcons';

const GOLD = '#c9a840';
const BORDER = 'rgba(0,0,0,0.08)';
const TEXT = '#0d0d0d';
const TEXT_S = '#666';

type Link = {
  id: number;
  label: string;
  url: string;
  icon_key: string;
  sort_order: number;
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.65rem', border: `1px solid ${BORDER}`, borderRadius: 6,
  fontSize: '0.9rem', background: '#fff', color: TEXT, outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 6, border: 'none',
  background: GOLD, color: '#0d0d0d', fontWeight: 600, fontSize: '0.88rem',
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  padding: '0.4rem 0.7rem', borderRadius: 6, border: `1px solid ${BORDER}`,
  background: '#fff', color: TEXT, fontSize: '0.82rem', cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  padding: '0.4rem 0.7rem', borderRadius: 6, border: `1px solid rgba(220,38,38,0.3)`,
  background: '#fff', color: '#dc2626', fontSize: '0.82rem', cursor: 'pointer',
};

export default function SidebarLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ label: string; url: string; icon_key: SidebarIconKey }>({
    label: '', url: '', icon_key: 'link',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/sidebar-links');
    setLinks(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const method = editingId == null ? 'POST' : 'PATCH';
      const url = editingId == null ? '/api/sidebar-links' : `/api/sidebar-links/${editingId}`;
      const r = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || 'Save failed');
        return;
      }
      setDraft({ label: '', url: '', icon_key: 'link' });
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function del(id: number) {
    if (!confirm('Delete this link from the Operations dropdown?')) return;
    await fetch(`/api/sidebar-links/${id}`, { method: 'DELETE' });
    if (editingId === id) {
      setEditingId(null);
      setDraft({ label: '', url: '', icon_key: 'link' });
    }
    await load();
  }

  function startEdit(link: Link) {
    setEditingId(link.id);
    setDraft({
      label: link.label,
      url: link.url,
      icon_key: (SIDEBAR_ICON_KEYS.includes(link.icon_key as SidebarIconKey) ? link.icon_key : 'link') as SidebarIconKey,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ label: '', url: '', icon_key: 'link' });
    setError(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 720 }}>
      <div>
        <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 700, color: TEXT }}>Sidebar Links</h2>
        <p style={{ margin: 0, color: TEXT_S, fontSize: '0.86rem', lineHeight: 1.5 }}>
          External links shown under <strong>Operations</strong> in the sidebar.
          Add anything you want one click away. Opens in a new tab.
        </p>
      </div>

      <section style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1rem 1.1rem', background: '#fff' }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.8rem', color: TEXT }}>
          {editingId == null ? 'Add a link' : 'Edit link'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.78rem', color: TEXT_S, fontWeight: 600 }}>Label</span>
            <input
              style={inputStyle}
              placeholder="e.g. n8n"
              value={draft.label}
              onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.78rem', color: TEXT_S, fontWeight: 600 }}>URL</span>
            <input
              style={inputStyle}
              placeholder="https://..."
              value={draft.url}
              onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
            />
          </label>
        </div>
        <div style={{ marginTop: '0.7rem' }}>
          <div style={{ fontSize: '0.78rem', color: TEXT_S, fontWeight: 600, marginBottom: '0.4rem' }}>Icon</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {SIDEBAR_ICON_KEYS.map(k => {
              const selected = draft.icon_key === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, icon_key: k }))}
                  title={SIDEBAR_ICON_LABELS[k]}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 38, height: 38, borderRadius: 6,
                    border: selected ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
                    background: selected ? 'rgba(201,168,64,0.08)' : '#fff',
                    color: selected ? GOLD : TEXT, cursor: 'pointer',
                    transition: 'border 0.12s, background 0.12s',
                  }}
                >{renderSidebarIcon(k)}</button>
              );
            })}
          </div>
        </div>

        {error && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '0.6rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={save} disabled={saving || !draft.label || !draft.url} style={{
            ...btnPrimary, opacity: saving || !draft.label || !draft.url ? 0.5 : 1,
            cursor: saving || !draft.label || !draft.url ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : editingId == null ? 'Add link' : 'Save'}
          </button>
          {editingId != null && <button onClick={cancelEdit} style={btnGhost}>Cancel</button>}
        </div>
      </section>

      <section>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.6rem', color: TEXT }}>
          Existing links {!loading && `(${links.length})`}
        </div>
        {loading ? (
          <div style={{ color: TEXT_S, fontSize: '0.85rem' }}>Loading…</div>
        ) : links.length === 0 ? (
          <div style={{ color: TEXT_S, fontSize: '0.85rem', fontStyle: 'italic' }}>No links yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {links.map(link => (
              <div key={link.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 0.9rem', border: `1px solid ${BORDER}`,
                borderRadius: 8, background: '#fff',
              }}>
                <span style={{ display: 'flex', color: TEXT_S, flexShrink: 0 }}>{renderSidebarIcon(link.icon_key)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: TEXT }}>{link.label}</div>
                  <div style={{ fontSize: '0.76rem', color: TEXT_S, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
                </div>
                <button onClick={() => startEdit(link)} style={btnGhost}>Edit</button>
                <button onClick={() => del(link.id)} style={btnDanger}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={{ color: TEXT_S, fontSize: '0.78rem', fontStyle: 'italic', margin: 0 }}>
        Changes appear in the sidebar after a page refresh.
      </p>
    </div>
  );
}
