import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
const LAB_STATUSES = ['draft', 'testing', 'ready'];
const CONFIG = {
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
export default function PromptCenter({ bucket }) {
    const cfg = CONFIG[bucket];
    const [prompts, setPrompts] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('read');
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
    const [collapsed, setCollapsed] = useState(new Set());
    const [hoveredId, setHoveredId] = useState(null);
    const [error, setError] = useState(null);
    const load = useCallback(async () => {
        try {
            const [pr, fr] = await Promise.all([
                fetch(`/api/prompts?bucket=${bucket}`),
                fetch(`/api/prompt-folders?bucket=${bucket}`),
            ]);
            if (!pr.ok)
                throw new Error(String(pr.status));
            setPrompts(await pr.json());
            setFolders(fr.ok ? await fr.json() : []);
            setError(null);
        }
        catch {
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
    async function select(p) {
        const r = await fetch(`/api/prompts/${p.id}`);
        setSelected(await r.json());
        setView('read');
    }
    function startEdit() {
        if (!selected)
            return;
        setEditName(selected.name);
        setEditDesc(selected.description);
        setEditTrigger(selected.trigger ?? '');
        setEditStatus(selected.status || 'draft');
        setEditContent(selected.content ?? '');
        setView('edit');
    }
    function startEditFor(p) {
        setSelected(p);
        setEditName(p.name);
        setEditDesc(p.description ?? '');
        setEditTrigger(p.trigger ?? '');
        setEditStatus(p.status || 'draft');
        setEditContent(p.content ?? '');
        setView('edit');
    }
    async function save() {
        if (!selected || !editName.trim())
            return;
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
        if (!newName.trim())
            return;
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
        if (!newFolder.trim())
            return;
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
    async function deleteFolder(id, e) {
        e.stopPropagation();
        if (!confirm('Delete this folder? Its prompts stay and become ungrouped.'))
            return;
        await fetch(`/api/prompt-folders/${id}`, { method: 'DELETE' });
        setFolders(fs => fs.filter(f => f.id !== id));
        setPrompts(ps => ps.map(p => p.folder_id === id ? { ...p, folder_id: null } : p));
    }
    async function moveToFolder(prompt, folderId) {
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
        if (!selected)
            return;
        if (!confirm('Promote this draft into the Prompt Library?'))
            return;
        await fetch(`/api/prompts/${selected.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: 'library', status: 'active', folder_id: null }),
        });
        setPrompts(ps => ps.filter(p => p.id !== selected.id));
        setSelected(null);
    }
    async function deletePrompt(id, e) {
        e.stopPropagation();
        await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
        setPrompts(ps => ps.filter(p => p.id !== id));
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
    function promptRow(p, indented) {
        const secondary = bucket === 'fixes' ? p.trigger : p.description;
        return (_jsxs("div", { onClick: () => select(p), onMouseEnter: () => setHoveredId(p.id), onMouseLeave: () => setHoveredId(null), style: {
                padding: '0.55rem 1rem',
                paddingLeft: indented ? '1.6rem' : '1rem',
                background: selected?.id === p.id ? `${GOLD}14` : hoveredId === p.id ? '#f3f4f6' : 'transparent',
                borderLeft: selected?.id === p.id ? `3px solid ${GOLD}` : '3px solid transparent',
                cursor: 'pointer', transition: 'background 0.1s',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
            }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { fontSize: '0.86rem', fontWeight: selected?.id === p.id ? 600 : 400, color: selected?.id === p.id ? NAVY : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }, children: [_jsx("span", { style: { overflow: 'hidden', textOverflow: 'ellipsis' }, children: p.name }), bucket === 'lab' && p.status && (_jsx("span", { style: { fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: NAVY, background: `${NAVY}14`, borderRadius: '4px', padding: '0.05rem 0.35rem', flexShrink: 0 }, children: p.status }))] }), secondary && (_jsx("div", { style: { fontSize: '0.72rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }, children: secondary }))] }), hoveredId === p.id && (_jsx("button", { onClick: e => deletePrompt(p.id, e), title: "Delete", style: { background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }, onMouseEnter: e => (e.currentTarget.style.color = '#ef4444'), onMouseLeave: e => (e.currentTarget.style.color = '#d1d5db'), children: "\u2715" }))] }, p.id));
    }
    const ungrouped = prompts.filter(p => p.folder_id == null);
    return (_jsxs("div", { style: { display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }, children: [_jsxs("div", { style: { width: '260px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }, children: [_jsxs("div", { style: { padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }, children: cfg.title }), _jsx("div", { style: { fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }, children: cfg.subtitle })] }), _jsxs("div", { style: { display: 'flex', gap: '0.35rem' }, children: [_jsx("button", { onClick: () => { setCreatingFolder(v => !v); setNewFolder(''); setCreating(false); }, title: "New folder", style: { background: creatingFolder ? `${NAVY}14` : 'transparent', border: `1px solid ${creatingFolder ? NAVY : '#d1d5db'}`, borderRadius: '5px', padding: '0 0.5rem', height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: creatingFolder ? NAVY : '#6b7280', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }, children: "+ Folder" }), _jsx("button", { onClick: () => { setCreating(v => !v); setNewName(''); setCreatingFolder(false); }, title: cfg.addLabel, style: { background: creating ? `${GOLD}22` : 'transparent', border: `1px solid ${creating ? GOLD : '#d1d5db'}`, borderRadius: '5px', padding: '0 0.5rem', height: '28px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: creating ? GOLD : '#6b7280', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }, children: cfg.addLabel })] })] }), creatingFolder && (_jsxs("div", { style: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }, children: [_jsx("input", { autoFocus: true, value: newFolder, onChange: e => setNewFolder(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    createFolder(); if (e.key === 'Escape')
                                    setCreatingFolder(false); }, placeholder: "Folder name\u2026", style: { ...inputStyle, border: `1px solid ${NAVY}55` } }), _jsxs("div", { style: { display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }, children: [_jsx("button", { onClick: createFolder, style: { flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }, children: "Create folder" }), _jsx("button", { onClick: () => setCreatingFolder(false), style: { flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }, children: "Cancel" })] })] })), creating && (_jsxs("div", { style: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }, children: [_jsx("input", { autoFocus: true, value: newName, onChange: e => setNewName(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    create(); if (e.key === 'Escape')
                                    setCreating(false); }, placeholder: cfg.namePlaceholder, style: { ...inputStyle, border: `1px solid ${GOLD}88` } }), _jsxs("div", { style: { display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }, children: [_jsx("button", { onClick: create, style: { flex: 1, padding: '0.28rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }, children: "Create" }), _jsx("button", { onClick: () => setCreating(false), style: { flex: 1, padding: '0.28rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }, children: "Cancel" })] })] })), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '0.4rem 0' }, children: [error && _jsx("p", { style: { fontSize: '0.78rem', color: '#ef4444', padding: '0.75rem 1rem', margin: 0 }, children: error }), !error && prompts.length === 0 && (_jsxs("p", { style: { fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }, children: ["Nothing here yet. Click ", cfg.addLabel, "."] })), folders.map(f => {
                                const items = prompts.filter(p => p.folder_id === f.id);
                                const open = !collapsed.has(f.id);
                                return (_jsxs("div", { children: [_jsxs("div", { onClick: () => toggleCollapse(f.id), onMouseEnter: () => setHoveredId(-f.id - 1000), onMouseLeave: () => setHoveredId(null), style: { display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1rem', cursor: 'pointer', userSelect: 'none' }, children: [_jsx("span", { style: { fontSize: '0.65rem', color: '#9ca3af', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }, children: "\u25B6" }), _jsx("span", { style: { fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: NAVY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: f.name }), _jsx("span", { style: { fontSize: '0.7rem', color: '#bbb' }, children: items.length }), hoveredId === -f.id - 1000 && (_jsx("button", { onClick: e => deleteFolder(f.id, e), title: "Delete folder", style: { background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.75rem', padding: 0 }, onMouseEnter: e => (e.currentTarget.style.color = '#ef4444'), onMouseLeave: e => (e.currentTarget.style.color = '#d1d5db'), children: "\u2715" }))] }), open && items.length === 0 && (_jsx("p", { style: { fontSize: '0.72rem', color: '#c4c4c4', fontStyle: 'italic', margin: 0, padding: '0.15rem 1rem 0.4rem 1.6rem' }, children: "Empty" })), open && items.map(p => promptRow(p, true))] }, f.id));
                            }), folders.length > 0 && ungrouped.length > 0 && (_jsx("div", { style: { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#aaa', padding: '0.5rem 1rem 0.25rem' }, children: "Ungrouped" })), (folders.length > 0 ? ungrouped : prompts).map(p => promptRow(p, false))] })] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [!selected && (_jsxs("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }, children: [_jsx("svg", { width: "38", height: "38", viewBox: "0 0 24 24", fill: "none", stroke: "#d1d5db", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }), _jsx("p", { style: { margin: 0, fontSize: '0.9rem' }, children: cfg.emptyText })] })), selected && view === 'read' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '1rem' }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsxs("h2", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("span", { children: selected.name }), cfg.showStatus && selected.status && (_jsx("span", { style: { fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: GOLD, background: `${GOLD}1f`, borderRadius: '4px', padding: '0.1rem 0.45rem' }, children: selected.status }))] }), selected.description && (_jsx("p", { style: { margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7280' }, children: selected.description }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }, children: [_jsxs("select", { value: selected.folder_id ?? '', onChange: e => moveToFolder(selected, e.target.value === '' ? null : Number(e.target.value)), title: "Move to folder", style: { border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.8rem', color: '#374151', background: '#fff', cursor: 'pointer', maxWidth: '160px' }, children: [_jsx("option", { value: "", children: "No folder" }), folders.map(f => _jsx("option", { value: f.id, children: f.name }, f.id))] }), cfg.showPromote && (_jsx("button", { onClick: promote, title: "Move this draft into the Prompt Library", style: { background: GOLD, color: '#1a1a1a', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }, children: "Promote" })), _jsx("button", { onClick: startEdit, style: { background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }, children: "Edit" })] })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }, children: [cfg.showTrigger && (_jsxs("div", { style: { marginBottom: '1.25rem' }, children: [_jsx("div", { style: { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '0.35rem' }, children: cfg.triggerLabel }), _jsx("p", { style: { margin: 0, fontSize: '0.9rem', color: '#374151', whiteSpace: 'pre-wrap' }, children: selected.trigger || _jsx("span", { style: { color: '#aaa', fontStyle: 'italic' }, children: "Not set." }) })] })), cfg.showTrigger && (_jsx("div", { style: { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '0.35rem' }, children: cfg.contentLabel })), _jsx("pre", { style: { margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.85rem', lineHeight: 1.7, color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: selected.content || _jsx("span", { style: { color: '#aaa', fontStyle: 'italic', fontFamily: 'system-ui' }, children: "No content yet. Click Edit to add it." }) }), _jsxs("p", { style: { marginTop: '2rem', fontSize: '0.75rem', color: '#d1d5db' }, children: ["Last updated ", fmt(selected.updated_at)] })] })] })), selected && view === 'edit' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.9rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: save, disabled: saving || !editName.trim(), style: { background: GOLD, color: '#1a1a1a', border: 'none', borderRadius: '6px', padding: '0.38rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: saving || !editName.trim() ? 'default' : 'pointer', opacity: saving || !editName.trim() ? 0.6 : 1 }, children: saving ? 'Saving…' : 'Save' }), _jsx("button", { onClick: () => setView('read'), style: { background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer' }, children: "Cancel" })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem' }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: cfg.nameLabel }), _jsx("input", { value: editName, onChange: e => setEditName(e.target.value), style: inputStyle })] }), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem' }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: "Description" }), _jsx("input", { value: editDesc, onChange: e => setEditDesc(e.target.value), placeholder: "One line about what this is for", style: inputStyle })] }), cfg.showStatus && (_jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem' }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: "Status" }), _jsx("select", { value: editStatus, onChange: e => setEditStatus(e.target.value), style: { ...inputStyle, cursor: 'pointer' }, children: LAB_STATUSES.map(s => _jsx("option", { value: s, children: s }, s)) })] })), cfg.showTrigger && (_jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem' }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: cfg.triggerLabel }), _jsx("input", { value: editTrigger, onChange: e => setEditTrigger(e.target.value), placeholder: cfg.triggerPlaceholder, style: inputStyle })] })), _jsxs("label", { style: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }, children: [_jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }, children: cfg.contentLabel }), _jsx("textarea", { value: editContent, onChange: e => setEditContent(e.target.value), placeholder: cfg.contentPlaceholder, style: { ...inputStyle, minHeight: '320px', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.83rem', lineHeight: 1.6 } })] })] })] }))] })] }));
}
