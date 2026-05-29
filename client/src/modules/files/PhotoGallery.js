import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
export default function PhotoGallery({ onSetProfilePhoto }) {
    const [subFolders, setSubFolders] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [hoverId, setHoverId] = useState(null);
    const [shareMsg, setShareMsg] = useState(null);
    const [photosRootId, setPhotosRootId] = useState(null);
    const [creatingAlbum, setCreatingAlbum] = useState(false);
    const [albumName, setAlbumName] = useState("");
    const fileInput = useRef(null);
    const albumInput = useRef(null);
    const loadFolders = useCallback(async () => {
        const r = await fetch("/api/media/photos/folders");
        const d = await r.json();
        setPhotosRootId(d.photos_id);
        setSubFolders(d.sub_folders);
        setActiveId(id => id ?? (d.sub_folders[0]?.id ?? null));
    }, []);
    useEffect(() => { loadFolders(); }, [loadFolders]);
    const createAlbum = async () => {
        const name = albumName.trim();
        if (!name || photosRootId == null) {
            setCreatingAlbum(false);
            setAlbumName("");
            return;
        }
        const r = await fetch("/api/media/folder", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, parent_id: photosRootId }),
        });
        const folder = await r.json();
        setCreatingAlbum(false);
        setAlbumName("");
        await loadFolders();
        setActiveId(folder.id);
    };
    const loadPhotos = useCallback(async () => {
        if (activeId == null)
            return;
        const r = await fetch(`/api/media?parent_id=${activeId}`);
        const all = await r.json();
        setPhotos(all.filter(f => !f.is_folder && f.mime_type?.startsWith("image/")));
    }, [activeId]);
    useEffect(() => { loadPhotos(); }, [loadPhotos]);
    const upload = async (files) => {
        if (!files.length || activeId == null)
            return;
        setUploading(true);
        const form = new FormData();
        Array.from(files).forEach(f => form.append("files", f));
        try {
            await fetch(`/api/media/upload?parent_id=${activeId}`, { method: "POST", body: form });
            await loadPhotos();
        }
        finally {
            setUploading(false);
        }
    };
    const del = async (f) => {
        await fetch(`/api/media/${f.id}`, { method: "DELETE" });
        if (preview?.id === f.id)
            setPreview(null);
        await loadPhotos();
    };
    const share = async (f) => {
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
    const activeLabel = subFolders.find(s => s.id === activeId)?.name ?? "";
    return (_jsxs("div", { className: "flex flex-col h-full text-[#e6e8eb] select-none bg-[#0f1216]", children: [_jsxs("div", { className: "px-4 pt-4 pb-0 shrink-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "text-base font-semibold text-white/90", children: "Photos" }), _jsxs("div", { className: "flex items-center gap-2", children: [shareMsg && _jsx("span", { className: "text-xs text-emerald-400", children: shareMsg }), creatingAlbum ? (_jsx("input", { ref: albumInput, autoFocus: true, value: albumName, onChange: e => setAlbumName(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                                            createAlbum(); if (e.key === "Escape") {
                                            setCreatingAlbum(false);
                                            setAlbumName("");
                                        } }, onBlur: createAlbum, placeholder: "Album name, then Enter", className: "px-3 py-1.5 text-sm rounded-lg bg-black/40 border border-sky-400/60 text-white outline-none w-44" })) : (_jsxs("button", { onClick: () => { setCreatingAlbum(true); setTimeout(() => albumInput.current?.focus(), 40); }, className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-medium text-white/80 hover:text-white transition-colors", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }), _jsx("line", { x1: "12", y1: "11", x2: "12", y2: "17" }), _jsx("line", { x1: "9", y1: "14", x2: "15", y2: "14" })] }), "New Album"] })), _jsxs("button", { onClick: () => fileInput.current?.click(), disabled: uploading || activeId == null, className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-medium transition-colors disabled:opacity-50", children: [_jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "17 8 12 3 7 8" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })] }), uploading ? "Uploading..." : `Add to ${activeLabel}`] }), _jsx("input", { ref: fileInput, type: "file", accept: "image/*", multiple: true, hidden: true, onChange: e => { if (e.target.files)
                                            upload(e.target.files); e.target.value = ""; } })] })] }), _jsx("div", { className: "flex items-end gap-0 border-b border-white/10", children: subFolders.map(sub => (_jsx("button", { onClick: () => setActiveId(sub.id), className: `px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeId === sub.id ? "border-sky-400 text-white" : "border-transparent text-white/50 hover:text-white/80"}`, children: sub.name }, sub.id))) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4", children: photos.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-xl text-white/25 gap-3 cursor-pointer hover:border-white/20 transition-colors", onClick: () => fileInput.current?.click(), children: [_jsxs("svg", { width: "44", height: "44", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "0.9", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }), _jsx("polyline", { points: "21 15 16 10 5 21" })] }), _jsx("p", { className: "text-sm", children: "No photos yet \u2014 click to upload" })] })) : (_jsx("div", { className: "grid gap-1", style: { gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }, children: photos.map(photo => (_jsxs("div", { className: "relative aspect-square rounded-md overflow-hidden cursor-pointer group", onMouseEnter: () => setHoverId(photo.id), onMouseLeave: () => setHoverId(null), onClick: () => setPreview(photo), children: [_jsx("img", { src: `/uploads/${photo.stored_name}`, alt: photo.name, className: "w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" }), hoverId === photo.id && (_jsxs("div", { className: "absolute inset-0 bg-black/50 flex flex-col justify-between p-2", children: [_jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: e => { e.stopPropagation(); del(photo); }, className: "w-7 h-7 rounded-full bg-black/60 hover:bg-rose-500/80 flex items-center justify-center transition-colors", title: "Delete", children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("polyline", { points: "3 6 5 6 21 6" }), _jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })] }) }) }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx("button", { onClick: e => { e.stopPropagation(); share(photo); }, className: "flex-1 py-1 rounded bg-white/15 hover:bg-white/25 text-xs text-white transition-colors", children: "Share" }), _jsx("button", { onClick: e => { e.stopPropagation(); window.open(`/api/media/${photo.id}/download`, "_blank"); }, className: "flex-1 py-1 rounded bg-white/15 hover:bg-white/25 text-xs text-white transition-colors", children: "Save" }), onSetProfilePhoto && (_jsx("button", { onClick: e => { e.stopPropagation(); onSetProfilePhoto(photo); }, className: "flex-1 py-1 rounded bg-sky-500/70 hover:bg-sky-500 text-xs text-white transition-colors", children: "Profile" }))] })] }))] }, photo.id))) })) }), preview && (_jsx("div", { className: "fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center", onClick: () => setPreview(null), children: _jsxs("div", { className: "relative max-w-4xl max-h-[90vh] w-full mx-4", onClick: e => e.stopPropagation(), children: [_jsx("img", { src: `/uploads/${preview.stored_name}`, alt: preview.name, className: "w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" }), _jsxs("div", { className: "absolute top-3 right-3 flex gap-2", children: [onSetProfilePhoto && (_jsx("button", { onClick: () => { onSetProfilePhoto(preview); setPreview(null); }, className: "px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs text-white font-medium transition-colors", children: "Set as Profile Photo" })), _jsx("button", { onClick: () => window.open(`/api/media/${preview.id}/download`, "_blank"), className: "px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs text-white transition-colors", children: "Download" }), _jsx("button", { onClick: () => setPreview(null), className: "w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors", children: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) })] }), _jsx("p", { className: "mt-2 text-center text-sm text-white/60", children: preview.name })] }) }))] }));
}
