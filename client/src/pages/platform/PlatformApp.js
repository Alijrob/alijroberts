import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
const ACCENT = '#7c3aed';
const SURFACE = '#111111';
const BORDER = '#1e1e1e';
const STATUS_COLORS = {
    active: '#22c55e',
    suspended: '#ef4444',
    provisioning: '#f59e0b',
};
function tok() { return localStorage.getItem('ajr_session_token') ?? ''; }
function af(path, init) {
    return fetch(path, { ...init, headers: { 'x-session-token': tok(), 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
}
export default function PlatformApp() {
    const [authed, setAuthed] = useState(null);
    const [tab, setTab] = useState('tenants');
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [engineOk, setEngineOk] = useState(null);
    const [tForm, setTForm] = useState({ name: '', email: '', tenant_id: '' });
    const [dForm, setDForm] = useState({ tenant_id: '', domain: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    useEffect(() => {
        if (!tok()) {
            window.location.href = '/operations/raven/login';
            return;
        }
        fetch('/api/auth/session', { headers: { 'x-session-token': tok() } })
            .then(r => { if (r.ok)
            setAuthed(true);
        else
            window.location.href = '/operations/raven/login'; })
            .catch(() => { window.location.href = '/operations/raven/login'; });
    }, []);
    const loadTenants = useCallback(async () => {
        setLoading(true);
        try {
            const r = await af('/api/platform/tenants');
            if (r.ok)
                setTenants(await r.json());
        }
        finally {
            setLoading(false);
        }
    }, []);
    const checkEngine = useCallback(async () => {
        try {
            const r = await af('/api/platform/health');
            setEngineOk(r.ok);
        }
        catch {
            setEngineOk(false);
        }
    }, []);
    useEffect(() => { if (authed) {
        loadTenants();
        checkEngine();
    } }, [authed, loadTenants, checkEngine]);
    function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    async function createTenant(e) {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const r = await af('/api/platform/tenants', { method: 'POST', body: JSON.stringify(tForm) });
            const d = await r.json();
            if (!r.ok) {
                setErr(d.error ?? 'Failed');
                return;
            }
            setTForm({ name: '', email: '', tenant_id: '' });
            setTab('tenants');
            await loadTenants();
        }
        finally {
            setSaving(false);
        }
    }
    async function addDomain(e) {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const r = await af('/api/platform/domains', { method: 'POST', body: JSON.stringify(dForm) });
            const d = await r.json();
            if (!r.ok) {
                setErr(d.error ?? 'Failed');
                return;
            }
            setDForm({ tenant_id: '', domain: '' });
            await loadTenants();
        }
        finally {
            setSaving(false);
        }
    }
    async function setStatus(id, status) {
        await af(`/api/platform/tenants/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
        await loadTenants();
    }
    if (authed === null)
        return _jsx("div", { style: { minHeight: '100vh', background: '#0a0a0a' } });
    return (_jsxs("div", { style: { minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui,-apple-system,sans-serif', color: '#f8fafc' }, children: [_jsxs("div", { style: { background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '0 1.5rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("div", { style: { background: `${ACCENT}18`, border: `1px solid ${ACCENT}33`, borderRadius: '4px', padding: '2px 8px' }, children: _jsx("span", { style: { color: ACCENT, fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }, children: "DAS / PLATFORM" }) }), _jsx("span", { style: { fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }, children: "Avatar Factory" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' }, children: [_jsx("div", { style: { width: 6, height: 6, borderRadius: '50%', background: engineOk === true ? '#22c55e' : engineOk === false ? '#ef4444' : '#6b7280' } }), _jsx("span", { style: { color: 'rgba(248,250,252,0.3)', fontSize: '0.72rem' }, children: engineOk === true ? 'engine online' : engineOk === false ? 'engine offline' : 'checking...' })] }), _jsx("a", { href: "/operations/raven/hub", style: { color: 'rgba(248,250,252,0.3)', fontSize: '0.78rem', textDecoration: 'none' }, children: "\u2190 RAVEN Hub" })] })] }), _jsx("div", { style: { background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '0 1.5rem', display: 'flex', gap: '0.25rem' }, children: [['tenants', `Tenants (${tenants.length})`], ['new', '+ New Tenant'], ['domains', '+ Add Domain']].map(([t, label]) => (_jsx("button", { onClick: () => { setTab(t); setErr(''); }, style: {
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem',
                        fontSize: '0.82rem', fontWeight: tab === t ? 600 : 400, fontFamily: 'inherit',
                        color: tab === t ? ACCENT : 'rgba(248,250,252,0.4)',
                        borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
                        transition: 'all 0.15s',
                    }, children: label }, t))) }), _jsxs("div", { style: { padding: '1.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }, children: [tab === 'tenants' && (_jsxs("div", { children: [loading && _jsx("div", { style: { color: 'rgba(248,250,252,0.3)', fontSize: '0.85rem' }, children: "Loading..." }), !loading && !tenants.length && (_jsxs("div", { style: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '3rem', textAlign: 'center', color: 'rgba(248,250,252,0.3)' }, children: ["No tenants yet.", ' ', _jsx("button", { onClick: () => setTab('new'), style: { background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }, children: "Create the first one." })] })), tenants.map(t => (_jsx("div", { style: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '0.75rem' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }, children: t.name }), _jsxs("div", { style: { color: 'rgba(248,250,252,0.4)', fontSize: '0.8rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }, children: [_jsx("span", { children: t.email }), _jsxs("span", { style: { fontFamily: 'monospace', color: 'rgba(248,250,252,0.25)' }, children: ["id: ", t.tenant_id] }), _jsx("span", { children: new Date(t.created_at).toLocaleDateString() })] }), t.domains?.length ? (_jsx("div", { style: { marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }, children: t.domains.map(d => (_jsx("span", { style: { background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '1px 8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.5)' }, children: d }, d))) })) : (_jsx("button", { onClick: () => { setDForm(p => ({ ...p, tenant_id: t.tenant_id })); setTab('domains'); }, style: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,250,252,0.25)', fontSize: '0.75rem', fontFamily: 'inherit', marginTop: '0.3rem', padding: 0 }, children: "+ add domain" }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }, children: [_jsx("span", { style: { background: `${STATUS_COLORS[t.status]}18`, border: `1px solid ${STATUS_COLORS[t.status]}44`, color: STATUS_COLORS[t.status], fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }, children: t.status }), _jsxs("select", { value: t.status, onChange: e => setStatus(t.tenant_id, e.target.value), style: { background: '#1a1a1a', border: `1px solid ${BORDER}`, color: 'rgba(248,250,252,0.6)', fontSize: '0.78rem', padding: '3px 6px', borderRadius: '4px', fontFamily: 'inherit', cursor: 'pointer' }, children: [_jsx("option", { value: "provisioning", children: "provisioning" }), _jsx("option", { value: "active", children: "active" }), _jsx("option", { value: "suspended", children: "suspended" })] })] })] }) }, t.id)))] })), tab === 'new' && (_jsx("div", { style: { maxWidth: '480px' }, children: _jsxs("div", { style: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.5rem' }, children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(248,250,252,0.8)' }, children: "Create Avatar Instance" }), _jsxs("form", { onSubmit: createTenant, children: [[
                                            { key: 'name', label: 'Client Name', placeholder: 'John Doe', required: true },
                                            { key: 'email', label: 'Email', placeholder: 'john@example.com', required: true },
                                            { key: 'tenant_id', label: 'Tenant ID (slug)', placeholder: 'auto-generated from name', required: false },
                                        ].map(f => (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }, children: f.label }), _jsx("input", { value: tForm[f.key], onChange: e => {
                                                        const val = e.target.value;
                                                        setTForm(p => {
                                                            const next = { ...p, [f.key]: val };
                                                            if (f.key === 'name' && !p.tenant_id)
                                                                next.tenant_id = slugify(val);
                                                            return next;
                                                        });
                                                    }, placeholder: f.placeholder, required: f.required, style: { width: '100%', background: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' } })] }, f.key))), err && _jsx("div", { style: { color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem' }, children: err }), _jsx("div", { style: { fontSize: '0.75rem', color: 'rgba(248,250,252,0.3)', marginBottom: '1rem', lineHeight: 1.5 }, children: "Add domains separately after creating the tenant. Point DNS A records to 147.93.119.147." }), _jsx("button", { type: "submit", disabled: saving, style: { background: ACCENT, border: 'none', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }, children: saving ? 'Creating...' : 'Create Tenant' })] })] }) })), tab === 'domains' && (_jsx("div", { style: { maxWidth: '480px' }, children: _jsxs("div", { style: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.5rem' }, children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(248,250,252,0.8)' }, children: "Add Domain to Tenant" }), _jsxs("form", { onSubmit: addDomain, children: [_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }, children: "Tenant" }), _jsxs("select", { value: dForm.tenant_id, onChange: e => setDForm(p => ({ ...p, tenant_id: e.target.value })), required: true, style: { width: '100%', background: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }, children: [_jsx("option", { value: "", children: "Select tenant..." }), tenants.map(t => _jsxs("option", { value: t.tenant_id, children: [t.name, " (", t.tenant_id, ")"] }, t.tenant_id))] })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }, children: "Domain" }), _jsx("input", { value: dForm.domain, onChange: e => setDForm(p => ({ ...p, domain: e.target.value })), placeholder: "johndoe.com", required: true, style: { width: '100%', background: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' } })] }), err && _jsx("div", { style: { color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem' }, children: err }), _jsx("button", { type: "submit", disabled: saving, style: { background: ACCENT, border: 'none', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }, children: saving ? 'Adding...' : 'Add Domain' })] })] }) }))] })] }));
}
