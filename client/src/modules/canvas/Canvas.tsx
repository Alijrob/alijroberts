import { useState, useEffect, useRef } from 'react';

const GOLD = '#c9a840';
const NAVY = '#1c2866';

interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime: string }) {
  const s = GOLD;
  if (mime.startsWith('image/')) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  );
  if (mime.startsWith('video/')) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  );
  if (mime.startsWith('audio/')) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  );
}

export default function Canvas() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const renameValRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/canvas/media').then(r => r.json()).then(setFiles);
  }, []);

  useEffect(() => {
    if (renamingId !== null) renameInputRef.current?.focus();
  }, [renamingId]);

  async function uploadFiles(fileList: FileList) {
    setUploading(true);
    const uploaded: MediaFile[] = [];
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/canvas/media', { method: 'POST', body: fd });
      uploaded.push(await r.json());
    }
    setFiles(prev => [...uploaded, ...prev]);
    setUploading(false);
  }

  async function deleteFile(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/canvas/media/${id}`, { method: 'DELETE' });
    setFiles(f => f.filter(x => x.id !== id));
  }

  function startRename(f: MediaFile, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(f.id);
    setRenameVal(f.original_name);
    renameValRef.current = f.original_name;
  }

  async function commitRename(id: number) {
    const value = renameValRef.current;
    if (!value.trim()) { setRenamingId(null); return; }
    const r = await fetch(`/api/canvas/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: value.trim() }),
    });
    const updated = await r.json();
    setFiles(f => f.map(x => x.id === id ? updated : x));
    setRenamingId(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff' }}>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          margin: '2rem 2rem 1.25rem',
          border: `2px dashed ${dragOver ? GOLD : '#d1d5db'}`,
          borderRadius: '14px',
          background: dragOver ? `${GOLD}0d` : '#fafafa',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '0.75rem', padding: '3rem 2rem', cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s', flexShrink: 0,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
          stroke={dragOver ? GOLD : '#9ca3af'} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.15s' }}
        >
          <polyline points="16 16 12 12 8 16"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: dragOver ? GOLD : NAVY }}>
            {uploading ? 'Uploading…' : 'Drop files here'}
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
            or click to browse your device
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ''; }}
          style={{ display: 'none' }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem' }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
            {files.length} file{files.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {files.map(f => (
              <div
                key={f.id}
                onMouseEnter={() => setHoveredId(f.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.9rem',
                  border: `1px solid ${hoveredId === f.id ? `${GOLD}55` : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: hoveredId === f.id ? `${GOLD}06` : '#fff',
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                <FileIcon mime={f.mime_type} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {renamingId === f.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        ref={renameInputRef}
                        value={renameVal}
                        onChange={e => { setRenameVal(e.target.value); renameValRef.current = e.target.value; }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename(f.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1, fontSize: '0.88rem', fontWeight: 500,
                          border: `1px solid ${GOLD}88`, borderRadius: '4px',
                          padding: '2px 6px', outline: 'none', color: '#111',
                        }}
                      />
                      <button
                        onClick={() => commitRename(f.id)}
                        title="Save"
                        style={{ background: GOLD, border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', padding: '3px 7px', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}
                      >✓</button>
                      <button
                        onClick={() => setRenamingId(null)}
                        title="Cancel"
                        style={{ background: 'none', border: `1px solid #d1d5db`, borderRadius: '4px', cursor: 'pointer', color: '#9ca3af', padding: '3px 7px', fontSize: '0.78rem', flexShrink: 0 }}
                      >✕</button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.original_name}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{formatSize(f.size)}</p>
                </div>

                {hoveredId === f.id && renamingId !== f.id && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    {/* Save as */}
                    <a
                      href={`/uploads/canvas-media/${f.filename}`}
                      download={f.original_name}
                      title="Save as"
                      onClick={e => e.stopPropagation()}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </a>
                    {/* Open */}
                    <button
                      onClick={() => window.open(`/uploads/canvas-media/${f.filename}`, '_blank')}
                      title="Open"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                    {/* Rename */}
                    <button
                      onClick={e => startRename(f, e)}
                      title="Rename"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={e => deleteFile(f.id, e)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && !uploading && (
        <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: '0.85rem', margin: 0 }}>No files yet</p>
      )}
    </div>
  );
}
