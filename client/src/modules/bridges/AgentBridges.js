import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
const STATUS_COLOR = {
    planned: '#9ca3af',
    in_progress: '#f59e0b',
    active: '#10b981',
    paused: '#6b7280',
};
const STATUS_LABEL = {
    planned: 'Planned',
    in_progress: 'In Progress',
    active: 'Active',
    paused: 'Paused',
};
export default function AgentBridges() {
    const [bridges, setBridges] = useState([]);
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('read');
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [hoveredId, setHoveredId] = useState(null);
    useEffect(() => { load(); }, []);
    async function load() {
        const r = await fetch('/api/bridges');
        setBridges(await r.json());
    }
    async function select(b) {
        const r = await fetch(`/api/bridges/${b.id}`);
        setSelected(await r.json());
        setView('read');
    }
    function startEdit() {
        if (!selected)
            return;
        setEditName(selected.name);
        setEditStatus(selected.status);
        setEditDesc(selected.description);
        setEditContent(selected.content ?? '');
        setView('edit');
    }
    async function save() {
        if (!selected)
            return;
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
        if (!newName.trim())
            return;
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
    async function deleteBridge(id, e) {
        e.stopPropagation();
        await fetch(`/api/bridges/${id}`, { method: 'DELETE' });
        setBridges(bs => bs.filter(b => b.id !== id));
        if (selected?.id === id)
            setSelected(null);
    }
    function fmt(s) {
        return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return (_jsxs("div", { style: { display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }, children: [_jsxs("div", { style: { width: '260px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }, children: [_jsxs("div", { style: { padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }, children: "Agent Bridges" }), _jsx("div", { style: { fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }, children: "Connected tools & integrations" })] }), _jsx("button", { onClick: () => { setCreating(v => !v); setNewName(''); }, style: { background: creating ? `${GOLD}22` : 'transparent', border: `1px solid ${creating ? GOLD : '#d1d5db'}`, borderRadius: '5px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: creating ? GOLD : '#6b7280', fontSize: '1.1rem' }, children: "+" })] }), creating && (_jsxs("div", { style: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }, children: [_jsx("input", { autoFocus: true, value: newName, onChange: e => setNewName(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    create(); if (e.key === 'Escape')
                                    setCreating(false); }, placeholder: "Bridge name\u2026", style: { width: '100%', boxSizing: 'border-box', border: `1px solid ${GOLD}88`, borderRadius: '5px', padding: '0.38rem 0.55rem', fontSize: '0.85rem', outline: 'none' } }), _jsxs("div", { style: { display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }, children: [_jsx("button", { onClick: create, style: { flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }, children: "Create" }), _jsx("button", { onClick: () => setCreating(false), style: { flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }, children: "Cancel" })] })] })), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '0.4rem 0' }, children: [bridges.length === 0 && (_jsx("p", { style: { fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }, children: "No bridges yet" })), bridges.map(b => (_jsxs("div", { onClick: () => select(b), onMouseEnter: () => setHoveredId(b.id), onMouseLeave: () => setHoveredId(null), style: {
                                    padding: '0.7rem 1rem',
                                    background: selected?.id === b.id ? `${GOLD}14` : hoveredId === b.id ? '#f3f4f6' : 'transparent',
                                    borderLeft: selected?.id === b.id ? `3px solid ${GOLD}` : '3px solid transparent',
                                    cursor: 'pointer', transition: 'background 0.1s',
                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
                                }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: '0.88rem', fontWeight: selected?.id === b.id ? 600 : 400, color: selected?.id === b.id ? NAVY : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: b.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }, children: [_jsx("span", { style: { width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLOR[b.status] ?? '#9ca3af', flexShrink: 0, display: 'inline-block' } }), _jsx("span", { style: { fontSize: '0.72rem', color: '#9ca3af' }, children: STATUS_LABEL[b.status] ?? b.status })] })] }), hoveredId === b.id && (_jsx("button", { onClick: e => deleteBridge(b.id, e), style: { background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }, onMouseEnter: e => (e.currentTarget.style.color = '#ef4444'), onMouseLeave: e => (e.currentTarget.style.color = '#d1d5db'), children: "\u2715" }))] }, b.id)))] })] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [!selected && (_jsxs("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }, children: [_jsxs("svg", { width: "38", height: "38", viewBox: "0 0 24 24", fill: "none", stroke: "#d1d5db", strokeWidth: "1.5", children: [_jsx("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), _jsx("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })] }), _jsx("p", { style: { margin: 0, fontSize: '0.9rem' }, children: "Select a bridge to view its documentation" })] })), selected && view === 'read' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.65rem' }, children: [_jsx("h2", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY }, children: selected.name }), _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '0.35rem', background: `${STATUS_COLOR[selected.status]}18`, border: `1px solid ${STATUS_COLOR[selected.status]}44`, borderRadius: '20px', padding: '0.15rem 0.6rem' }, children: [_jsx("span", { style: { width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLOR[selected.status], display: 'inline-block' } }), _jsx("span", { style: { fontSize: '0.72rem', fontWeight: 600, color: STATUS_COLOR[selected.status] }, children: STATUS_LABEL[selected.status] })] })] }), selected.description && (_jsx("p", { style: { margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7280' }, children: selected.description }))] }), _jsx("button", { onClick: startEdit, style: { background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }, children: "Edit" })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }, children: [_jsx("pre", { style: { margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.9rem', lineHeight: 1.8, color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: selected.content || _jsx("span", { style: { color: '#aaa', fontStyle: 'italic' }, children: "No documentation yet \u2014 click Edit to add it." }) }), _jsxs("p", { style: { marginTop: '2rem', fontSize: '0.75rem', color: '#d1d5db' }, children: ["Last updated ", fmt(selected.updated_at)] })] })] })), selected && view === 'edit' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }, children: [_jsx("input", { value: editName, onChange: e => setEditName(e.target.value), style: { fontSize: '1rem', fontWeight: 700, color: NAVY, border: 'none', outline: 'none', background: 'transparent', minWidth: '160px', flex: 1 } }), _jsxs("select", { value: editStatus, onChange: e => setEditStatus(e.target.value), style: { border: '1px solid #e5e7eb', borderRadius: '5px', padding: '0.3rem 0.5rem', fontSize: '0.82rem', color: '#374151', cursor: 'pointer', outline: 'none' }, children: [_jsx("option", { value: "planned", children: "Planned" }), _jsx("option", { value: "in_progress", children: "In Progress" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "paused", children: "Paused" })] }), _jsx("input", { value: editDesc, onChange: e => setEditDesc(e.target.value), placeholder: "Short description\u2026", style: { border: '1px solid #e5e7eb', borderRadius: '5px', padding: '0.3rem 0.6rem', fontSize: '0.82rem', outline: 'none', minWidth: '180px' } }), _jsxs("div", { style: { display: 'flex', gap: '0.45rem', marginLeft: 'auto' }, children: [_jsx("button", { onClick: () => setView('read'), style: { background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', cursor: 'pointer' }, children: "Cancel" }), _jsx("button", { onClick: save, disabled: saving, style: { background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }, children: saving ? 'Saving…' : 'Save' })] })] }), _jsx("textarea", { value: editContent, onChange: e => setEditContent(e.target.value), style: { flex: 1, resize: 'none', border: 'none', outline: 'none', padding: '1.5rem 2rem', fontSize: '0.9rem', lineHeight: 1.8, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937', background: '#fff' }, placeholder: "Document this bridge \u2014 accounts, endpoints, phases, resume phrase, agent instructions\u2026" })] }))] })] }));
}
