import { useState, useEffect, useRef, useCallback } from "react";
import PhotoGallery from "./PhotoGallery";

export type FileItem = {
  id: number;
  name: string;
  stored_name: string | null;
  parent_id: number | null;
  is_folder: boolean;
  size: number;
  mime_type: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  pickMode?: boolean;
  onPick?: (file: FileItem) => void;
};

function fmt(bytes: number) {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function FileIcon({ file, size = 32 }: { file: FileItem; size?: number }) {
  const s = { width: size, height: size };
  const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (file.is_folder)
    return <svg {...s} viewBox="0 0 24 24" {...base} style={{ color: "#f5c542" }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
  const m = file.mime_type || "";
  if (m.startsWith("image/"))
    return <svg {...s} viewBox="0 0 24 24" {...base} style={{ color: "#60a5fa" }}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
  if (m.startsWith("video/"))
    return <svg {...s} viewBox="0 0 24 24" {...base} style={{ color: "#f472b6" }}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>;
  if (m.startsWith("audio/"))
    return <svg {...s} viewBox="0 0 24 24" {...base} style={{ color: "#a78bfa" }}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
  if (m.includes("pdf"))
    return <svg {...s} viewBox="0 0 24 24" {...base} style={{ color: "#f87171" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
  if (m.includes("zip") || m.includes("compressed") || m.includes("archive"))
    return <svg {...s} viewBox="0 0 24 24" {...base} style={{ color: "#fb923c" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
  return <svg {...s} viewBox="0 0 24 24" {...base} style={{ color: "#9ca3af" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}

export default function MediaFiles({ pickMode = false, onPick }: Props) {
  const [showPhotos, setShowPhotos] = useState(false);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [tree, setTree] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<FileItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [folderTarget, setFolderTarget] = useState<number | "root" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const dropRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const renameFocus = useRef<HTMLInputElement>(null);

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
    if (folderId == null) { setBreadcrumbs([]); return; }
    const r = await fetch(`/api/media/breadcrumb/${folderId}`);
    setBreadcrumbs(await r.json());
  }, [folderId]);

  useEffect(() => { loadFiles(); loadCrumbs(); }, [loadFiles, loadCrumbs]);
  useEffect(() => { loadTree(); }, [loadTree]);

  const refresh = async () => { await loadFiles(); await loadTree(); };

  const upload = async (list: FileList | File[]) => {
    const items = Array.from(list);
    if (!items.length) return;
    setUploading(true);
    const form = new FormData();
    items.forEach(f => form.append("files", f));
    const qs = folderId != null ? `?parent_id=${folderId}` : "";
    try { await fetch(`/api/media/upload${qs}`, { method: "POST", body: form }); await refresh(); }
    finally { setUploading(false); }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const fid = e.dataTransfer.getData("file-id");
    if (fid) { await fetch(`/api/media/${fid}/move`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parent_id: folderId }) }); await refresh(); return; }
    if (e.dataTransfer.files.length) await upload(e.dataTransfer.files);
  };

  const openFolder = (f: FileItem) => { setFolderId(f.id); setPreview(null); };

  const click = (e: React.MouseEvent, f: FileItem) => {
    e.stopPropagation();
    if (e.detail === 2) {
      if (f.is_folder) { openFolder(f); return; }
      if (pickMode && f.mime_type?.startsWith("image/")) { onPick?.(f); return; }
      setPreview(f); return;
    }
    if (e.ctrlKey || e.metaKey) {
      setSelected(p => { const n = new Set(p); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n; });
    } else if (e.shiftKey && selected.size > 0) {
      const ids = files.map(x => x.id);
      const last = [...selected][selected.size - 1];
      const a = ids.indexOf(last), b = ids.indexOf(f.id);
      setSelected(new Set(ids.slice(Math.min(a, b), Math.max(a, b) + 1)));
    } else {
      setSelected(new Set([f.id]));
      if (!f.is_folder) setPreview(f);
    }
  };

  const ctxOpen = (e: React.MouseEvent, f: FileItem) => {
    e.preventDefault(); e.stopPropagation();
    if (!selected.has(f.id)) setSelected(new Set([f.id]));
    setCtxMenu({ x: e.clientX, y: e.clientY, file: f });
  };

  const del = async (ids: number[]) => {
    setCtxMenu(null);
    await Promise.all(ids.map(id => fetch(`/api/media/${id}`, { method: "DELETE" })));
    if (preview && ids.includes(preview.id)) setPreview(null);
    await refresh();
  };

  const rename = async () => {
    if (!renaming?.name.trim()) { setRenaming(null); return; }
    await fetch(`/api/media/${renaming.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: renaming.name.trim() }) });
    setRenaming(null); await refresh();
  };

  const share = async (f: FileItem) => {
    setCtxMenu(null);
    const r = await fetch(`/api/media/${f.id}/share`, { method: "POST" });
    const d = await r.json() as { url: string };
    try { await navigator.clipboard.writeText(d.url); setShareMsg("Link copied!"); } catch { setShareMsg(d.url); }
    setTimeout(() => setShareMsg(null), 3000);
  };

  const mkFolder = async () => {
    if (!newFolderName.trim()) { setCreatingFolder(false); setNewFolderName(""); return; }
    await fetch("/api/media/folder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: newFolderName.trim(), parent_id: folderId }) });
    setCreatingFolder(false); setNewFolderName(""); await refresh();
  };

  const folderDrop = async (e: React.DragEvent, targetId: number | null) => {
    e.preventDefault(); e.stopPropagation(); setFolderTarget(null);
    const fid = e.dataTransfer.getData("file-id");
    if (fid) {
      // Internal move
      if (parseInt(fid) === targetId) return;
      await fetch(`/api/media/${fid}/move`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parent_id: targetId }) });
      await refresh();
    } else if (e.dataTransfer.files.length) {
      // OS file drop directly onto a folder icon — upload into that folder
      setUploading(true);
      const form = new FormData();
      Array.from(e.dataTransfer.files).forEach(f => form.append("files", f));
      const qs = targetId != null ? `?parent_id=${targetId}` : "";
      try { await fetch(`/api/media/upload${qs}`, { method: "POST", body: form }); await refresh(); }
      finally { setUploading(false); }
    }
  };

  const renderTree = (parentId: number | null, depth = 0): React.ReactNode =>
    tree.filter(f => f.parent_id === parentId).map(f => (
      <div key={f.id}>
        <div
          onClick={() => setFolderId(f.id)}
          onDragOver={e => { e.preventDefault(); setFolderTarget(f.id); }}
          onDragLeave={() => setFolderTarget(null)}
          onDrop={e => folderDrop(e, f.id)}
          className={`flex items-center gap-1.5 py-1 rounded-md cursor-pointer text-sm transition-colors truncate
            ${folderId === f.id ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"}
            ${folderTarget === f.id ? "ring-1 ring-sky-400" : ""}`}
          style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: 8 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          <span className="truncate">{f.name}</span>
        </div>
        {renderTree(f.id, depth + 1)}
      </div>
    ));

  const selectedIds = [...selected];

  return (
    <div
      className="flex flex-col h-full bg-[#0f1216] text-[#e6e8eb] select-none text-sm"
      onClick={() => { setCtxMenu(null); setSelected(new Set()); }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1 flex-1 min-w-0 text-xs">
          <button onClick={() => setFolderId(null)} className={`transition-colors ${folderId == null ? "text-white" : "text-white/50 hover:text-white"}`}>Home</button>
          {breadcrumbs.map(c => (
            <span key={c.id} className="flex items-center gap-1 min-w-0">
              <span className="text-white/20">/</span>
              <button onClick={() => setFolderId(c.id)} className="text-white/50 hover:text-white transition-colors truncate max-w-[80px]">{c.name}</button>
            </span>
          ))}
        </div>
        <button onClick={() => { setCreatingFolder(true); setTimeout(() => folderInput.current?.focus(), 40); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/8 hover:bg-white/15 border border-white/15 transition-colors text-xs text-white/80 hover:text-white font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
          New Folder
        </button>
        <button onClick={() => fileInput.current?.click()} disabled={uploading}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 transition-colors text-xs disabled:opacity-50">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={e => { if (e.target.files) upload(e.target.files); e.target.value = ""; }} />
        <div className="flex rounded border border-white/10 overflow-hidden">
          {(["grid", "list"] as const).map(m => (
            <button key={m} onClick={() => setView(m)} className={`px-2 py-1.5 transition-colors ${view === m ? "bg-white/10" : "hover:bg-white/5"}`}>
              {m === "grid"
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folder tree */}
        <div className="w-44 shrink-0 border-r border-white/10 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          {/* Photos section */}
          <button
            onClick={() => { setShowPhotos(true); setFolderId(null); }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-xs transition-colors w-full text-left ${showPhotos ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Photos
          </button>

          <div className="my-1 border-t border-white/10" />

          <div
            onClick={() => { setShowPhotos(false); setFolderId(null); }}
            onDragOver={e => { e.preventDefault(); setFolderTarget("root"); }}
            onDragLeave={() => setFolderTarget(null)}
            onDrop={e => folderDrop(e, null)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-xs transition-colors
              ${!showPhotos && folderId == null ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}
              ${folderTarget === "root" ? "ring-1 ring-sky-400" : ""}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            All Files
          </div>
          {renderTree(null)}
        </div>

        {/* Photos gallery */}
        {showPhotos && (
          <div className="flex-1 overflow-hidden">
            <PhotoGallery />
          </div>
        )}

        {/* Drop zone + file area */}
        <div
          ref={dropRef}
          className={`${showPhotos ? "hidden" : "flex-1"} overflow-y-auto relative ${dragOver ? "bg-sky-400/5" : ""}`}
          onDragOver={e => { e.preventDefault(); if (!e.dataTransfer.getData("file-id")) setDragOver(true); }}
          onDragLeave={e => { if (!dropRef.current?.contains(e.relatedTarget as Node)) setDragOver(false); }}
          onDrop={onDrop}
          onClick={e => { e.stopPropagation(); setSelected(new Set()); }}
          onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, file: null as unknown as FileItem }); }}
        >
          {dragOver && (
            <div className="absolute inset-3 border-2 border-dashed border-sky-400/50 rounded-xl flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center text-sky-400/80">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p className="text-sm font-medium">Drop to upload</p>
              </div>
            </div>
          )}

          {/* New folder input */}
          {creatingFolder && (
            <div className="px-4 pt-3 pb-1">
              <input
                ref={folderInput}
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") mkFolder(); if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); } }}
                onBlur={mkFolder}
                placeholder="Folder name"
                className="px-3 py-1.5 rounded-md bg-black/40 border border-sky-400/60 text-sm text-white outline-none"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          {files.length === 0 && !creatingFolder ? (
            <div className="flex flex-col items-center justify-center h-full text-white/25 gap-3">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              <p className="text-sm">Drop files here or click Upload</p>
            </div>
          ) : view === "grid" ? (
            <div className="p-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))" }}>
              {files.map(f => (
                <div
                  key={f.id}
                  draggable
                  onDragStart={e => { e.dataTransfer.setData("file-id", String(f.id)); setDraggingId(f.id); }}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={f.is_folder ? e => { e.preventDefault(); e.stopPropagation(); setFolderTarget(f.id); } : undefined}
                  onDragLeave={f.is_folder ? () => setFolderTarget(null) : undefined}
                  onDrop={f.is_folder ? e => { e.stopPropagation(); folderDrop(e, f.id); } : undefined}
                  onClick={e => click(e, f)}
                  onContextMenu={e => ctxOpen(e, f)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all
                    ${selected.has(f.id) ? "bg-sky-400/20 ring-1 ring-sky-400/50" : "hover:bg-white/5"}
                    ${draggingId === f.id ? "opacity-40" : ""}
                    ${folderTarget === f.id ? "ring-2 ring-sky-400" : ""}`}
                >
                  <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                    {f.mime_type?.startsWith("image/") && f.stored_name
                      ? <img src={`/uploads/${f.stored_name}`} alt={f.name} className="w-14 h-14 object-cover rounded-md" />
                      : <FileIcon file={f} size={42} />}
                  </div>
                  {renaming?.id === f.id
                    ? <input ref={renameFocus} autoFocus value={renaming.name} onChange={e => setRenaming({ ...renaming, name: e.target.value })} onKeyDown={e => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(null); }} onBlur={rename} onClick={e => e.stopPropagation()} className="w-full px-1 py-0.5 text-xs text-center bg-black/50 border border-sky-400/60 rounded outline-none" />
                    : <span className="text-xs text-center text-white/80 line-clamp-2 break-all leading-tight w-full">{f.name}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2">
              <div className="grid text-xs text-white/35 px-3 py-1.5 border-b border-white/8" style={{ gridTemplateColumns: "1fr 90px 130px" }}>
                <span>Name</span><span className="text-right">Size</span><span className="text-right pr-1">Modified</span>
              </div>
              {files.map(f => (
                <div
                  key={f.id}
                  draggable
                  onDragStart={e => { e.dataTransfer.setData("file-id", String(f.id)); setDraggingId(f.id); }}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={f.is_folder ? e => { e.preventDefault(); e.stopPropagation(); setFolderTarget(f.id); } : undefined}
                  onDragLeave={f.is_folder ? () => setFolderTarget(null) : undefined}
                  onDrop={f.is_folder ? e => { e.stopPropagation(); folderDrop(e, f.id); } : undefined}
                  onClick={e => click(e, f)}
                  onContextMenu={e => ctxOpen(e, f)}
                  className={`grid items-center px-3 py-1.5 rounded-md cursor-pointer transition-colors
                    ${selected.has(f.id) ? "bg-sky-400/15" : "hover:bg-white/4"}
                    ${draggingId === f.id ? "opacity-40" : ""}
                    ${folderTarget === f.id ? "ring-1 ring-sky-400" : ""}`}
                  style={{ gridTemplateColumns: "1fr 90px 130px" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon file={f} size={15} />
                    {renaming?.id === f.id
                      ? <input autoFocus value={renaming.name} onChange={e => setRenaming({ ...renaming, name: e.target.value })} onKeyDown={e => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(null); }} onBlur={rename} onClick={e => e.stopPropagation()} className="flex-1 px-1 py-0.5 text-sm bg-black/50 border border-sky-400/60 rounded outline-none" />
                      : <span className="text-sm text-white/85 truncate">{f.name}</span>}
                  </div>
                  <span className="text-xs text-white/45 text-right">{f.is_folder ? "--" : fmt(f.size)}</span>
                  <span className="text-xs text-white/45 text-right pr-1">{new Date(f.updated_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview panel */}
        {preview && !pickMode && !showPhotos && (
          <div className="w-52 shrink-0 border-l border-white/10 p-3 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider">Preview</span>
              <button onClick={() => setPreview(null)} className="text-white/30 hover:text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {preview.mime_type?.startsWith("image/") && preview.stored_name
              ? <img src={`/uploads/${preview.stored_name}`} alt={preview.name} className="w-full rounded-md object-cover aspect-square bg-white/5" />
              : <div className="aspect-square flex items-center justify-center bg-white/5 rounded-md"><FileIcon file={preview} size={52} /></div>}
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-white/90 break-all">{preview.name}</p>
              <p className="text-xs text-white/45">{preview.mime_type || "Unknown"}</p>
              <p className="text-xs text-white/45">{fmt(preview.size)}</p>
              <p className="text-xs text-white/45">{new Date(preview.updated_at).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => window.open(`/api/media/${preview.id}/download`, "_blank")} className="w-full px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download
              </button>
              <button onClick={() => share(preview)} className="w-full px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                Share
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 border-t border-white/10 text-xs text-white/35 flex items-center gap-4 shrink-0">
        <span>{files.length} item{files.length !== 1 ? "s" : ""}</span>
        {selected.size > 0 && <span>{selected.size} selected</span>}
        {uploading && <span className="text-sky-400">Uploading...</span>}
        {shareMsg && <span className="text-emerald-400">{shareMsg}</span>}
        {pickMode && <span className="text-white/50 ml-auto">Double-click an image to use it</span>}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 9999 }}
          className="w-48 rounded-lg border border-white/10 bg-[#1c2130] shadow-2xl py-1 text-sm"
          onClick={e => e.stopPropagation()}
        >
          {/* New Folder — always shown (empty space right-click or file right-click) */}
          <button
            onClick={() => { setCtxMenu(null); setCreatingFolder(true); setTimeout(() => folderInput.current?.focus(), 40); }}
            className="w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            New Folder
          </button>

          {/* File-specific actions */}
          {ctxMenu.file && (
            <>
              <div className="my-1 border-t border-white/10" />
              {!ctxMenu.file.is_folder && (
                <button onClick={() => { window.open(`/api/media/${ctxMenu.file.id}/download`, "_blank"); setCtxMenu(null); }} className="w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              )}
              {!ctxMenu.file.is_folder && (
                <button onClick={() => share(ctxMenu.file)} className="w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Share
                </button>
              )}
              {pickMode && !ctxMenu.file.is_folder && ctxMenu.file.mime_type?.startsWith("image/") && (
                <button onClick={() => { onPick?.(ctxMenu.file); setCtxMenu(null); }} className="w-full px-3 py-1.5 text-left text-sky-400 hover:bg-white/5">
                  Use as photo
                </button>
              )}
              <button onClick={() => { setRenaming({ id: ctxMenu.file.id, name: ctxMenu.file.name }); setCtxMenu(null); }} className="w-full px-3 py-1.5 text-left text-white/75 hover:bg-white/5 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Rename
              </button>
              <div className="my-1 border-t border-white/10" />
              <button onClick={() => del(selectedIds.length > 1 ? selectedIds : [ctxMenu.file.id])} className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-white/5 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Delete{selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
