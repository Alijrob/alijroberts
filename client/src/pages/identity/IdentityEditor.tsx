import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG      = '#080a12';
const SURFACE = 'rgba(255,255,255,0.04)';
const SURF2   = 'rgba(255,255,255,0.07)';
const BORDER  = 'rgba(201,168,64,0.14)';
const GOLD    = '#c9a840';
const GOLD_G  = 'linear-gradient(90deg,#5c3d08 0%,#b8860b 20%,#f0d060 45%,#fffacd 55%,#f0d060 70%,#b8860b 85%,#5c3d08 100%)';
const GOLD_T  = 'linear-gradient(180deg,#fff5a8 0%,#f0d060 28%,#c9a840 52%,#8b6008 72%,#c9a840 88%,#fff5a8 100%)';
const TEXT    = '#ffffff';
const TEXT_S  = 'rgba(255,255,255,0.55)';
const TEXT_M  = 'rgba(255,255,255,0.32)';
const RED     = '#ef4444';

type Tab = 'profile' | 'services' | 'experience' | 'projects' | 'credentials' | 'skills';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile',     label: 'Profile'     },
  { id: 'services',    label: 'Services'    },
  { id: 'experience',  label: 'Experience'  },
  { id: 'projects',    label: 'Projects'    },
  { id: 'credentials', label: 'Credentials' },
  { id: 'skills',      label: 'Skills'      },
];

function authHeader() {
  const token = localStorage.getItem('ajr_session_token') ?? '';
  return { 'x-session-token': token, 'Content-Type': 'application/json' };
}

// ── Shared input styles ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: SURF2,
  border: `1px solid ${BORDER}`, borderRadius: '6px',
  color: TEXT, fontSize: '0.9rem', padding: '0.75rem 0.9rem',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'system-ui, sans-serif',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: TEXT_M, marginBottom: '0.35rem',
};
const btnPrimary: React.CSSProperties = {
  background: GOLD_G, border: 'none', cursor: 'pointer',
  color: '#1a0e00', fontWeight: 800, fontSize: '0.78rem',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  padding: '0.65rem 1.4rem', borderRadius: '5px',
};
const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`,
  cursor: 'pointer', color: RED,
  fontWeight: 600, fontSize: '0.75rem',
  letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '0.55rem 1rem', borderRadius: '5px',
};
const btnGhost: React.CSSProperties = {
  background: SURFACE, border: `1px solid ${BORDER}`,
  cursor: 'pointer', color: TEXT_S,
  fontWeight: 600, fontSize: '0.78rem',
  letterSpacing: '0.06em', textTransform: 'uppercase',
  padding: '0.65rem 1.25rem', borderRadius: '5px',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const [form, setForm] = useState({ tagline: '', headline: '', bio: '', website_url: '', social_links: {} as Record<string, string> });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/identity/profile')
      .then(r => r.json())
      .then(d => {
        setForm({
          tagline: d.tagline ?? '',
          headline: d.headline ?? '',
          bio: d.bio ?? '',
          website_url: d.website_url ?? '',
          social_links: typeof d.social_links === 'object' && d.social_links ? d.social_links as Record<string, string> : {},
        });
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/identity/profile', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function uploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('banner', file);
    await fetch('/api/identity/banner', {
      method: 'POST',
      headers: { 'x-session-token': localStorage.getItem('ajr_session_token') ?? '' },
      body: fd,
    });
    setUploading(false);
  }

  function setSocial(key: string, val: string) {
    setForm(f => ({ ...f, social_links: { ...f.social_links, [key]: val } }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }}>Profile & Identity</h3>
        <button onClick={save} disabled={saving} style={btnPrimary}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <Field label="Headline / Title">
        <input
          style={inputStyle} value={form.headline}
          onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
          placeholder="e.g. Founder & Systems Architect"
        />
      </Field>

      <Field label="Tagline (hero display)">
        <input
          style={inputStyle} value={form.tagline}
          onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
          placeholder="e.g. Strategy. Systems. Execution."
        />
      </Field>

      <Field label="Bio">
        <textarea
          style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Write your professional bio here..."
        />
      </Field>

      <Field label="Website URL">
        <input
          style={inputStyle} value={form.website_url}
          onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
          placeholder="https://yourwebsite.com"
        />
      </Field>

      {/* Social links */}
      <div>
        <div style={labelStyle}>Social Links</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {['LinkedIn', 'Twitter', 'GitHub', 'Instagram', 'YouTube'].map(k => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: TEXT_S, fontWeight: 600 }}>{k}</span>
              <input
                style={inputStyle} value={form.social_links[k] ?? ''}
                onChange={e => setSocial(k, e.target.value)}
                placeholder={`https://...`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Banner upload */}
      <div>
        <div style={labelStyle}>Hero Banner Photo</div>
        <div style={{
          border: `1px dashed rgba(201,168,64,0.2)`, borderRadius: '8px',
          padding: '1.5rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', color: TEXT_S, marginBottom: '0.75rem' }}>
            {uploading ? 'Uploading…' : 'Upload a background photo for your hero section'}
          </div>
          <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadBanner} />
          <button onClick={() => bannerRef.current?.click()} style={btnGhost}>
            Choose Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Services Tab ──────────────────────────────────────────────────────────────
interface ServiceRow { id?: number; title: string; description: string; price_range: string; icon: string; }

function ServicesTab() {
  const [items, setItems] = useState<ServiceRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<ServiceRow>({ title: '', description: '', price_range: '', icon: '◆' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/identity/services').then(r => r.json()).then(d => setItems(d as ServiceRow[])).catch(() => {});
  }, []);

  async function addItem() {
    setSaving(true);
    const r = await fetch('/api/identity/services', {
      method: 'POST', headers: authHeader(), body: JSON.stringify(newItem),
    });
    const saved = await r.json() as ServiceRow;
    setItems(prev => [...prev, saved]);
    setNewItem({ title: '', description: '', price_range: '', icon: '◆' });
    setAdding(false);
    setSaving(false);
  }

  async function deleteItem(id: number) {
    await fetch(`/api/identity/services/${id}`, { method: 'DELETE', headers: authHeader() });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }}>Services</h3>
        <button onClick={() => setAdding(true)} style={btnPrimary}>+ Add Service</button>
      </div>

      {items.map(item => (
        <div key={item.id} style={{
          background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
          padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: TEXT, marginBottom: '0.2rem' }}>{item.icon} {item.title}</div>
            {item.description && <div style={{ fontSize: '0.82rem', color: TEXT_S }}>{item.description}</div>}
            {item.price_range && <div style={{ fontSize: '0.72rem', color: GOLD, marginTop: '0.25rem' }}>{item.price_range}</div>}
          </div>
          <button onClick={() => item.id !== undefined && deleteItem(item.id)} style={btnDanger}>Delete</button>
        </div>
      ))}

      {adding && (
        <div style={{ background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.88rem', color: GOLD }}>New Service</h4>
          <Field label="Icon (emoji or symbol)">
            <input style={{ ...inputStyle, width: '80px' }} value={newItem.icon} onChange={e => setNewItem(p => ({ ...p, icon: e.target.value }))} />
          </Field>
          <Field label="Title">
            <input style={inputStyle} value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="Service name" />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="What does this service include?" />
          </Field>
          <Field label="Price Range">
            <input style={inputStyle} value={newItem.price_range} onChange={e => setNewItem(p => ({ ...p, price_range: e.target.value }))} placeholder="e.g. Starting at $500 / month" />
          </Field>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={addItem} disabled={saving || !newItem.title} style={btnPrimary}>{saving ? 'Adding…' : 'Add Service'}</button>
            <button onClick={() => setAdding(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Experience Tab ────────────────────────────────────────────────────────────
interface ExpRow { id?: number; title: string; company: string; start_date: string; end_date: string; is_current: boolean; description: string; }

function ExperienceTab() {
  const [items, setItems] = useState<ExpRow[]>([]);
  const [adding, setAdding] = useState(false);
  const blank: ExpRow = { title: '', company: '', start_date: '', end_date: '', is_current: false, description: '' };
  const [newItem, setNewItem] = useState<ExpRow>(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/identity/experience').then(r => r.json()).then(d => setItems(d as ExpRow[])).catch(() => {});
  }, []);

  async function addItem() {
    setSaving(true);
    const r = await fetch('/api/identity/experience', {
      method: 'POST', headers: authHeader(), body: JSON.stringify(newItem),
    });
    const saved = await r.json() as ExpRow;
    setItems(prev => [saved, ...prev]);
    setNewItem(blank);
    setAdding(false);
    setSaving(false);
  }

  async function deleteItem(id: number) {
    await fetch(`/api/identity/experience/${id}`, { method: 'DELETE', headers: authHeader() });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }}>Work History</h3>
        <button onClick={() => setAdding(true)} style={btnPrimary}>+ Add Position</button>
      </div>

      {items.map(item => (
        <div key={item.id} style={{
          background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
          padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: TEXT }}>{item.title}</div>
            <div style={{ fontSize: '0.85rem', color: GOLD }}>{item.company}</div>
            <div style={{ fontSize: '0.75rem', color: TEXT_M, marginTop: '0.2rem' }}>
              {item.start_date}{item.is_current ? ' — Present' : item.end_date ? ` — ${item.end_date}` : ''}
            </div>
            {item.description && <div style={{ fontSize: '0.82rem', color: TEXT_S, marginTop: '0.4rem' }}>{item.description}</div>}
          </div>
          <button onClick={() => item.id !== undefined && deleteItem(item.id)} style={btnDanger}>Delete</button>
        </div>
      ))}

      {adding && (
        <div style={{ background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.88rem', color: GOLD }}>New Position</h4>
          <Field label="Job Title">
            <input style={inputStyle} value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Founder & CEO" />
          </Field>
          <Field label="Company">
            <input style={inputStyle} value={newItem.company} onChange={e => setNewItem(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Start Date">
              <input style={inputStyle} value={newItem.start_date} onChange={e => setNewItem(p => ({ ...p, start_date: e.target.value }))} placeholder="e.g. Jan 2020" />
            </Field>
            <Field label="End Date">
              <input style={inputStyle} value={newItem.end_date} onChange={e => setNewItem(p => ({ ...p, end_date: e.target.value }))} placeholder="e.g. Present" disabled={newItem.is_current} />
            </Field>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: TEXT_S }}>
            <input type="checkbox" checked={newItem.is_current} onChange={e => setNewItem(p => ({ ...p, is_current: e.target.checked }))} />
            Currently in this role
          </label>
          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Key responsibilities and achievements" />
          </Field>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={addItem} disabled={saving || !newItem.title || !newItem.company} style={btnPrimary}>{saving ? 'Adding…' : 'Add Position'}</button>
            <button onClick={() => setAdding(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Projects Tab ──────────────────────────────────────────────────────────────
interface ProjectRow { id?: number; title: string; description: string; url: string; tags: string; }

function ProjectsTab() {
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [adding, setAdding] = useState(false);
  const blank: ProjectRow = { title: '', description: '', url: '', tags: '' };
  const [newItem, setNewItem] = useState<ProjectRow>(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/identity/projects').then(r => r.json()).then(d => {
      setItems((d as Array<ProjectRow & { tags: string[] }>).map(p => ({
        ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      })));
    }).catch(() => {});
  }, []);

  async function addItem() {
    setSaving(true);
    const payload = { ...newItem, tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean) };
    const r = await fetch('/api/identity/projects', {
      method: 'POST', headers: authHeader(), body: JSON.stringify(payload),
    });
    const saved = await r.json() as ProjectRow & { tags: string[] };
    setItems(prev => [{ ...saved, tags: saved.tags.join(', ') }, ...prev]);
    setNewItem(blank);
    setAdding(false);
    setSaving(false);
  }

  async function deleteItem(id: number) {
    await fetch(`/api/identity/projects/${id}`, { method: 'DELETE', headers: authHeader() });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }}>Portfolio Projects</h3>
        <button onClick={() => setAdding(true)} style={btnPrimary}>+ Add Project</button>
      </div>

      {items.map(item => (
        <div key={item.id} style={{
          background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
          padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: TEXT }}>{item.title}</div>
            {item.description && <div style={{ fontSize: '0.82rem', color: TEXT_S, marginTop: '0.2rem' }}>{item.description}</div>}
            {item.tags && <div style={{ fontSize: '0.72rem', color: GOLD, marginTop: '0.3rem' }}>{item.tags}</div>}
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: TEXT_M }}>{item.url}</a>}
          </div>
          <button onClick={() => item.id !== undefined && deleteItem(item.id)} style={btnDanger}>Delete</button>
        </div>
      ))}

      {adding && (
        <div style={{ background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.88rem', color: GOLD }}>New Project</h4>
          <Field label="Project Title">
            <input style={inputStyle} value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="Project name" />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="What did you build?" />
          </Field>
          <Field label="URL">
            <input style={inputStyle} value={newItem.url} onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
          </Field>
          <Field label="Tags (comma separated)">
            <input style={inputStyle} value={newItem.tags} onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. React, Node.js, PostgreSQL" />
          </Field>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={addItem} disabled={saving || !newItem.title} style={btnPrimary}>{saving ? 'Adding…' : 'Add Project'}</button>
            <button onClick={() => setAdding(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Credentials Tab ───────────────────────────────────────────────────────────
interface CredRow { id?: number; title: string; issuer: string; issued_date: string; credential_url: string; }

function CredentialsTab() {
  const [items, setItems] = useState<CredRow[]>([]);
  const [adding, setAdding] = useState(false);
  const blank: CredRow = { title: '', issuer: '', issued_date: '', credential_url: '' };
  const [newItem, setNewItem] = useState<CredRow>(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/identity/credentials').then(r => r.json()).then(d => setItems(d as CredRow[])).catch(() => {});
  }, []);

  async function addItem() {
    setSaving(true);
    const r = await fetch('/api/identity/credentials', {
      method: 'POST', headers: authHeader(), body: JSON.stringify(newItem),
    });
    const saved = await r.json() as CredRow;
    setItems(prev => [...prev, saved]);
    setNewItem(blank);
    setAdding(false);
    setSaving(false);
  }

  async function deleteItem(id: number) {
    await fetch(`/api/identity/credentials/${id}`, { method: 'DELETE', headers: authHeader() });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }}>Credentials & Certifications</h3>
        <button onClick={() => setAdding(true)} style={btnPrimary}>+ Add Credential</button>
      </div>

      {items.map(item => (
        <div key={item.id} style={{
          background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
          padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: TEXT }}>{item.title}</div>
            {item.issuer && <div style={{ fontSize: '0.82rem', color: GOLD }}>{item.issuer}</div>}
            {item.issued_date && <div style={{ fontSize: '0.72rem', color: TEXT_M }}>{item.issued_date}</div>}
          </div>
          <button onClick={() => item.id !== undefined && deleteItem(item.id)} style={btnDanger}>Delete</button>
        </div>
      ))}

      {adding && (
        <div style={{ background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.88rem', color: GOLD }}>New Credential</h4>
          <Field label="Title / Certification Name">
            <input style={inputStyle} value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="e.g. AWS Solutions Architect" />
          </Field>
          <Field label="Issuing Organization">
            <input style={inputStyle} value={newItem.issuer} onChange={e => setNewItem(p => ({ ...p, issuer: e.target.value }))} placeholder="e.g. Amazon Web Services" />
          </Field>
          <Field label="Date Issued">
            <input style={inputStyle} value={newItem.issued_date} onChange={e => setNewItem(p => ({ ...p, issued_date: e.target.value }))} placeholder="e.g. March 2024" />
          </Field>
          <Field label="Credential URL">
            <input style={inputStyle} value={newItem.credential_url} onChange={e => setNewItem(p => ({ ...p, credential_url: e.target.value }))} placeholder="https://..." />
          </Field>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={addItem} disabled={saving || !newItem.title} style={btnPrimary}>{saving ? 'Adding…' : 'Add Credential'}</button>
            <button onClick={() => setAdding(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skills Tab ────────────────────────────────────────────────────────────────
interface SkillRow { id?: number; name: string; category: string; }

function SkillsTab() {
  const [items, setItems] = useState<SkillRow[]>([]);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('General');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/identity/skills').then(r => r.json()).then(d => setItems(d as SkillRow[])).catch(() => {});
  }, []);

  async function addSkill() {
    if (!newName.trim()) return;
    setSaving(true);
    const r = await fetch('/api/identity/skills', {
      method: 'POST', headers: authHeader(), body: JSON.stringify({ name: newName.trim(), category: newCat }),
    });
    const saved = await r.json() as SkillRow;
    setItems(prev => [...prev, saved]);
    setNewName('');
    setSaving(false);
  }

  async function deleteSkill(id: number) {
    await fetch(`/api/identity/skills/${id}`, { method: 'DELETE', headers: authHeader() });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const byCategory: Record<string, SkillRow[]> = {};
  for (const s of items) {
    const c = s.category || 'General';
    if (!byCategory[c]) byCategory[c] = [];
    byCategory[c].push(s);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }}>Skills</h3>

      {/* Add skill */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, flex: '1 1 180px' }} value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSkill()}
          placeholder="Skill name"
        />
        <input
          style={{ ...inputStyle, flex: '0 1 140px' }} value={newCat}
          onChange={e => setNewCat(e.target.value)}
          placeholder="Category"
        />
        <button onClick={addSkill} disabled={saving || !newName.trim()} style={btnPrimary}>
          {saving ? '…' : '+ Add'}
        </button>
      </div>

      {/* By category */}
      {Object.entries(byCategory).map(([cat, skills]) => (
        <div key={cat}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.6rem' }}>
            {cat}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {skills.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: SURF2, border: `1px solid ${BORDER}`,
                borderRadius: '4px', padding: '0.3rem 0.6rem',
                fontSize: '0.8rem', color: TEXT_S,
              }}>
                {s.name}
                <button
                  onClick={() => s.id !== undefined && deleteSkill(s.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_M, padding: 0, fontSize: '0.8rem', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Root editor ───────────────────────────────────────────────────────────────
export default function IdentityEditor() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('ajr_session_token') ?? '';
    if (!token) { setAuthed(false); return; }
    fetch('/api/auth/session', { headers: { 'x-session-token': token } })
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div style={{ minHeight: '100vh', background: BG }} />;
  if (!authed) {
    navigate('/operations/raven/login');
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh', background: BG,
      fontFamily: 'system-ui, -apple-system, sans-serif', color: TEXT,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <header style={{
        height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem',
        background: 'rgba(0,0,0,0.5)', borderBottom: `1px solid ${BORDER}`,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              background: GOLD_T, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              PAGIOSystems
            </span>
          </a>
          <span style={{ color: TEXT_M, fontSize: '0.8rem' }}>/</span>
          <span style={{ fontSize: '0.82rem', color: TEXT_S, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Identity Editor
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/" style={{ ...btnGhost, textDecoration: 'none', padding: '0.45rem 1rem', fontSize: '0.75rem' }}>
            View Live Site
          </a>
          <a href="/operations/raven/hub" style={{ ...btnGhost, textDecoration: 'none', padding: '0.45rem 1rem', fontSize: '0.75rem' }}>
            Dashboard
          </a>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: '200px', flexShrink: 0,
          background: 'rgba(0,0,0,0.35)', borderRight: `1px solid ${BORDER}`,
          padding: '1.5rem 0',
          display: 'flex', flexDirection: 'column', gap: '0.15rem',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? 'rgba(201,168,64,0.1)' : 'transparent',
                border: 'none', borderLeft: `3px solid ${tab === t.id ? GOLD : 'transparent'}`,
                cursor: 'pointer', color: tab === t.id ? GOLD : TEXT_S,
                fontSize: '0.82rem', fontWeight: tab === t.id ? 700 : 500,
                letterSpacing: '0.04em',
                padding: '0.7rem 1.25rem', textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
          {tab === 'profile'     && <ProfileTab />}
          {tab === 'services'    && <ServicesTab />}
          {tab === 'experience'  && <ExperienceTab />}
          {tab === 'projects'    && <ProjectsTab />}
          {tab === 'credentials' && <CredentialsTab />}
          {tab === 'skills'      && <SkillsTab />}
        </main>
      </div>
    </div>
  );
}
