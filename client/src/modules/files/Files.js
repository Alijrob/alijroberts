import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
function buildTree(flat) {
    const map = new Map();
    flat.forEach(n => map.set(n.id, { ...n, children: [] }));
    const roots = [];
    map.forEach(n => {
        if (n.parent_id == null) {
            roots.push(n);
        }
        else {
            const parent = map.get(n.parent_id);
            if (parent)
                parent.children.push(n);
        }
    });
    const sort = (nodes) => {
        nodes.sort((a, b) => {
            if (a.type !== b.type)
                return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        nodes.forEach(n => n.children && sort(n.children));
    };
    sort(roots);
    return roots;
}
function flattenTree(nodes) {
    const result = [];
    const walk = (list) => list.forEach(n => { result.push(n); if (n.children)
        walk(n.children); });
    walk(nodes);
    return result;
}
const FolderIcon = ({ open, color }) => (_jsx("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: color ?? '#9ca3af', stroke: "none", children: open
        ? _jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z" })
        : _jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }));
const NoteIcon = ({ color }) => (_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: color ?? '#9ca3af', strokeWidth: "2", children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" })] }));
function TreeNode({ node, depth, selectedId, expandedIds, onToggle, onSelectNote, onDelete, hoveredId, setHoveredId, }) {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const isHovered = hoveredId === node.id;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { onClick: () => isFolder ? onToggle(node.id) : onSelectNote(node), onMouseEnter: () => setHoveredId(node.id), onMouseLeave: () => setHoveredId(null), style: {
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: `${0.5 + depth * 1.1}rem`,
                    paddingRight: '0.5rem',
                    paddingTop: '0.45rem', paddingBottom: '0.45rem',
                    background: isSelected ? `${GOLD}18` : isHovered ? '#f3f4f6' : 'transparent',
                    borderLeft: isSelected ? `3px solid ${GOLD}` : '3px solid transparent',
                    cursor: 'pointer', transition: 'background 0.1s',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', flex: 1, minWidth: 0 }, children: [isFolder && (_jsx("span", { style: { color: '#9ca3af', fontSize: '0.6rem', flexShrink: 0 }, children: isExpanded ? '▾' : '▸' })), !isFolder && _jsx("span", { style: { width: '0.9rem', flexShrink: 0 } }), isFolder
                                ? _jsx(FolderIcon, { open: isExpanded, color: isSelected ? GOLD : '#9ca3af' })
                                : _jsx(NoteIcon, { color: isSelected ? GOLD : '#9ca3af' }), _jsx("span", { style: {
                                    fontSize: '0.87rem',
                                    fontWeight: isSelected ? 600 : 400,
                                    color: isSelected ? NAVY : '#374151',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }, children: node.name })] }), isHovered && (_jsx("button", { onClick: e => onDelete(node.id, e), style: { background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }, onMouseEnter: e => (e.currentTarget.style.color = '#ef4444'), onMouseLeave: e => (e.currentTarget.style.color = '#d1d5db'), children: "\u2715" }))] }), isFolder && isExpanded && node.children?.map(child => (_jsx(TreeNode, { node: child, depth: depth + 1, selectedId: selectedId, expandedIds: expandedIds, onToggle: onToggle, onSelectNote: onSelectNote, onDelete: onDelete, hoveredId: hoveredId, setHoveredId: setHoveredId }, child.id)))] }));
}
export default function Files() {
    const [tree, setTree] = useState([]);
    const [flat, setFlat] = useState([]);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [selectedNote, setSelectedNote] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [view, setView] = useState('read');
    const [editName, setEditName] = useState('');
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(null);
    const [newName, setNewName] = useState('');
    const createInputRef = useRef(null);
    useEffect(() => { loadNodes(); }, []);
    useEffect(() => { if (creating)
        createInputRef.current?.focus(); }, [creating]);
    async function loadNodes() {
        const r = await fetch('/api/files/nodes');
        const nodes = await r.json();
        setFlat(nodes);
        const t = buildTree(nodes);
        setTree(t);
        setExpandedIds(prev => {
            const next = new Set(prev);
            flattenTree(t).filter(n => n.type === 'folder').forEach(n => next.add(n.id));
            return next;
        });
    }
    function toggle(id) {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    async function selectNote(node) {
        const r = await fetch(`/api/files/nodes/${node.id}`);
        const full = await r.json();
        setSelectedNote(full);
        setView('read');
    }
    function startEdit() {
        if (!selectedNote)
            return;
        setEditName(selectedNote.name);
        setEditContent(selectedNote.content ?? '');
        setView('edit');
    }
    async function saveEdit() {
        if (!selectedNote)
            return;
        setSaving(true);
        const r = await fetch(`/api/files/nodes/${selectedNote.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName, content: editContent }),
        });
        const updated = await r.json();
        setSelectedNote(updated);
        setView('read');
        setSaving(false);
        loadNodes();
    }
    async function createNode() {
        if (!newName.trim() || !creating)
            return;
        const r = await fetch('/api/files/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: creating.parentId, name: newName.trim(), type: creating.type }),
        });
        const node = await r.json();
        setNewName('');
        setCreating(null);
        await loadNodes();
        if (creating.type === 'folder') {
            setExpandedIds(prev => new Set([...prev, node.id]));
        }
        else {
            await selectNote(node);
        }
    }
    async function deleteNode(id, e) {
        e.stopPropagation();
        await fetch(`/api/files/nodes/${id}`, { method: 'DELETE' });
        if (selectedNote?.id === id)
            setSelectedNote(null);
        loadNodes();
    }
    const selectedParentId = selectedNote
        ? (flat.find(n => n.id === selectedNote.id)?.parent_id ?? null)
        : null;
    const breadcrumb = selectedNote ? (() => {
        const parts = [];
        let cur = flat.find(n => n.id === selectedNote.parent_id);
        while (cur) {
            parts.unshift(cur.name);
            cur = flat.find(n => n.id === cur.parent_id);
        }
        return parts;
    })() : [];
    return (_jsxs("div", { style: { display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }, children: [_jsxs("div", { style: { width: '240px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }, children: [_jsxs("div", { style: { padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }, children: "Files" }), _jsxs("div", { style: { display: 'flex', gap: '0.35rem' }, children: [_jsx("button", { onClick: () => { setCreating({ type: 'folder', parentId: null }); setNewName(''); }, title: "New root folder", style: { background: 'transparent', border: `1px solid #d1d5db`, borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: '0.75rem' }, children: _jsx(FolderIcon, {}) }), _jsx("button", { onClick: () => { setCreating({ type: 'note', parentId: selectedParentId }); setNewName(''); }, title: "New note", style: { background: 'transparent', border: `1px solid #d1d5db`, borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', lineHeight: 1 }, children: "+" })] })] }), creating && (_jsxs("div", { style: { padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }, children: [_jsxs("div", { style: { fontSize: '0.72rem', color: '#888', marginBottom: '0.3rem' }, children: ["New ", creating.type, creating.parentId ? ` in ${flat.find(n => n.id === creating.parentId)?.name ?? '?'}` : ' (root)'] }), _jsx("input", { ref: createInputRef, value: newName, onChange: e => setNewName(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    createNode(); if (e.key === 'Escape') {
                                    setCreating(null);
                                    setNewName('');
                                } }, placeholder: "Name\u2026", style: { width: '100%', boxSizing: 'border-box', border: `1px solid ${GOLD}88`, borderRadius: '5px', padding: '0.35rem 0.5rem', fontSize: '0.83rem', outline: 'none' } }), _jsxs("div", { style: { display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }, children: [_jsx("button", { onClick: createNode, style: { flex: 1, padding: '0.25rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }, children: "Create" }), _jsx("button", { onClick: () => { setCreating(null); setNewName(''); }, style: { flex: 1, padding: '0.25rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }, children: "Cancel" })] })] })), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '0.3rem 0' }, children: [tree.length === 0 && (_jsx("p", { style: { fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }, children: "No files yet" })), tree.map(node => (_jsx(TreeNode, { node: node, depth: 0, selectedId: selectedNote?.id ?? null, expandedIds: expandedIds, onToggle: toggle, onSelectNote: selectNote, onDelete: deleteNode, hoveredId: hoveredId, setHoveredId: setHoveredId }, node.id)))] }), selectedNote && (_jsxs("div", { style: { borderTop: '1px solid #e5e7eb', padding: '0.5rem 0.75rem', display: 'flex', gap: '0.4rem' }, children: [_jsxs("button", { onClick: () => { setCreating({ type: 'folder', parentId: selectedParentId }); setNewName(''); }, title: "New folder here", style: { flex: 1, padding: '0.3rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }, children: [_jsx(FolderIcon, {}), " Folder"] }), _jsxs("button", { onClick: () => { setCreating({ type: 'note', parentId: selectedParentId }); setNewName(''); }, title: "New note here", style: { flex: 1, padding: '0.3rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }, children: [_jsx(NoteIcon, {}), " Note"] })] }))] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [!selectedNote && (_jsxs("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }, children: [_jsxs("svg", { width: "38", height: "38", viewBox: "0 0 24 24", fill: "none", stroke: "#d1d5db", strokeWidth: "1.5", children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" })] }), _jsx("p", { style: { margin: 0, fontSize: '0.9rem' }, children: "Select a note to read it" })] })), selectedNote && view === 'read' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.85rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }, children: [_jsx("div", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }, children: [breadcrumb.map((b, i) => (_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' }, children: [_jsx("span", { style: { fontSize: '0.78rem', color: '#9ca3af' }, children: b }), _jsx("span", { style: { fontSize: '0.78rem', color: '#d1d5db' }, children: "/" })] }, i))), _jsx("span", { style: { fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }, children: selectedNote.name })] }) }), _jsx("button", { onClick: startEdit, style: { background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }, children: "Edit" })] }), _jsx("div", { style: { flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }, children: _jsx("pre", { style: { margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.9rem', lineHeight: 1.8, color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: selectedNote.content || _jsx("span", { style: { color: '#aaa', fontStyle: 'italic' }, children: "Empty note" }) }) })] })), selectedNote && view === 'edit' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '0.85rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }, children: [_jsx("input", { value: editName, onChange: e => setEditName(e.target.value), style: { fontSize: '0.95rem', fontWeight: 700, color: NAVY, border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: '120px' } }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem' }, children: [_jsx("button", { onClick: () => setView('read'), style: { background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', cursor: 'pointer' }, children: "Cancel" }), _jsx("button", { onClick: saveEdit, disabled: saving, style: { background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }, children: saving ? 'Saving…' : 'Save' })] })] }), _jsx("textarea", { value: editContent, onChange: e => setEditContent(e.target.value), style: { flex: 1, resize: 'none', border: 'none', outline: 'none', padding: '1.5rem 2rem', fontSize: '0.9rem', lineHeight: 1.8, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937', background: '#fff' }, placeholder: "Write here\u2026" })] }))] })] }));
}
