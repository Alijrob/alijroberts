import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function FileIcon({ mime }) {
    const s = GOLD;
    if (mime.startsWith('image/'))
        return (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: s, strokeWidth: "1.8", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }), _jsx("polyline", { points: "21 15 16 10 5 21" })] }));
    if (mime.startsWith('video/'))
        return (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: s, strokeWidth: "1.8", children: [_jsx("polygon", { points: "23 7 16 12 23 17 23 7" }), _jsx("rect", { x: "1", y: "5", width: "15", height: "14", rx: "2" })] }));
    if (mime.startsWith('audio/'))
        return (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: s, strokeWidth: "1.8", children: [_jsx("path", { d: "M9 18V5l12-2v13" }), _jsx("circle", { cx: "6", cy: "18", r: "3" }), _jsx("circle", { cx: "18", cy: "16", r: "3" })] }));
    return (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: s, strokeWidth: "1.8", children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" })] }));
}
export default function Canvas() {
    const [files, setFiles] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [hoveredId, setHoveredId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [renameVal, setRenameVal] = useState('');
    const renameValRef = useRef('');
    const inputRef = useRef(null);
    const renameInputRef = useRef(null);
    useEffect(() => {
        fetch('/api/canvas/media').then(r => r.json()).then(setFiles);
    }, []);
    useEffect(() => {
        if (renamingId !== null)
            renameInputRef.current?.focus();
    }, [renamingId]);
    async function uploadFiles(fileList) {
        setUploading(true);
        const uploaded = [];
        for (const file of Array.from(fileList)) {
            const fd = new FormData();
            fd.append('file', file);
            const r = await fetch('/api/canvas/media', { method: 'POST', body: fd });
            uploaded.push(await r.json());
        }
        setFiles(prev => [...uploaded, ...prev]);
        setUploading(false);
    }
    async function deleteFile(id, e) {
        e.stopPropagation();
        await fetch(`/api/canvas/media/${id}`, { method: 'DELETE' });
        setFiles(f => f.filter(x => x.id !== id));
    }
    function startRename(f, e) {
        e.stopPropagation();
        setRenamingId(f.id);
        setRenameVal(f.original_name);
        renameValRef.current = f.original_name;
    }
    async function commitRename(id) {
        const value = renameValRef.current;
        if (!value.trim()) {
            setRenamingId(null);
            return;
        }
        const r = await fetch(`/api/canvas/media/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: value.trim() }),
        });
        const updated = await r.json();
        setFiles(f => f.map(x => x.id === id ? updated : x));
        setRenamingId(null);
    }
    function onDrop(e) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length)
            uploadFiles(e.dataTransfer.files);
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff' }, children: [_jsxs("div", { onDragOver: e => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onDrop: onDrop, onClick: () => inputRef.current?.click(), style: {
                    margin: '2rem 2rem 1.25rem',
                    border: `2px dashed ${dragOver ? GOLD : '#d1d5db'}`,
                    borderRadius: '14px',
                    background: dragOver ? `${GOLD}0d` : '#fafafa',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.75rem', padding: '3rem 2rem', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s', flexShrink: 0,
                }, children: [_jsxs("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", stroke: dragOver ? GOLD : '#9ca3af', strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { transition: 'stroke 0.15s' }, children: [_jsx("polyline", { points: "16 16 12 12 8 16" }), _jsx("line", { x1: "12", y1: "12", x2: "12", y2: "21" }), _jsx("path", { d: "M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("p", { style: { margin: 0, fontSize: '0.95rem', fontWeight: 600, color: dragOver ? GOLD : NAVY }, children: uploading ? 'Uploading…' : 'Drop files here' }), _jsx("p", { style: { margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }, children: "or click to browse your device" })] }), _jsx("input", { ref: inputRef, type: "file", multiple: true, onChange: e => { if (e.target.files?.length)
                            uploadFiles(e.target.files); e.target.value = ''; }, style: { display: 'none' } })] }), files.length > 0 && (_jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '0 2rem 2rem' }, children: [_jsxs("p", { style: { margin: '0 0 0.75rem', fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }, children: [files.length, " file", files.length !== 1 ? 's' : ''] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.4rem' }, children: files.map(f => (_jsxs("div", { onMouseEnter: () => setHoveredId(f.id), onMouseLeave: () => setHoveredId(null), style: {
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.65rem 0.9rem',
                                border: `1px solid ${hoveredId === f.id ? `${GOLD}55` : '#e5e7eb'}`,
                                borderRadius: '8px',
                                background: hoveredId === f.id ? `${GOLD}06` : '#fff',
                                transition: 'border-color 0.12s, background 0.12s',
                            }, children: [_jsx(FileIcon, { mime: f.mime_type }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [renamingId === f.id ? (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' }, children: [_jsx("input", { ref: renameInputRef, value: renameVal, onChange: e => { setRenameVal(e.target.value); renameValRef.current = e.target.value; }, onKeyDown: e => {
                                                        if (e.key === 'Enter')
                                                            commitRename(f.id);
                                                        if (e.key === 'Escape')
                                                            setRenamingId(null);
                                                    }, onClick: e => e.stopPropagation(), style: {
                                                        flex: 1, fontSize: '0.88rem', fontWeight: 500,
                                                        border: `1px solid ${GOLD}88`, borderRadius: '4px',
                                                        padding: '2px 6px', outline: 'none', color: '#111',
                                                    } }), _jsx("button", { onClick: () => commitRename(f.id), title: "Save", style: { background: GOLD, border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', padding: '3px 7px', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }, children: "\u2713" }), _jsx("button", { onClick: () => setRenamingId(null), title: "Cancel", style: { background: 'none', border: `1px solid #d1d5db`, borderRadius: '4px', cursor: 'pointer', color: '#9ca3af', padding: '3px 7px', fontSize: '0.78rem', flexShrink: 0 }, children: "\u2715" })] })) : (_jsx("p", { style: { margin: 0, fontSize: '0.88rem', fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: f.original_name })), _jsx("p", { style: { margin: 0, fontSize: '0.75rem', color: '#9ca3af' }, children: formatSize(f.size) })] }), hoveredId === f.id && renamingId !== f.id && (_jsxs("div", { style: { display: 'flex', gap: '0.4rem', flexShrink: 0 }, children: [_jsx("a", { href: `/uploads/canvas-media/${f.filename}`, download: f.original_name, title: "Save as", onClick: e => e.stopPropagation(), style: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center', textDecoration: 'none' }, onMouseEnter: e => (e.currentTarget.style.color = GOLD), onMouseLeave: e => (e.currentTarget.style.color = '#9ca3af'), children: _jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "7 10 12 15 17 10" }), _jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })] }) }), _jsx("button", { onClick: () => window.open(`/uploads/canvas-media/${f.filename}`, '_blank'), title: "Open", style: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center' }, onMouseEnter: e => (e.currentTarget.style.color = GOLD), onMouseLeave: e => (e.currentTarget.style.color = '#9ca3af'), children: _jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }), _jsx("polyline", { points: "15 3 21 3 21 9" }), _jsx("line", { x1: "10", y1: "14", x2: "21", y2: "3" })] }) }), _jsx("button", { onClick: e => startRename(f, e), title: "Rename", style: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center' }, onMouseEnter: e => (e.currentTarget.style.color = GOLD), onMouseLeave: e => (e.currentTarget.style.color = '#9ca3af'), children: _jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), _jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })] }) }), _jsx("button", { onClick: e => deleteFile(f.id, e), title: "Delete", style: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center' }, onMouseEnter: e => (e.currentTarget.style.color = '#ef4444'), onMouseLeave: e => (e.currentTarget.style.color = '#9ca3af'), children: _jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "3 6 5 6 21 6" }), _jsx("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }), _jsx("path", { d: "M10 11v6" }), _jsx("path", { d: "M14 11v6" }), _jsx("path", { d: "M9 6V4h6v2" })] }) })] }))] }, f.id))) })] })), files.length === 0 && !uploading && (_jsx("p", { style: { textAlign: 'center', color: '#d1d5db', fontSize: '0.85rem', margin: 0 }, children: "No files yet" }))] }));
}
