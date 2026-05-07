import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = '#080a12';
const SURFACE = 'rgba(255,255,255,0.04)';
const SURF2 = 'rgba(255,255,255,0.07)';
const BORDER = 'rgba(201,168,64,0.14)';
const GOLD = '#c9a840';
const GOLD_G = 'linear-gradient(90deg,#5c3d08 0%,#b8860b 20%,#f0d060 45%,#fffacd 55%,#f0d060 70%,#b8860b 85%,#5c3d08 100%)';
const GOLD_T = 'linear-gradient(180deg,#fff5a8 0%,#f0d060 28%,#c9a840 52%,#8b6008 72%,#c9a840 88%,#fff5a8 100%)';
const TEXT = '#ffffff';
const TEXT_S = 'rgba(255,255,255,0.55)';
const TEXT_M = 'rgba(255,255,255,0.32)';
const RED = '#ef4444';
const TABS = [
    { id: 'profile', label: 'Profile' },
    { id: 'services', label: 'Services' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'credentials', label: 'Credentials' },
    { id: 'skills', label: 'Skills' },
];
function authHeader() {
    const token = localStorage.getItem('ajr_session_token') ?? '';
    return { 'x-session-token': token, 'Content-Type': 'application/json' };
}
// ── Shared input styles ───────────────────────────────────────────────────────
const inputStyle = {
    width: '100%', background: SURF2,
    border: `1px solid ${BORDER}`, borderRadius: '6px',
    color: TEXT, fontSize: '0.9rem', padding: '0.75rem 0.9rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
};
const labelStyle = {
    display: 'block', fontSize: '0.65rem', fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: TEXT_M, marginBottom: '0.35rem',
};
const btnPrimary = {
    background: GOLD_G, border: 'none', cursor: 'pointer',
    color: '#1a0e00', fontWeight: 800, fontSize: '0.78rem',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '0.65rem 1.4rem', borderRadius: '5px',
};
const btnDanger = {
    background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`,
    cursor: 'pointer', color: RED,
    fontWeight: 600, fontSize: '0.75rem',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '0.55rem 1rem', borderRadius: '5px',
};
const btnGhost = {
    background: SURFACE, border: `1px solid ${BORDER}`,
    cursor: 'pointer', color: TEXT_S,
    fontWeight: 600, fontSize: '0.78rem',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '0.65rem 1.25rem', borderRadius: '5px',
};
function Field({ label, children }) {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 0 }, children: [_jsx("label", { style: labelStyle, children: label }), children] }));
}
// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
    const [form, setForm] = useState({ tagline: '', headline: '', bio: '', website_url: '', social_links: {} });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const bannerRef = useRef(null);
    useEffect(() => {
        fetch('/api/identity/profile')
            .then(r => r.json())
            .then(d => {
            setForm({
                tagline: d.tagline ?? '',
                headline: d.headline ?? '',
                bio: d.bio ?? '',
                website_url: d.website_url ?? '',
                social_links: typeof d.social_links === 'object' && d.social_links ? d.social_links : {},
            });
        })
            .catch(() => { });
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
    async function uploadBanner(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
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
    function setSocial(key, val) {
        setForm(f => ({ ...f, social_links: { ...f.social_links, [key]: val } }));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }, children: "Profile & Identity" }), _jsx("button", { onClick: save, disabled: saving, style: btnPrimary, children: saved ? '✓ Saved' : saving ? 'Saving…' : 'Save' })] }), _jsx(Field, { label: "Headline / Title", children: _jsx("input", { style: inputStyle, value: form.headline, onChange: e => setForm(f => ({ ...f, headline: e.target.value })), placeholder: "e.g. Founder & Systems Architect" }) }), _jsx(Field, { label: "Tagline (hero display)", children: _jsx("input", { style: inputStyle, value: form.tagline, onChange: e => setForm(f => ({ ...f, tagline: e.target.value })), placeholder: "e.g. Strategy. Systems. Execution." }) }), _jsx(Field, { label: "Bio", children: _jsx("textarea", { style: { ...inputStyle, minHeight: '140px', resize: 'vertical' }, value: form.bio, onChange: e => setForm(f => ({ ...f, bio: e.target.value })), placeholder: "Write your professional bio here..." }) }), _jsx(Field, { label: "Website URL", children: _jsx("input", { style: inputStyle, value: form.website_url, onChange: e => setForm(f => ({ ...f, website_url: e.target.value })), placeholder: "https://yourwebsite.com" }) }), _jsxs("div", { children: [_jsx("div", { style: labelStyle, children: "Social Links" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.6rem' }, children: ['LinkedIn', 'Twitter', 'GitHub', 'Instagram', 'YouTube'].map(k => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.5rem', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: '0.78rem', color: TEXT_S, fontWeight: 600 }, children: k }), _jsx("input", { style: inputStyle, value: form.social_links[k] ?? '', onChange: e => setSocial(k, e.target.value), placeholder: `https://...` })] }, k))) })] }), _jsxs("div", { children: [_jsx("div", { style: labelStyle, children: "Hero Banner Photo" }), _jsxs("div", { style: {
                            border: `1px dashed rgba(201,168,64,0.2)`, borderRadius: '8px',
                            padding: '1.5rem', textAlign: 'center',
                        }, children: [_jsx("div", { style: { fontSize: '0.85rem', color: TEXT_S, marginBottom: '0.75rem' }, children: uploading ? 'Uploading…' : 'Upload a background photo for your hero section' }), _jsx("input", { ref: bannerRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: uploadBanner }), _jsx("button", { onClick: () => bannerRef.current?.click(), style: btnGhost, children: "Choose Photo" })] })] })] }));
}
function ServicesTab() {
    const [items, setItems] = useState([]);
    const [adding, setAdding] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', description: '', price_range: '', icon: '◆' });
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetch('/api/identity/services').then(r => r.json()).then(d => setItems(d)).catch(() => { });
    }, []);
    async function addItem() {
        setSaving(true);
        const r = await fetch('/api/identity/services', {
            method: 'POST', headers: authHeader(), body: JSON.stringify(newItem),
        });
        const saved = await r.json();
        setItems(prev => [...prev, saved]);
        setNewItem({ title: '', description: '', price_range: '', icon: '◆' });
        setAdding(false);
        setSaving(false);
    }
    async function deleteItem(id) {
        await fetch(`/api/identity/services/${id}`, { method: 'DELETE', headers: authHeader() });
        setItems(prev => prev.filter(i => i.id !== id));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }, children: "Services" }), _jsx("button", { onClick: () => setAdding(true), style: btnPrimary, children: "+ Add Service" })] }), items.map(item => (_jsxs("div", { style: {
                    background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
                    padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontWeight: 700, color: TEXT, marginBottom: '0.2rem' }, children: [item.icon, " ", item.title] }), item.description && _jsx("div", { style: { fontSize: '0.82rem', color: TEXT_S }, children: item.description }), item.price_range && _jsx("div", { style: { fontSize: '0.72rem', color: GOLD, marginTop: '0.25rem' }, children: item.price_range })] }), _jsx("button", { onClick: () => item.id !== undefined && deleteItem(item.id), style: btnDanger, children: "Delete" })] }, item.id))), adding && (_jsxs("div", { style: { background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }, children: [_jsx("h4", { style: { margin: 0, fontSize: '0.88rem', color: GOLD }, children: "New Service" }), _jsx(Field, { label: "Icon (emoji or symbol)", children: _jsx("input", { style: { ...inputStyle, width: '80px' }, value: newItem.icon, onChange: e => setNewItem(p => ({ ...p, icon: e.target.value })) }) }), _jsx(Field, { label: "Title", children: _jsx("input", { style: inputStyle, value: newItem.title, onChange: e => setNewItem(p => ({ ...p, title: e.target.value })), placeholder: "Service name" }) }), _jsx(Field, { label: "Description", children: _jsx("textarea", { style: { ...inputStyle, minHeight: '80px', resize: 'vertical' }, value: newItem.description, onChange: e => setNewItem(p => ({ ...p, description: e.target.value })), placeholder: "What does this service include?" }) }), _jsx(Field, { label: "Price Range", children: _jsx("input", { style: inputStyle, value: newItem.price_range, onChange: e => setNewItem(p => ({ ...p, price_range: e.target.value })), placeholder: "e.g. Starting at $500 / month" }) }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: addItem, disabled: saving || !newItem.title, style: btnPrimary, children: saving ? 'Adding…' : 'Add Service' }), _jsx("button", { onClick: () => setAdding(false), style: btnGhost, children: "Cancel" })] })] }))] }));
}
function ExperienceTab() {
    const [items, setItems] = useState([]);
    const [adding, setAdding] = useState(false);
    const blank = { title: '', company: '', start_date: '', end_date: '', is_current: false, description: '' };
    const [newItem, setNewItem] = useState(blank);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetch('/api/identity/experience').then(r => r.json()).then(d => setItems(d)).catch(() => { });
    }, []);
    async function addItem() {
        setSaving(true);
        const r = await fetch('/api/identity/experience', {
            method: 'POST', headers: authHeader(), body: JSON.stringify(newItem),
        });
        const saved = await r.json();
        setItems(prev => [saved, ...prev]);
        setNewItem(blank);
        setAdding(false);
        setSaving(false);
    }
    async function deleteItem(id) {
        await fetch(`/api/identity/experience/${id}`, { method: 'DELETE', headers: authHeader() });
        setItems(prev => prev.filter(i => i.id !== id));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }, children: "Work History" }), _jsx("button", { onClick: () => setAdding(true), style: btnPrimary, children: "+ Add Position" })] }), items.map(item => (_jsxs("div", { style: {
                    background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
                    padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, color: TEXT }, children: item.title }), _jsx("div", { style: { fontSize: '0.85rem', color: GOLD }, children: item.company }), _jsxs("div", { style: { fontSize: '0.75rem', color: TEXT_M, marginTop: '0.2rem' }, children: [item.start_date, item.is_current ? ' — Present' : item.end_date ? ` — ${item.end_date}` : ''] }), item.description && _jsx("div", { style: { fontSize: '0.82rem', color: TEXT_S, marginTop: '0.4rem' }, children: item.description })] }), _jsx("button", { onClick: () => item.id !== undefined && deleteItem(item.id), style: btnDanger, children: "Delete" })] }, item.id))), adding && (_jsxs("div", { style: { background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }, children: [_jsx("h4", { style: { margin: 0, fontSize: '0.88rem', color: GOLD }, children: "New Position" }), _jsx(Field, { label: "Job Title", children: _jsx("input", { style: inputStyle, value: newItem.title, onChange: e => setNewItem(p => ({ ...p, title: e.target.value })), placeholder: "e.g. Founder & CEO" }) }), _jsx(Field, { label: "Company", children: _jsx("input", { style: inputStyle, value: newItem.company, onChange: e => setNewItem(p => ({ ...p, company: e.target.value })), placeholder: "Company name" }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }, children: [_jsx(Field, { label: "Start Date", children: _jsx("input", { style: inputStyle, value: newItem.start_date, onChange: e => setNewItem(p => ({ ...p, start_date: e.target.value })), placeholder: "e.g. Jan 2020" }) }), _jsx(Field, { label: "End Date", children: _jsx("input", { style: inputStyle, value: newItem.end_date, onChange: e => setNewItem(p => ({ ...p, end_date: e.target.value })), placeholder: "e.g. Present", disabled: newItem.is_current }) })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: TEXT_S }, children: [_jsx("input", { type: "checkbox", checked: newItem.is_current, onChange: e => setNewItem(p => ({ ...p, is_current: e.target.checked })) }), "Currently in this role"] }), _jsx(Field, { label: "Description", children: _jsx("textarea", { style: { ...inputStyle, minHeight: '80px', resize: 'vertical' }, value: newItem.description, onChange: e => setNewItem(p => ({ ...p, description: e.target.value })), placeholder: "Key responsibilities and achievements" }) }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: addItem, disabled: saving || !newItem.title || !newItem.company, style: btnPrimary, children: saving ? 'Adding…' : 'Add Position' }), _jsx("button", { onClick: () => setAdding(false), style: btnGhost, children: "Cancel" })] })] }))] }));
}
function ProjectsTab() {
    const [items, setItems] = useState([]);
    const [adding, setAdding] = useState(false);
    const blank = { title: '', description: '', url: '', tags: '' };
    const [newItem, setNewItem] = useState(blank);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetch('/api/identity/projects').then(r => r.json()).then(d => {
            setItems(d.map(p => ({
                ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
            })));
        }).catch(() => { });
    }, []);
    async function addItem() {
        setSaving(true);
        const payload = { ...newItem, tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean) };
        const r = await fetch('/api/identity/projects', {
            method: 'POST', headers: authHeader(), body: JSON.stringify(payload),
        });
        const saved = await r.json();
        setItems(prev => [{ ...saved, tags: saved.tags.join(', ') }, ...prev]);
        setNewItem(blank);
        setAdding(false);
        setSaving(false);
    }
    async function deleteItem(id) {
        await fetch(`/api/identity/projects/${id}`, { method: 'DELETE', headers: authHeader() });
        setItems(prev => prev.filter(i => i.id !== id));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }, children: "Portfolio Projects" }), _jsx("button", { onClick: () => setAdding(true), style: btnPrimary, children: "+ Add Project" })] }), items.map(item => (_jsxs("div", { style: {
                    background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
                    padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, color: TEXT }, children: item.title }), item.description && _jsx("div", { style: { fontSize: '0.82rem', color: TEXT_S, marginTop: '0.2rem' }, children: item.description }), item.tags && _jsx("div", { style: { fontSize: '0.72rem', color: GOLD, marginTop: '0.3rem' }, children: item.tags }), item.url && _jsx("a", { href: item.url, target: "_blank", rel: "noopener noreferrer", style: { fontSize: '0.75rem', color: TEXT_M }, children: item.url })] }), _jsx("button", { onClick: () => item.id !== undefined && deleteItem(item.id), style: btnDanger, children: "Delete" })] }, item.id))), adding && (_jsxs("div", { style: { background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }, children: [_jsx("h4", { style: { margin: 0, fontSize: '0.88rem', color: GOLD }, children: "New Project" }), _jsx(Field, { label: "Project Title", children: _jsx("input", { style: inputStyle, value: newItem.title, onChange: e => setNewItem(p => ({ ...p, title: e.target.value })), placeholder: "Project name" }) }), _jsx(Field, { label: "Description", children: _jsx("textarea", { style: { ...inputStyle, minHeight: '80px', resize: 'vertical' }, value: newItem.description, onChange: e => setNewItem(p => ({ ...p, description: e.target.value })), placeholder: "What did you build?" }) }), _jsx(Field, { label: "URL", children: _jsx("input", { style: inputStyle, value: newItem.url, onChange: e => setNewItem(p => ({ ...p, url: e.target.value })), placeholder: "https://..." }) }), _jsx(Field, { label: "Tags (comma separated)", children: _jsx("input", { style: inputStyle, value: newItem.tags, onChange: e => setNewItem(p => ({ ...p, tags: e.target.value })), placeholder: "e.g. React, Node.js, PostgreSQL" }) }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: addItem, disabled: saving || !newItem.title, style: btnPrimary, children: saving ? 'Adding…' : 'Add Project' }), _jsx("button", { onClick: () => setAdding(false), style: btnGhost, children: "Cancel" })] })] }))] }));
}
function CredentialsTab() {
    const [items, setItems] = useState([]);
    const [adding, setAdding] = useState(false);
    const blank = { title: '', issuer: '', issued_date: '', credential_url: '' };
    const [newItem, setNewItem] = useState(blank);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetch('/api/identity/credentials').then(r => r.json()).then(d => setItems(d)).catch(() => { });
    }, []);
    async function addItem() {
        setSaving(true);
        const r = await fetch('/api/identity/credentials', {
            method: 'POST', headers: authHeader(), body: JSON.stringify(newItem),
        });
        const saved = await r.json();
        setItems(prev => [...prev, saved]);
        setNewItem(blank);
        setAdding(false);
        setSaving(false);
    }
    async function deleteItem(id) {
        await fetch(`/api/identity/credentials/${id}`, { method: 'DELETE', headers: authHeader() });
        setItems(prev => prev.filter(i => i.id !== id));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }, children: "Credentials & Certifications" }), _jsx("button", { onClick: () => setAdding(true), style: btnPrimary, children: "+ Add Credential" })] }), items.map(item => (_jsxs("div", { style: {
                    background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px',
                    padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, color: TEXT }, children: item.title }), item.issuer && _jsx("div", { style: { fontSize: '0.82rem', color: GOLD }, children: item.issuer }), item.issued_date && _jsx("div", { style: { fontSize: '0.72rem', color: TEXT_M }, children: item.issued_date })] }), _jsx("button", { onClick: () => item.id !== undefined && deleteItem(item.id), style: btnDanger, children: "Delete" })] }, item.id))), adding && (_jsxs("div", { style: { background: SURF2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }, children: [_jsx("h4", { style: { margin: 0, fontSize: '0.88rem', color: GOLD }, children: "New Credential" }), _jsx(Field, { label: "Title / Certification Name", children: _jsx("input", { style: inputStyle, value: newItem.title, onChange: e => setNewItem(p => ({ ...p, title: e.target.value })), placeholder: "e.g. AWS Solutions Architect" }) }), _jsx(Field, { label: "Issuing Organization", children: _jsx("input", { style: inputStyle, value: newItem.issuer, onChange: e => setNewItem(p => ({ ...p, issuer: e.target.value })), placeholder: "e.g. Amazon Web Services" }) }), _jsx(Field, { label: "Date Issued", children: _jsx("input", { style: inputStyle, value: newItem.issued_date, onChange: e => setNewItem(p => ({ ...p, issued_date: e.target.value })), placeholder: "e.g. March 2024" }) }), _jsx(Field, { label: "Credential URL", children: _jsx("input", { style: inputStyle, value: newItem.credential_url, onChange: e => setNewItem(p => ({ ...p, credential_url: e.target.value })), placeholder: "https://..." }) }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: addItem, disabled: saving || !newItem.title, style: btnPrimary, children: saving ? 'Adding…' : 'Add Credential' }), _jsx("button", { onClick: () => setAdding(false), style: btnGhost, children: "Cancel" })] })] }))] }));
}
function SkillsTab() {
    const [items, setItems] = useState([]);
    const [newName, setNewName] = useState('');
    const [newCat, setNewCat] = useState('General');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetch('/api/identity/skills').then(r => r.json()).then(d => setItems(d)).catch(() => { });
    }, []);
    async function addSkill() {
        if (!newName.trim())
            return;
        setSaving(true);
        const r = await fetch('/api/identity/skills', {
            method: 'POST', headers: authHeader(), body: JSON.stringify({ name: newName.trim(), category: newCat }),
        });
        const saved = await r.json();
        setItems(prev => [...prev, saved]);
        setNewName('');
        setSaving(false);
    }
    async function deleteSkill(id) {
        await fetch(`/api/identity/skills/${id}`, { method: 'DELETE', headers: authHeader() });
        setItems(prev => prev.filter(i => i.id !== id));
    }
    const byCategory = {};
    for (const s of items) {
        const c = s.category || 'General';
        if (!byCategory[c])
            byCategory[c] = [];
        byCategory[c].push(s);
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '1rem', fontWeight: 700, color: TEXT }, children: "Skills" }), _jsxs("div", { style: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }, children: [_jsx("input", { style: { ...inputStyle, flex: '1 1 180px' }, value: newName, onChange: e => setNewName(e.target.value), onKeyDown: e => e.key === 'Enter' && addSkill(), placeholder: "Skill name" }), _jsx("input", { style: { ...inputStyle, flex: '0 1 140px' }, value: newCat, onChange: e => setNewCat(e.target.value), placeholder: "Category" }), _jsx("button", { onClick: addSkill, disabled: saving || !newName.trim(), style: btnPrimary, children: saving ? '…' : '+ Add' })] }), Object.entries(byCategory).map(([cat, skills]) => (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.6rem' }, children: cat }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }, children: skills.map(s => (_jsxs("div", { style: {
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: SURF2, border: `1px solid ${BORDER}`,
                                borderRadius: '4px', padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem', color: TEXT_S,
                            }, children: [s.name, _jsx("button", { onClick: () => s.id !== undefined && deleteSkill(s.id), style: { background: 'none', border: 'none', cursor: 'pointer', color: TEXT_M, padding: 0, fontSize: '0.8rem', lineHeight: 1 }, children: "\u00D7" })] }, s.id))) })] }, cat)))] }));
}
// ── Root editor ───────────────────────────────────────────────────────────────
export default function IdentityEditor() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('profile');
    const [authed, setAuthed] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('ajr_session_token') ?? '';
        if (!token) {
            setAuthed(false);
            return;
        }
        fetch('/api/auth/session', { headers: { 'x-session-token': token } })
            .then(r => setAuthed(r.ok))
            .catch(() => setAuthed(false));
    }, []);
    if (authed === null)
        return _jsx("div", { style: { minHeight: '100vh', background: BG } });
    if (!authed) {
        navigate('/operations/raven/login');
        return null;
    }
    return (_jsxs("div", { style: {
            minHeight: '100vh', background: BG,
            fontFamily: 'system-ui, -apple-system, sans-serif', color: TEXT,
            display: 'flex', flexDirection: 'column',
        }, children: [_jsxs("header", { style: {
                    height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1.5rem',
                    background: 'rgba(0,0,0,0.5)', borderBottom: `1px solid ${BORDER}`,
                    position: 'sticky', top: 0, zIndex: 10,
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("a", { href: "/", style: { textDecoration: 'none' }, children: _jsx("span", { style: {
                                        background: GOLD_T, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                        fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                                    }, children: "PAGIOSystems" }) }), _jsx("span", { style: { color: TEXT_M, fontSize: '0.8rem' }, children: "/" }), _jsx("span", { style: { fontSize: '0.82rem', color: TEXT_S, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }, children: "Identity Editor" })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("a", { href: "/", style: { ...btnGhost, textDecoration: 'none', padding: '0.45rem 1rem', fontSize: '0.75rem' }, children: "View Live Site" }), _jsx("a", { href: "/operations/raven/hub", style: { ...btnGhost, textDecoration: 'none', padding: '0.45rem 1rem', fontSize: '0.75rem' }, children: "Dashboard" })] })] }), _jsxs("div", { style: { display: 'flex', flex: 1, overflow: 'hidden' }, children: [_jsx("aside", { style: {
                            width: '200px', flexShrink: 0,
                            background: 'rgba(0,0,0,0.35)', borderRight: `1px solid ${BORDER}`,
                            padding: '1.5rem 0',
                            display: 'flex', flexDirection: 'column', gap: '0.15rem',
                        }, children: TABS.map(t => (_jsx("button", { onClick: () => setTab(t.id), style: {
                                background: tab === t.id ? 'rgba(201,168,64,0.1)' : 'transparent',
                                border: 'none', borderLeft: `3px solid ${tab === t.id ? GOLD : 'transparent'}`,
                                cursor: 'pointer', color: tab === t.id ? GOLD : TEXT_S,
                                fontSize: '0.82rem', fontWeight: tab === t.id ? 700 : 500,
                                letterSpacing: '0.04em',
                                padding: '0.7rem 1.25rem', textAlign: 'left',
                                transition: 'all 0.15s',
                            }, children: t.label }, t.id))) }), _jsxs("main", { style: { flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }, children: [tab === 'profile' && _jsx(ProfileTab, {}), tab === 'services' && _jsx(ServicesTab, {}), tab === 'experience' && _jsx(ExperienceTab, {}), tab === 'projects' && _jsx(ProjectsTab, {}), tab === 'credentials' && _jsx(CredentialsTab, {}), tab === 'skills' && _jsx(SkillsTab, {})] })] })] }));
}
