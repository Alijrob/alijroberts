import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import PhotoGallery from "./PhotoGallery";
function fmt(bytes) {
    if (!bytes)
        return "--";
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824)
        return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(1)} GB`;
}
function FileIcon({ file, size = 32 }) {
    const s = { width: size, height: size };
    const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
    if (file.is_folder)
        return _jsx("svg", { ...s, viewBox: "0 0 24 24", ...base, style: { color: "#f5c542" }, children: _jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) });
    const m = file.mime_type || "";
    if (m.startsWith("image/"))
        return _jsxs("svg", { ...s, viewBox: "0 0 24 24", ...base, style: { color: "#60a5fa" }, children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }), _jsx("polyline", { points: "21 15 16 10 5 21" })] });
    if (m.startsWith("video/"))
        return _jsxs("svg", { ...s, viewBox: "0 0 24 24", ...base, style: { color: "#f472b6" }, children: [_jsx("polygon", { points: "23 7 16 12 23 17 23 7" }), _jsx("rect", { x: "1", y: "5", width: "15", height: "14", rx: "2" })] });
    if (m.startsWith("audio/"))
        return _jsxs("svg", { ...s, viewBox: "0 0 24 24", ...base, style: { color: "#a78bfa" }, children: [_jsx("path", { d: "M9 18V5l12-2v13" }), _jsx("circle", { cx: "6", cy: "18", r: "3" }), _jsx("circle", { cx: "18", cy: "16", r: "3" })] });
    if (m.includes("pdf"))
        return _jsxs("svg", { ...s, viewBox: "0 0 24 24", ...base, style: { color: "#f87171" }, children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" }), _jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), _jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" })] });
    if (m.includes("zip") || m.includes("compressed") || m.includes("archive"))
        return _jsxs("svg", { ...s, viewBox: "0 0 24 24", ...base, style: { color: "#fb923c" }, children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "17 8 12 3 7 8" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })] });
    return _jsxs("svg", { ...s, viewBox: "0 0 24 24", ...base, style: { color: "#9ca3af" }, children: [_jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), _jsx("polyline", { points: "14 2 14 8 20 8" })] });
}
export default function MediaFiles({ pickMode = false, onPick }) {
    const [showPhotos, setShowPhotos] = useState(false);
    const [folderId, setFolderId] = useState(null);
    const [files, setFiles] = useState([]);
    const [tree, setTree] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [view, setView] = useState("grid");
    const [dragOver, setDragOver] = useState(false);
    const [draggingId, setDraggingId] = useState(null);
    const [folderTarget, setFolderTarget] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [ctxMenu, setCtxMenu] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [preview, setPreview] = useState(null);
    const [shareMsg, setShareMsg] = useState(null);
    const dropRef = useRef(null);
    const fileInput = useRef(null);
    const folderInput = useRef(null);
    const renameFocus = useRef(null);
    const loadFiles = useCallback(async () => {
        const qs = folderId != null ? `?parent_id=${folderId}` : "?parent_id=null";
        const r = await fetch(`/api/media${qs}`);
        setFiles(await r.json());
        setSelected(new Set());
    }, [folderId]);
    const loadTree = useCallback(async () => {
        const r = await fetch("/api/media/tree");
        setTree(await r.json());
    }, []);
    const loadCrumbs = useCallback(async () => {
        if (folderId == null) {
            setBreadcrumbs([]);
            return;
        }
        const r = await fetch(`/api/media/breadcrumb/${folderId}`);
        setBreadcrumbs(await r.json());
    }, [folderId]);
    useEffect(() => { loadFiles(); loadCrumbs(); }, [loadFiles, loadCrumbs]);
    useEffect(() => { loadTree(); }, [loadTree]);
    const refresh = async () => { await loadFiles(); await loadTree(); };
    const upload = async (list) => {
        const items = Array.from(list);
        if (!items.length)
            return;
        setUploading(true);
        const form = new FormData();
        items.forEach(f => form.append("files", f));
        const qs = folderId != null ? `?parent_id=${folderId}` : "";
        try {
            await fetch(`/api/media/upload${qs}`, { method: "POST", body: form });
            await refresh();
        }
        finally {
            setUploading(false);
        }
    };
    const onDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        const fid = e.dataTransfer.getData("file-id");
        if (fid) {
            await fetch(`/api/media/${fid}/move`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parent_id: folderId }) });
            await refresh();
            return;
        }
        if (e.dataTransfer.files.length)
            await upload(e.dataTransfer.files);
    };
    const openFolder = (f) => { setFolderId(f.id); setPreview(null); };
    const click = (e, f) => {
        e.stopPropagation();
        if (e.detail === 2) {
            if (f.is_folder) {
                openFolder(f);
                return;
            }
            if (pickMode && f.mime_type?.startsWith("image/")) {
                onPick?.(f);
                return;
            }
            setPreview(f);
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            setSelected(p => { const n = new Set(p); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n; });
        }
        else if (e.shiftKey && selected.size > 0) {
            const ids = files.map(x => x.id);
            const last = [...selected][selected.size - 1];
            const a = ids.indexOf(last), b = ids.indexOf(f.id);
            setSelected(new Set(ids.slice(Math.min(a, b), Math.max(a, b) + 1)));
        }
        else {
            setSelected(new Set([f.id]));
            if (!f.is_folder)
                setPreview(f);
        }
    };
    const ctxOpen = (e, f) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selected.has(f.id))
            setSelected(new Set([f.id]));
        setCtxMenu({ x: e.clientX, y: e.clientY, file: f });
    };
    const del = async (ids) => {
        setCtxMenu(null);
        await Promise.all(ids.map(id => fetch(`/api/media/${id}`, { method: "DELETE" })));
        if (preview && ids.includes(preview.id))
            setPreview(null);
        await refresh();
    };
    const rename = async () => {
        if (!renaming?.name.trim()) {
            setRenaming(null);
            return;
        }
        await fetch(`/api/media/${renaming.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: renaming.name.trim() }) });
        setRenaming(null);
        await refresh();
    };
    const share = async (f) => {
        setCtxMenu(null);
        const r = await fetch(`/api/media/${f.id}/share`, { method: "POST" });
        const d = await r.json();
        try {
            await navigator.clipboard.writeText(d.url);
            setShareMsg("Link copied!");
        }
        catch {
            setShareMsg(d.url);
        }
        setTimeout(() => setShareMsg(null), 3000);
    };
    const mkFolder = async () => {
        if (!newFolderName.trim()) {
            setCreatingFolder(false);
            setNewFolderName("");
            return;
        }
        await fetch("/api/media/folder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: newFolderName.trim(), parent_id: folderId }) });
        setCreatingFolder(false);
        setNewFolderName("");
        await refresh();
    };
    const folderDrop = async (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();
        setFolderTarget(null);
        const fid = e.dataTransfer.getData("file-id");
        if (fid) {
            // Internal move
            if (parseInt(fid) === targetId)
                return;
            await fetch(`/api/media/${fid}/move`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parent_id: targetId }) });
            await refresh();
        }
        else if (e.dataTransfer.files.length) {
            // OS file drop directly onto a folder icon — upload into that folder
            setUploading(true);
            const form = new FormData();
            Array.from(e.dataTransfer.files).forEach(f => form.append("files", f));
            const qs = targetId != null ? `?parent_id=${targetId}` : "";
            try {
                await fetch(`/api/media/upload${qs}`, { method: "POST", body: form });
                await refresh();
            }
            finally {
                setUploading(false);
            }
        }
    };
    const renderTree = (parentId, depth = 0) => tree.filter(f => f.parent_id === parentId).map(f => (_jsxs("div", { children: [_jsxs("div", { onClick: () => setFolderId(f.id), onDragOver: e => { e.preventDefault(); setFolderTarget(f.id); }, onDragLeave: () => setFolderTarget(null), onDrop: e => folderDrop(e, f.id), className: `flex items-center gap-1.5 py-1 rounded-md cursor-pointer text-sm transition-colors truncate
            ${folderId === f.id ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"}
            ${folderTarget === f.id ? "ring-1 ring-sky-400" : ""}`, style: { paddingLeft: `${8 + depth * 14}px`, paddingRight: 8 }, children: [_jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }), _jsx("span", { className: "truncate", children: f.name })] }), renderTree(f.id, depth + 1)] }, f.id)));
    const selectedIds = [...selected];
    return (_jsxs("div", { className: "flex flex-col h-full bg-[#0f1216] text-[#e6e8eb] select-none text-sm", onClick: () => { setCtxMenu(null); setSelected(new Set()); }, children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0", children: [_jsxs("div", { className: "flex items-center gap-1 flex-1 min-w-0 text-xs", children: [_jsx("button", { onClick: () => setFolderId(null), className: `transition-colors ${folderId == null ? "text-white" : "text-white/50 hover:text-white"}`, children: "Home" }), breadcrumbs.map(c => (_jsxs("span", { className: "flex items-center gap-1 min-w-0", children: [_jsx("span", { className: "text-white/20", children: "/" }), _jsx("button", { onClick: () => setFolderId(c.id), className: "text-white/50 hover:text-white transition-colors truncate max-w-[80px]", children: c.name })] }, c.id)))] }), _jsxs("button", { onClick: () => { setCreatingFolder(true); setTimeout(() => folderInput.current?.focus(), 40); }, className: "flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/8 hover:bg-white/15 border border-white/15 transition-colors text-xs text-white/80 hover:text-white font-medium", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }), _jsx("line", { x1: "12", y1: "11", x2: "12", y2: "17" }), _jsx("line", { x1: "9", y1: "14", x2: "15", y2: "14" })] }), "New Folder"] }), _jsxs("button", { onClick: () => fileInput.current?.click(), disabled: uploading, className: "flex items-center gap-1 px-2 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 transition-colors text-xs disabled:opacity-50", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "17 8 12 3 7 8" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })] }), uploading ? "Uploading…" : "Upload"] }), _jsx("input", { ref: fileInput, type: "file", multiple: true, hidden: true, onChange: e => { if (e.target.files)
                            upload(e.target.files); e.target.value = ""; } }), _jsx("div", { className: "flex rounded border border-white/10 overflow-hidden", children: ["grid", "list"].map(m => (_jsx("button", { onClick: () => setView(m), className: `px-2 py-1.5 transition-colors ${view === m ? "bg-white/10" : "hover:bg-white/5"}`, children: m === "grid"
                                ? _jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7" })] })
                                : _jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("line", { x1: "8", y1: "6", x2: "21", y2: "6" }), _jsx("line", { x1: "8", y1: "12", x2: "21", y2: "12" }), _jsx("line", { x1: "8", y1: "18", x2: "21", y2: "18" }), _jsx("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }), _jsx("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }), _jsx("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" })] }) }, m))) })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsxs("div", { className: "w-44 shrink-0 border-r border-white/10 overflow-y-auto p-1.5 flex flex-col gap-0.5", children: [_jsxs("button", { onClick: () => { setShowPhotos(true); setFolderId(null); }, className: `flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-xs transition-colors w-full text-left ${showPhotos ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`, children: [_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }), _jsx("polyline", { points: "21 15 16 10 5 21" })] }), "Photos"] }), _jsx("div", { className: "my-1 border-t border-white/10" }), _jsxs("div", { onClick: () => { setShowPhotos(false); setFolderId(null); }, onDragOver: e => { e.preventDefault(); setFolderTarget("root"); }, onDragLeave: () => setFolderTarget(null), onDrop: e => folderDrop(e, null), className: `flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-xs transition-colors
              ${!showPhotos && folderId == null ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}
              ${folderTarget === "root" ? "ring-1 ring-sky-400" : ""}`, children: [_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), _jsx("polyline", { points: "9 22 9 12 15 12 15 22" })] }), "All Files"] }), renderTree(null)] }), showPhotos && (_jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(PhotoGallery, {}) })), _jsxs("div", { ref: dropRef, className: `${showPhotos ? "hidden" : "flex-1"} overflow-y-auto relative ${dragOver ? "bg-sky-400/5" : ""}`, onDragOver: e => { e.preventDefault(); if (!e.dataTransfer.getData("file-id"))
                            setDragOver(true); }, onDragLeave: e => { if (!dropRef.current?.contains(e.relatedTarget))
                            setDragOver(false); }, onDrop: onDrop, onClick: e => { e.stopPropagation(); setSelected(new Set()); }, onContextMenu: e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, file: null }); }, children: [dragOver && (_jsx("div", { className: "absolute inset-3 border-2 border-dashed border-sky-400/50 rounded-xl flex items-center justify-center z-10 pointer-events-none", children: _jsxs("div", { className: "text-center text-sky-400/80", children: [_jsxs("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "mx-auto mb-2", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "17 8 12 3 7 8" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })] }), _jsx("p", { className: "text-sm font-medium", children: "Drop to upload" })] }) })), creatingFolder && (_jsx("div", { className: "px-4 pt-3 pb-1", children: _jsx("input", { ref: folderInput, value: newFolderName, onChange: e => setNewFolderName(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                                        mkFolder(); if (e.key === "Escape") {
                                        setCreatingFolder(false);
                                        setNewFolderName("");
                                    } }, onBlur: mkFolder, placeholder: "Folder name", className: "px-3 py-1.5 rounded-md bg-black/40 border border-sky-400/60 text-sm text-white outline-none", onClick: e => e.stopPropagation() }) })), files.length === 0 && !creatingFolder ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-white/25 gap-3", children: [_jsx("svg", { width: "52", height: "52", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "0.8", children: _jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) }), _jsx("p", { className: "text-sm", children: "Drop files here or click Upload" })] })) : view === "grid" ? (_jsx("div", { className: "p-3 grid gap-2", style: { gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))" }, children: files.map(f => (_jsxs("div", { draggable: true, onDragStart: e => { e.dataTransfer.setData("file-id", String(f.id)); setDraggingId(f.id); }, onDragEnd: () => setDraggingId(null), onDragOver: f.is_folder ? e => { e.preventDefault(); e.stopPropagation(); setFolderTarget(f.id); } : undefined, onDragLeave: f.is_folder ? () => setFolderTarget(null) : undefined, onDrop: f.is_folder ? e => { e.stopPropagation(); folderDrop(e, f.id); } : undefined, onClick: e => click(e, f), onContextMenu: e => ctxOpen(e, f), className: `flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all
                    ${selected.has(f.id) ? "bg-sky-400/20 ring-1 ring-sky-400/50" : "hover:bg-white/5"}
                    ${draggingId === f.id ? "opacity-40" : ""}
                    ${folderTarget === f.id ? "ring-2 ring-sky-400" : ""}`, children: [_jsx("div", { className: "w-14 h-14 flex items-center justify-center flex-shrink-0", children: f.mime_type?.startsWith("image/") && f.stored_name
                                                ? _jsx("img", { src: `/uploads/${f.stored_name}`, alt: f.name, className: "w-14 h-14 object-cover rounded-md" })
                                                : _jsx(FileIcon, { file: f, size: 42 }) }), renaming?.id === f.id
                                            ? _jsx("input", { ref: renameFocus, autoFocus: true, value: renaming.name, onChange: e => setRenaming({ ...renaming, name: e.target.value }), onKeyDown: e => { if (e.key === "Enter")
                                                    rename(); if (e.key === "Escape")
                                                    setRenaming(null); }, onBlur: rename, onClick: e => e.stopPropagation(), className: "w-full px-1 py-0.5 text-xs text-center bg-black/50 border border-sky-400/60 rounded outline-none" })
                                            : _jsx("span", { className: "text-xs text-center text-white/80 line-clamp-2 break-all leading-tight w-full", children: f.name })] }, f.id))) })) : (_jsxs("div", { className: "p-2", children: [_jsxs("div", { className: "grid text-xs text-white/35 px-3 py-1.5 border-b border-white/8", style: { gridTemplateColumns: "1fr 90px 130px" }, children: [_jsx("span", { children: "Name" }), _jsx("span", { className: "text-right", children: "Size" }), _jsx("span", { className: "text-right pr-1", children: "Modified" })] }), files.map(f => (_jsxs("div", { draggable: true, onDragStart: e => { e.dataTransfer.setData("file-id", String(f.id)); setDraggingId(f.id); }, onDragEnd: () => setDraggingId(null), onDragOver: f.is_folder ? e => { e.preventDefault(); e.stopPropagation(); setFolderTarget(f.id); } : undefined, onDragLeave: f.is_folder ? () => setFolderTarget(null) : undefined, onDrop: f.is_folder ? e => { e.stopPropagation(); folderDrop(e, f.id); } : undefined, onClick: e => click(e, f), onContextMenu: e => ctxOpen(e, f), className: `grid items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors
                    ${selected.has(f.id) ? "bg-sky-400/15" : "hover:bg-white/4"}
                    ${draggingId === f.id ? "opacity-40" : ""}
                    ${folderTarget === f.id ? "ring-1 ring-sky-400" : ""}`, style: { gridTemplateColumns: "1fr 90px 130px" }, children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx(FileIcon, { file: f, size: 15 }), renaming?.id === f.id
                                                        ? _jsx("input", { autoFocus: true, value: renaming.name, onChange: e => setRenaming({ ...renaming, name: e.target.value }), onKeyDown: e => { if (e.key === "Enter")
                                                                rename(); if (e.key === "Escape")
                                                                setRenaming(null); }, onBlur: rename, onClick: e => e.stopPropagation(), className: "flex-1 px-1 py-0.5 text-sm bg-black/50 border border-sky-400/60 rounded outline-none" })
                                                        : _jsx("span", { className: "text-sm text-white/85 truncate", children: f.name })] }), _jsx("span", { className: "text-xs text-white/45 text-right", children: f.is_folder ? "--" : fmt(f.size) }), _jsx("span", { className: "text-xs text-white/45 text-right pr-1", children: new Date(f.updated_at).toLocaleDateString() })] }, f.id)))] }))] }), preview && !pickMode && !showPhotos && (_jsxs("div", { className: "w-52 shrink-0 border-l border-white/10 p-3 flex flex-col gap-3 overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-white/40 uppercase tracking-wider", children: "Preview" }), _jsx("button", { onClick: () => setPreview(null), className: "text-white/30 hover:text-white transition-colors", children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) })] }), preview.mime_type?.startsWith("image/") && preview.stored_name
                                ? _jsx("img", { src: `/uploads/${preview.stored_name}`, alt: preview.name, className: "w-full rounded-md object-cover aspect-square bg-white/5" })
                                : _jsx("div", { className: "aspect-square flex items-center justify-center bg-white/5 rounded-md", children: _jsx(FileIcon, { file: preview, size: 52 }) }), _jsxs("div", { className: "space-y-0.5", children: [_jsx("p", { className: "text-sm font-medium text-white/90 break-all", children: preview.name }), _jsx("p", { className: "text-xs text-white/45", children: preview.mime_type || "Unknown" }), _jsx("p", { className: "text-xs text-white/45", children: fmt(preview.size) }), _jsx("p", { className: "text-xs text-white/45", children: new Date(preview.updated_at).toLocaleDateString() })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("button", { onClick: () => window.open(`/api/media/${preview.id}/download`, "_blank"), className: "w-full px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center gap-2", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "7 10 12 15 17 10" }), _jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })] }), "Download"] }), _jsxs("button", { onClick: () => share(preview), className: "w-full px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center gap-2", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "18", cy: "5", r: "3" }), _jsx("circle", { cx: "6", cy: "12", r: "3" }), _jsx("circle", { cx: "18", cy: "19", r: "3" }), _jsx("line", { x1: "8.59", y1: "13.51", x2: "15.42", y2: "17.49" }), _jsx("line", { x1: "15.41", y1: "6.51", x2: "8.59", y2: "10.49" })] }), "Share"] })] })] }))] }), _jsxs("div", { className: "px-3 py-1 border-t border-white/10 text-xs text-white/35 flex items-center gap-4 shrink-0", children: [_jsxs("span", { children: [files.length, " item", files.length !== 1 ? "s" : ""] }), selected.size > 0 && _jsxs("span", { children: [selected.size, " selected"] }), uploading && _jsx("span", { className: "text-sky-400", children: "Uploading..." }), shareMsg && _jsx("span", { className: "text-emerald-400", children: shareMsg }), pickMode && _jsx("span", { className: "text-white/50 ml-auto", children: "Double-click an image to use it" })] }), ctxMenu && (_jsxs("div", { style: { position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 9999 }, className: "w-48 rounded-lg border border-white/10 bg-[#1c2130] shadow-2xl py-1 text-sm", onClick: e => e.stopPropagation(), children: [_jsxs("button", { onClick: () => { setCtxMenu(null); setCreatingFolder(true); setTimeout(() => folderInput.current?.focus(), 40); }, className: "w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2", children: [_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }), _jsx("line", { x1: "12", y1: "11", x2: "12", y2: "17" }), _jsx("line", { x1: "9", y1: "14", x2: "15", y2: "14" })] }), "New Folder"] }), ctxMenu.file && (_jsxs(_Fragment, { children: [_jsx("div", { className: "my-1 border-t border-white/10" }), !ctxMenu.file.is_folder && (_jsxs("button", { onClick: () => { window.open(`/api/media/${ctxMenu.file.id}/download`, "_blank"); setCtxMenu(null); }, className: "w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2", children: [_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "7 10 12 15 17 10" }), _jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })] }), "Download"] })), !ctxMenu.file.is_folder && (_jsxs("button", { onClick: () => share(ctxMenu.file), className: "w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2", children: [_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "18", cy: "5", r: "3" }), _jsx("circle", { cx: "6", cy: "12", r: "3" }), _jsx("circle", { cx: "18", cy: "19", r: "3" }), _jsx("line", { x1: "8.59", y1: "13.51", x2: "15.42", y2: "17.49" }), _jsx("line", { x1: "15.41", y1: "6.51", x2: "8.59", y2: "10.49" })] }), "Share"] })), pickMode && !ctxMenu.file.is_folder && ctxMenu.file.mime_type?.startsWith("image/") && (_jsx("button", { onClick: () => { onPick?.(ctxMenu.file); setCtxMenu(null); }, className: "w-full px-3 py-1.5 text-left text-sky-400 hover:bg-white/5", children: "Use as photo" })), _jsxs("button", { onClick: () => { setRenaming({ id: ctxMenu.file.id, name: ctxMenu.file.name }); setCtxMenu(null); }, className: "w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2", children: [_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), _jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })] }), "Rename"] }), _jsx("div", { className: "my-1 border-t border-white/10" }), _jsxs("button", { onClick: () => del(selectedIds.length > 1 ? selectedIds : [ctxMenu.file.id]), className: "w-full px-3 py-1.5 text-left text-rose-400 hover:bg-white/5 flex items-center gap-2", children: [_jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("polyline", { points: "3 6 5 6 21 6" }), _jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })] }), "Delete", selectedIds.length > 1 ? ` (${selectedIds.length})` : ""] })] }))] }))] }));
}
