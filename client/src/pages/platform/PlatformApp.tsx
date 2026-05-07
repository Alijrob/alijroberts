import { useState, useEffect, useCallback } from 'react';

const ACCENT = '#7c3aed';
const SURFACE = '#111111';
const BORDER = '#1e1e1e';

type Status = 'active' | 'suspended' | 'provisioning';

interface Tenant {
  id: number;
  tenant_id: string;
  name: string;
  email: string;
  status: Status;
  created_at: string;
  domains: string[] | null;
}

const STATUS_COLORS: Record<Status, string> = {
  active: '#22c55e',
  suspended: '#ef4444',
  provisioning: '#f59e0b',
};

function tok() { return localStorage.getItem('ajr_session_token') ?? ''; }
function af(path: string, init?: RequestInit) {
  return fetch(path, { ...init, headers: { 'x-session-token': tok(), 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
}

export default function PlatformApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'tenants' | 'new' | 'domains'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [engineOk, setEngineOk] = useState<boolean | null>(null);

  const [tForm, setTForm] = useState({ name: '', email: '', tenant_id: '' });
  const [dForm, setDForm] = useState({ tenant_id: '', domain: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!tok()) { window.location.href = '/operations/raven/login'; return; }
    fetch('/api/auth/session', { headers: { 'x-session-token': tok() } })
      .then(r => { if (r.ok) setAuthed(true); else window.location.href = '/operations/raven/login'; })
      .catch(() => { window.location.href = '/operations/raven/login'; });
  }, []);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const r = await af('/api/platform/tenants');
      if (r.ok) setTenants(await r.json() as Tenant[]);
    } finally { setLoading(false); }
  }, []);

  const checkEngine = useCallback(async () => {
    try { const r = await af('/api/platform/health'); setEngineOk(r.ok); }
    catch { setEngineOk(false); }
  }, []);

  useEffect(() => { if (authed) { loadTenants(); checkEngine(); } }, [authed, loadTenants, checkEngine]);

  function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  async function createTenant(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const r = await af('/api/platform/tenants', { method: 'POST', body: JSON.stringify(tForm) });
      const d = await r.json() as { error?: string };
      if (!r.ok) { setErr(d.error ?? 'Failed'); return; }
      setTForm({ name: '', email: '', tenant_id: '' });
      setTab('tenants');
      await loadTenants();
    } finally { setSaving(false); }
  }

  async function addDomain(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const r = await af('/api/platform/domains', { method: 'POST', body: JSON.stringify(dForm) });
      const d = await r.json() as { error?: string };
      if (!r.ok) { setErr(d.error ?? 'Failed'); return; }
      setDForm({ tenant_id: '', domain: '' });
      await loadTenants();
    } finally { setSaving(false); }
  }

  async function setStatus(id: string, status: Status) {
    await af(`/api/platform/tenants/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    await loadTenants();
  }

  if (authed === null) return <div style={{ minHeight: '100vh', background: '#0a0a0a' }} />;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui,-apple-system,sans-serif', color: '#f8fafc' }}>

      {/* Header */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '0 1.5rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}33`, borderRadius: '4px', padding: '2px 8px' }}>
            <span style={{ color: ACCENT, fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>DAS / PLATFORM</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>Avatar Factory</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: engineOk === true ? '#22c55e' : engineOk === false ? '#ef4444' : '#6b7280' }} />
            <span style={{ color: 'rgba(248,250,252,0.3)', fontSize: '0.72rem' }}>
              {engineOk === true ? 'engine online' : engineOk === false ? 'engine offline' : 'checking...'}
            </span>
          </div>
          <a href="/operations/raven/hub" style={{ color: 'rgba(248,250,252,0.3)', fontSize: '0.78rem', textDecoration: 'none' }}>← RAVEN Hub</a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '0 1.5rem', display: 'flex', gap: '0.25rem' }}>
        {([['tenants', `Tenants (${tenants.length})`], ['new', '+ New Tenant'], ['domains', '+ Add Domain']] as const).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setErr(''); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem',
            fontSize: '0.82rem', fontWeight: tab === t ? 600 : 400, fontFamily: 'inherit',
            color: tab === t ? ACCENT : 'rgba(248,250,252,0.4)',
            borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Tenant List */}
        {tab === 'tenants' && (
          <div>
            {loading && <div style={{ color: 'rgba(248,250,252,0.3)', fontSize: '0.85rem' }}>Loading...</div>}
            {!loading && !tenants.length && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '3rem', textAlign: 'center', color: 'rgba(248,250,252,0.3)' }}>
                No tenants yet.{' '}
                <button onClick={() => setTab('new')} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>Create the first one.</button>
              </div>
            )}
            {tenants.map(t => (
              <div key={t.id} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{t.name}</div>
                    <div style={{ color: 'rgba(248,250,252,0.4)', fontSize: '0.8rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>{t.email}</span>
                      <span style={{ fontFamily: 'monospace', color: 'rgba(248,250,252,0.25)' }}>id: {t.tenant_id}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    {t.domains?.length ? (
                      <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {t.domains.map(d => (
                          <span key={d} style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '1px 8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.5)' }}>{d}</span>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => { setDForm(p => ({ ...p, tenant_id: t.tenant_id })); setTab('domains'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,250,252,0.25)', fontSize: '0.75rem', fontFamily: 'inherit', marginTop: '0.3rem', padding: 0 }}>+ add domain</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ background: `${STATUS_COLORS[t.status]}18`, border: `1px solid ${STATUS_COLORS[t.status]}44`, color: STATUS_COLORS[t.status], fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{t.status}</span>
                    <select value={t.status} onChange={e => setStatus(t.tenant_id, e.target.value as Status)}
                      style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, color: 'rgba(248,250,252,0.6)', fontSize: '0.78rem', padding: '3px 6px', borderRadius: '4px', fontFamily: 'inherit', cursor: 'pointer' }}>
                      <option value="provisioning">provisioning</option>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Tenant */}
        {tab === 'new' && (
          <div style={{ maxWidth: '480px' }}>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(248,250,252,0.8)' }}>Create Avatar Instance</h2>
              <form onSubmit={createTenant}>
                {[
                  { key: 'name', label: 'Client Name', placeholder: 'John Doe', required: true },
                  { key: 'email', label: 'Email', placeholder: 'john@example.com', required: true },
                  { key: 'tenant_id', label: 'Tenant ID (slug)', placeholder: 'auto-generated from name', required: false },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</label>
                    <input
                      value={tForm[f.key as keyof typeof tForm]}
                      onChange={e => {
                        const val = e.target.value;
                        setTForm(p => {
                          const next = { ...p, [f.key]: val };
                          if (f.key === 'name' && !p.tenant_id) next.tenant_id = slugify(val);
                          return next;
                        });
                      }}
                      placeholder={f.placeholder}
                      required={f.required}
                      style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                ))}
                {err && <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{err}</div>}
                <div style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.3)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Add domains separately after creating the tenant. Point DNS A records to 147.93.119.147.
                </div>
                <button type="submit" disabled={saving} style={{ background: ACCENT, border: 'none', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Creating...' : 'Create Tenant'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Domain */}
        {tab === 'domains' && (
          <div style={{ maxWidth: '480px' }}>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(248,250,252,0.8)' }}>Add Domain to Tenant</h2>
              <form onSubmit={addDomain}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tenant</label>
                  <select value={dForm.tenant_id} onChange={e => setDForm(p => ({ ...p, tenant_id: e.target.value }))} required
                    style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}>
                    <option value="">Select tenant...</option>
                    {tenants.map(t => <option key={t.tenant_id} value={t.tenant_id}>{t.name} ({t.tenant_id})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Domain</label>
                  <input value={dForm.domain} onChange={e => setDForm(p => ({ ...p, domain: e.target.value }))} placeholder="johndoe.com" required
                    style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                {err && <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{err}</div>}
                <button type="submit" disabled={saving} style={{ background: ACCENT, border: 'none', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Adding...' : 'Add Domain'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
