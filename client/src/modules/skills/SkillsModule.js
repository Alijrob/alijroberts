import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
export default function SkillsModule() {
    const [skills, setSkills] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('read');
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolder, setNewFolder] = useState('');
    const [collapsed, setCollapsed] = useState(new Set());
    const [hoveredId, setHoveredId] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => { load(); }, []);
    async function load() {
        try {
            const [sr, fr] = await Promise.all([fetch('/api/skills'), fetch('/api/skill-folders')]);
            if (!sr.ok)
                throw new Error(String(sr.status));
            setSkills(await sr.json());
            setFolders(fr.ok ? await fr.json() : []);
            setError(null);
        }
        catch {
            setError('Could not load skills.');
        }
    }
    async function select(s) {
        const r = await fetch(`/api/skills/${s.id}`);
        setSelected(await r.json());
        setView('read');
    }
    function startEdit() {
        if (!selected)
            return;
        setEditName(selected.name);
        setEditDesc(selected.description);
        setEditContent(selected.content ?? '');
        setView('edit');
    }
    async function save() {
        if (!selected || !editName.trim())
            return;
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
        if (!newName.trim())
            return;
        const r = await fetch('/api/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim(), description: '', content: '' }),
        });
        const s = await r.json();
        setSkills(prev => [...prev, s].sort((a, z) => a.name.localeCompare(z.name)));
        setNewName('');
        setCreating(false);
        startEditFor(s);
    }
    async function createFolder() {
        if (!newFolder.trim())
            return;
        const r = await fetch('/api/skill-folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newFolder.trim() }),
        });
        const f = await r.json();
        setFolders(prev => [...prev, f].sort((a, z) => a.name.localeCompare(z.name)));
        setNewFolder('');
        setCreatingFolder(false);
    }
    async function deleteFolder(id, e) {
        e.stopPropagation();
        if (!confirm('Delete this folder? Its skills stay and become ungrouped.'))
            return;
        await fetch(`/api/skill-folders/${id}`, { method: 'DELETE' });
        setFolders(fs => fs.filter(f => f.id !== id));
        setSkills(ss => ss.map(s => s.folder_id === id ? { ...s, folder_id: null } : s));
    }
    async function moveToFolder(skill, folderId) {
        const r = await fetch(`/api/skills/${skill.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder_id: folderId }),
        });
        const updated = await r.json();
        setSkills(ss => ss.map(s => s.id === updated.id ? { ...s, folder_id: updated.folder_id } : s));
        setSelected(sel => sel && sel.id === updated.id ? { ...sel, folder_id: updated.folder_id } : sel);
    }
    function startEditFor(s) {
        setSelected(s);
        setEditName(s.name);
        setEditDesc(s.description ?? '');
        setEditContent(s.content ?? '');
        setView('edit');
    }
    async function deleteSkill(id, e) {
        e.stopPropagation();
        await fetch(`/api/skills/${id}`, { method: 'DELETE' });
        setSkills(ss => ss.filter(s => s.id !== id));
        if (selected?.id === id)
            setSelected(null);
    }
    function toggleCollapse(key) {
        setCollapsed(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    }
    function fmt(s) {
        return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const inputStyle = {
        width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '5px',
        padding: '0.45rem 0.6rem', fontSize: '0.88rem', outline: 'none',
    };
    function skillRow(s, indented) {
        return (_jsxs("div", { onClick: () => select(s), onMouseEnter: () => setHoveredId(s.id), onMouseLeave: () => setHoveredId(null), style: {
                padding: '0.55rem 1rem',
                paddingLeft: indented ? '1.6rem' : '1rem',
                background: selected?.id === s.id ? `${GOLD}14` : hoveredId === s.id ? '#f3f4f6' : 'transparent',
                borderLeft: selected?.id === s.id ? `3px solid ${GOLD}` : '3px solid transparent',
                cursor: 'pointer', transition: 'background 0.1s',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
            }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: '0.86rem', fontWeight: selected?.id === s.id ? 600 : 400, color: selected?.id === s.id ? NAVY : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: s.name }), s.description && (_jsx("div", { style: { fontSize: '0.72rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }, children: s.description }))] }), hoveredId === s.id && (_jsx("button", { onClick: e => deleteSkill(s.id, e), title: "Delete", style: { background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }, onMouseEnter: e => (e.currentTarget.style.color = '#ef4444'), onMouseLeave: e => (e.currentTarget.style.color = '#d1d5db'), children: "\u2715" }))] }, s.id));
    }
    const ungrouped = skills.filter(s => s.folder_id == null);
    return (_jsxs("div", { style: { display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }, children: [_jsxs("div", { style: { width: '260px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }, children: [_jsxs("div", { style: { padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }, children: "Skills" }), _jsx("div", { style: { fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }, children: "Stored, viewable, editable" })] }), _jsxs("div", { style: { display: 'flex', gap: '0.35rem' }, children: [_jsx("button", { onClick: () => { setCreatingFolder(v => !v); setNewFolder(''); setCreating(false); }, title: "New folder", style: { background: creatingFolder ? `${NAVY}14` : 'transparent', border: `1px solid ${creatingFolder ? NAVY : '#d1d5db'}`, borderRadius: '5px', padding: '0 0.5rem', height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: creatingFolder ? NAVY : '#6b7280', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }, children: "+ Folder" }), _jsx("button", { onClick: () => { setCreating(v => !v); setNewName(''); setCreatingFolder(false); }, title: "New skill", style: { background: creating ? `${GOLD}22` : 'transparent', border: `1px solid ${creating ? GOLD : '#d1d5db'}`, borderRadius: '5px', padding: '0 0.5rem', height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: creating ? GOLD : '#6b7280', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }, children: "+ Skill" })] })] }), creatingFolder && (_jsxs("div", { style: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }, children: [_jsx("input", { autoFocus: true, value: newFolder, onChange: e => setNewFolder(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    createFolder(); if (e.key === 'Escape')
                                    setCreatingFolder(false); }, placeholder: "Folder name\u2026", style: { ...inputStyle, border: `1px solid ${NAVY}55` } }), _jsxs("div", { style: { display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }, children: [_jsx("button", { onClick: createFolder, style: { flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }, children: "Create folder" }), _jsx("button", { onClick: () => setCreatingFolder(false), style: { flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }, children: "Cancel" })] })] })), creating && (_jsxs("div", { style: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }, children: [_jsx("input", { autoFocus: true, value: newName, onChange: e => setNewName(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    create(); if (e.key === 'Escape')
                                    setCreating(false); }, placeholder: "Skill name\u2026", style: { ...inputStyle, border: `1px solid ${GOLD}88` } }), _jsxs("div", { style: { display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }, children: [_jsx("button", { onClick: create, style: { flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }, children: "Create" }), _jsx("button", { onClick: () => setCreating(false), style: { flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }, children: "Cancel" })] })] })), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '0.4rem 0' }, children: [error && _jsx("p", { style: { fontSize: '0.78rem', color: '#ef4444', padding: '0.75rem 1rem', margin: 0 }, children: error }), !error && skills.length === 0 && (_jsx("p", { style: { fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }, children: "No skills yet. Click + Skill." })), folders.map(f => {
                                const items = skills.filter(s => s.folder_id === f.id);
                                const open = !collapsed.has(f.id);
                                return (_jsxs("div", { children: [_jsxs("div", { onClick: () => toggleCollapse(f.id), onMouseEnter: () => setHoveredId(-f.id - 1000), onMouseLeave: () => setHoveredId(null), style: { display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1rem', cursor: 'pointer', userSelect: 'none' }, children: [_jsx("span", { style: { fontSize: '0.65rem', color: '#9ca3af', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }, children: "\u25B6" }), _jsx("span", { style: { fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: NAVY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: f.name }), _jsx("span", { style: { fontSize: '0.7rem', color: '#bbb' }, children: items.length }), hoveredId === -f.id - 1000 && (_jsx("button", { onClick: e => deleteFolder(f.id, e), title: "Delete folder", style: { background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.75rem', padding: 0 }, onMouseEnter: e => (e.currentTarget.style.color = '#ef4444'), onMouseLeave: e => (e.currentTarget.style.color = '#d1d5db'), children: "\u2715" }))] }), open && items.length === 0 && (_jsx("p", { style: { fontSize: '0.72rem', color: '#c4c4c4', fontStyle: 'italic', margin: 0, padding: '0.15rem 1rem 0.4rem 1.6rem' }, children: "Empty" })), open && items.map(s => skillRow(s, true))] }, f.id));
                            }), folders.length > 0 && ungrouped.length > 0 && (_jsx("div", { style: { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#aaa', padding: '0.5rem 1rem 0.25rem' }, children: "Ungrouped" })), (folders.length > 0 ? ungrouped : skills).map(s => skillRow(s, false))] })] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [!selected && (_jsxs("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }, children: [_jsx("svg", { width: "38", height: "38", viewBox: "0 0 24 24", fill: "none", stroke: "#d1d5db", strokeWidth: "1.5", children: _jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }), _jsx("p", { style: { margin: 0, fontSize: '0.9rem' }, children: "Select a skill, or click + Skill to add one" })] })), selected && view === 'read' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '1rem' }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("h2", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY }, children: selected.name }), selected.description && (_jsx("p", { style: { margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7280' }, children: selected.description }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }, children: [_jsxs("select", { value: selected.folder_id ?? '', onChange: e => moveToFolder(selected, e.target.value === '' ? null : Number(e.target.value)), title: "Move to folder", style: { border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.8rem', color: '#374151', background: '#fff', cursor: 'pointer', maxWidth: '160px' }, children: [_jsx("option", { value: "", children: "No folder" }), folders.map(f => _jsx("option", { value: f.id, children: f.name }, f.id))] }), _jsx("button", { onClick: startEdit, style: { background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }, children: "Edit" })] })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }, children: [_jsx("pre", { style: { margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.85rem', lineHeight: 1.7, color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: selected.content || _jsx("span", { style: { color: '#aaa', fontStyle: 'italic', fontFamily: 'system-ui' }, children: "No content yet. Click Edit to add it." }) }), _jsxs("p", { style: { marginTop: '2rem', fontSize: '0.75rem', color: '#d1d5db' }, children: ["Last updated ", fmt(selected.updated_at)] })] })] })), selected && view === 'edit' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: save, disabled: saving || !editName.trim(), style: { background: GOLD, color: '#1a1a1a', border: 'none', borderRadius: '6px', padding: '0.38rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: saving || !editName.trim() ? 'default' : 'pointer', opacity: saving || !editName.trim() ? 0.6 : 1 }, children: saving ? 'Saving…' : 'Save' }), _jsx("button", { onClick: () => setView('read'), style: { background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer' }, children: "Cancel" })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem' }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: "Name" }), _jsx("input", { value: editName, onChange: e => setEditName(e.target.value), style: inputStyle })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem' }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: "Description" }), _jsx("input", { value: editDesc, onChange: e => setEditDesc(e.target.value), placeholder: "One line about what this skill does", style: inputStyle })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: "Content" }), _jsx("textarea", { value: editContent, onChange: e => setEditContent(e.target.value), placeholder: "The skill body. Paste the full skill definition or instructions here.", style: { ...inputStyle, minHeight: '320px', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.83rem', lineHeight: 1.6 } })] })] })] }))] })] }));
}
