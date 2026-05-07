import { useState, useEffect, useRef } from 'react';

const GOLD = '#c9a840';
const NAVY = '#1c2866';

interface FileNode {
  id: number;
  parent_id: number | null;
  name: string;
  type: 'folder' | 'note';
  content?: string;
  updated_at: string;
  children?: FileNode[];
}

function buildTree(flat: FileNode[]): FileNode[] {
  const map = new Map<number, FileNode>();
  flat.forEach(n => map.set(n.id, { ...n, children: [] }));
  const roots: FileNode[] = [];
  map.forEach(n => {
    if (n.parent_id == null) {
      roots.push(n);
    } else {
      const parent = map.get(n.parent_id);
      if (parent) parent.children!.push(n);
    }
  });
  const sort = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => n.children && sort(n.children));
  };
  sort(roots);
  return roots;
}

function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  const walk = (list: FileNode[]) => list.forEach(n => { result.push(n); if (n.children) walk(n.children); });
  walk(nodes);
  return result;
}

const FolderIcon = ({ open, color }: { open?: boolean; color?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={color ?? '#9ca3af'} stroke="none">
    {open
      ? <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z" />
      : <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />}
  </svg>
);

const NoteIcon = ({ color }: { color?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color ?? '#9ca3af'} strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

function TreeNode({
  node, depth, selectedId, expandedIds, onToggle, onSelectNote, onDelete, hoveredId, setHoveredId,
}: {
  node: FileNode;
  depth: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelectNote: (node: FileNode) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  hoveredId: number | null;
  setHoveredId: (id: number | null) => void;
}) {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isHovered = hoveredId === node.id;

  return (
    <>
      <div
        onClick={() => isFolder ? onToggle(node.id) : onSelectNote(node)}
        onMouseEnter={() => setHoveredId(node.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: `${0.5 + depth * 1.1}rem`,
          paddingRight: '0.5rem',
          paddingTop: '0.45rem', paddingBottom: '0.45rem',
          background: isSelected ? `${GOLD}18` : isHovered ? '#f3f4f6' : 'transparent',
          borderLeft: isSelected ? `3px solid ${GOLD}` : '3px solid transparent',
          cursor: 'pointer', transition: 'background 0.1s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          {isFolder && (
            <span style={{ color: '#9ca3af', fontSize: '0.6rem', flexShrink: 0 }}>{isExpanded ? '▾' : '▸'}</span>
          )}
          {!isFolder && <span style={{ width: '0.9rem', flexShrink: 0 }} />}
          {isFolder
            ? <FolderIcon open={isExpanded} color={isSelected ? GOLD : '#9ca3af'} />
            : <NoteIcon color={isSelected ? GOLD : '#9ca3af'} />}
          <span style={{
            fontSize: '0.87rem',
            fontWeight: isSelected ? 600 : 400,
            color: isSelected ? NAVY : '#374151',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{node.name}</span>
        </div>
        {isHovered && (
          <button
            onClick={e => onDelete(node.id, e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '0.8rem', padding: '0 2px', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
          >✕</button>
        )}
      </div>
      {isFolder && isExpanded && node.children?.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onSelectNote={onSelectNote}
          onDelete={onDelete}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
      ))}
    </>
  );
}

export default function Files() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [flat, setFlat] = useState<FileNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedNote, setSelectedNote] = useState<FileNode | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [view, setView] = useState<'read' | 'edit'>('read');
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState<{ type: 'folder' | 'note'; parentId: number | null } | null>(null);
  const [newName, setNewName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadNodes(); }, []);
  useEffect(() => { if (creating) createInputRef.current?.focus(); }, [creating]);

  async function loadNodes() {
    const r = await fetch('/api/files/nodes');
    const nodes: FileNode[] = await r.json();
    setFlat(nodes);
    const t = buildTree(nodes);
    setTree(t);
    setExpandedIds(prev => {
      const next = new Set(prev);
      flattenTree(t).filter(n => n.type === 'folder').forEach(n => next.add(n.id));
      return next;
    });
  }

  function toggle(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function selectNote(node: FileNode) {
    const r = await fetch(`/api/files/nodes/${node.id}`);
    const full = await r.json();
    setSelectedNote(full);
    setView('read');
  }

  function startEdit() {
    if (!selectedNote) return;
    setEditName(selectedNote.name);
    setEditContent(selectedNote.content ?? '');
    setView('edit');
  }

  async function saveEdit() {
    if (!selectedNote) return;
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
    if (!newName.trim() || !creating) return;
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
    } else {
      await selectNote(node);
    }
  }

  async function deleteNode(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/files/nodes/${id}`, { method: 'DELETE' });
    if (selectedNote?.id === id) setSelectedNote(null);
    loadNodes();
  }

  const selectedParentId = selectedNote
    ? (flat.find(n => n.id === selectedNote.id)?.parent_id ?? null)
    : null;

  const breadcrumb = selectedNote ? (() => {
    const parts: string[] = [];
    let cur: FileNode | undefined = flat.find(n => n.id === selectedNote.parent_id);
    while (cur) {
      parts.unshift(cur.name);
      cur = flat.find(n => n.id === cur!.parent_id);
    }
    return parts;
  })() : [];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Tree sidebar ── */}
      <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>Files</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={() => { setCreating({ type: 'folder', parentId: null }); setNewName(''); }}
              title="New root folder"
              style={{ background: 'transparent', border: `1px solid #d1d5db`, borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: '0.75rem' }}
            >
              <FolderIcon />
            </button>
            <button
              onClick={() => { setCreating({ type: 'note', parentId: selectedParentId }); setNewName(''); }}
              title="New note"
              style={{ background: 'transparent', border: `1px solid #d1d5db`, borderRadius: '5px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', lineHeight: 1 }}
            >+</button>
          </div>
        </div>

        {creating && (
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '0.3rem' }}>
              New {creating.type}{creating.parentId ? ` in ${flat.find(n => n.id === creating.parentId)?.name ?? '?'}` : ' (root)'}
            </div>
            <input
              ref={createInputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createNode(); if (e.key === 'Escape') { setCreating(null); setNewName(''); } }}
              placeholder="Name…"
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${GOLD}88`, borderRadius: '5px', padding: '0.35rem 0.5rem', fontSize: '0.83rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
              <button onClick={createNode} style={{ flex: 1, padding: '0.25rem', background: NAVY, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>Create</button>
              <button onClick={() => { setCreating(null); setNewName(''); }} style={{ flex: 1, padding: '0.25rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.76rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.3rem 0' }}>
          {tree.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: '#aaa', padding: '1rem', textAlign: 'center', margin: 0 }}>No files yet</p>
          )}
          {tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedNote?.id ?? null}
              expandedIds={expandedIds}
              onToggle={toggle}
              onSelectNote={selectNote}
              onDelete={deleteNode}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
            />
          ))}
        </div>

        {/* Add subfolder/note in context of selected note's parent */}
        {selectedNote && (
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '0.5rem 0.75rem', display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => { setCreating({ type: 'folder', parentId: selectedParentId }); setNewName(''); }}
              title="New folder here"
              style={{ flex: 1, padding: '0.3rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            >
              <FolderIcon /> Folder
            </button>
            <button
              onClick={() => { setCreating({ type: 'note', parentId: selectedParentId }); setNewName(''); }}
              title="New note here"
              style={{ flex: 1, padding: '0.3rem', background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            >
              <NoteIcon /> Note
            </button>
          </div>
        )}
      </div>

      {/* ── Main panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedNote && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: '#aaa' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a note to read it</p>
          </div>
        )}

        {selectedNote && view === 'read' && (
          <>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  {breadcrumb.map((b, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{b}</span>
                      <span style={{ fontSize: '0.78rem', color: '#d1d5db' }}>/</span>
                    </span>
                  ))}
                  <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>{selectedNote.name}</span>
                </div>
              </div>
              <button
                onClick={startEdit}
                style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >Edit</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
              <pre style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.9rem', lineHeight: 1.8, color: '#1f2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selectedNote.content || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Empty note</span>}
              </pre>
            </div>
          </>
        )}

        {selectedNote && view === 'edit' && (
          <>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ fontSize: '0.95rem', fontWeight: 700, color: NAVY, border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: '120px' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setView('read')} style={{ background: '#f3f4f6', color: '#555', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveEdit} disabled={saving} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', padding: '1.5rem 2rem', fontSize: '0.9rem', lineHeight: 1.8, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937', background: '#fff' }}
              placeholder="Write here…"
            />
          </>
        )}
      </div>
    </div>
  );
}
