import { useState, useEffect, useCallback } from 'react';

interface TaskList { id: string; title: string; }
interface Task {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  notes?: string;
  due?: string;
}
interface Status { connected: boolean; email: string | null; }

const GOLD = '#c9a840';
const NAVY = '#1c2866';

export default function TasksModule() {
  const [status, setStatus]         = useState<Status | null>(null);
  const [lists, setLists]           = useState<TaskList[]>([]);
  const [activeList, setActiveList] = useState('@default');
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/tasks/status');
      const data = await res.json() as Status;
      setStatus(data);
      if (data.connected) {
        await loadLists();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLists = async () => {
    const res  = await fetch('/api/tasks/lists');
    const data = await res.json() as { items?: TaskList[] };
    if (data.items?.length) {
      setLists(data.items);
      setActiveList(data.items[0].id);
      await loadTasks(data.items[0].id);
    }
  };

  const loadTasks = async (listId: string) => {
    setTasksLoading(true);
    try {
      const res  = await fetch(`/api/tasks/tasks?list_id=${encodeURIComponent(listId)}`);
      const data = await res.json() as { items?: Task[] };
      setTasks(data.items ?? []);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_auth_success')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    loadStatus();
  }, [loadStatus]);

  const handleListChange = (listId: string) => {
    setActiveList(listId);
    loadTasks(listId);
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    setAddingTask(true);
    try {
      const res  = await fetch('/api/tasks/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: newTitle.trim(), list_id: activeList }),
      });
      const task = await res.json() as Task;
      if (task.id) {
        setTasks(t => [task, ...t]);
        setNewTitle('');
      }
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    setTogglingId(task.id);
    try {
      const res  = await fetch(`/api/tasks/tasks/${encodeURIComponent(task.id)}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus, list_id: activeList }),
      });
      const updated = await res.json() as Task;
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: updated.status } : t));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/tasks/tasks/${encodeURIComponent(id)}?list_id=${encodeURIComponent(activeList)}`, {
        method: 'DELETE',
      });
      setTasks(ts => ts.filter(t => t.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const pending   = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');

  if (loading) return <div style={s.center}><span style={s.subtle}>Loading…</span></div>;

  if (!status?.connected) {
    return (
      <div style={s.center}>
        <div style={s.connectCard}>
          <div style={s.taskIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p style={s.connectTitle}>Connect Google Tasks</p>
          <p style={s.connectSub}>Uses the same Google authorization as Calendar — one click enables both.</p>
          <button style={s.connectBtn} onClick={() => { window.location.href = '/api/tasks/auth/start'; }}>
            Connect with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.title}>Tasks</span>
          {lists.length > 1 && (
            <select
              style={s.listSelect}
              value={activeList}
              onChange={e => handleListChange(e.target.value)}
            >
              {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          )}
          {lists.length > 0 && lists[0].id !== '@default' && lists.length === 1 && (
            <span style={s.listName}>{lists[0].title}</span>
          )}
        </div>
      </div>

      <div style={s.addRow}>
        <input
          style={s.addInput}
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          placeholder="Add a task…"
        />
        <button style={s.addBtn} onClick={handleAddTask} disabled={addingTask || !newTitle.trim()}>
          {addingTask ? '…' : 'Add'}
        </button>
      </div>

      <div style={s.taskList}>
        {tasksLoading && <p style={{ ...s.subtle, padding: '1rem 1.75rem' }}>Loading tasks…</p>}

        {!tasksLoading && tasks.length === 0 && (
          <p style={{ ...s.subtle, padding: '1rem 1.75rem' }}>No tasks yet.</p>
        )}

        {pending.map(task => (
          <TaskRow key={task.id} task={task} toggling={togglingId === task.id} deleting={deletingId === task.id}
            onToggle={() => handleToggle(task)} onDelete={() => handleDelete(task.id)} />
        ))}

        {completed.length > 0 && (
          <>
            <div style={s.completedDivider}>Completed ({completed.length})</div>
            {completed.map(task => (
              <TaskRow key={task.id} task={task} toggling={togglingId === task.id} deleting={deletingId === task.id}
                onToggle={() => handleToggle(task)} onDelete={() => handleDelete(task.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, toggling, deleting, onToggle, onDelete }: {
  task: Task; toggling: boolean; deleting: boolean;
  onToggle: () => void; onDelete: () => void;
}) {
  const done = task.status === 'completed';
  return (
    <div style={{ ...s.taskRow, opacity: deleting ? 0.4 : 1 }}>
      <button style={{ ...s.checkbox, ...(done ? s.checkboxDone : {}) }} onClick={onToggle} disabled={toggling}>
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5 5 4 7.5 8.5 2"/>
          </svg>
        )}
      </button>
      <span style={{ ...s.taskTitle, ...(done ? s.taskDone : {}) }}>{task.title}</span>
      {task.notes && !done && <span style={s.taskNotes}>{task.notes}</span>}
      <button style={s.delBtn} onClick={onDelete} disabled={deleting} title="Delete">×</button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:             { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  center:           { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
  subtle:           { color: '#888', fontSize: '0.875rem' },
  connectCard:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 2.5rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: 360, textAlign: 'center' },
  taskIcon:         { marginBottom: '0.5rem' },
  connectTitle:     { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY },
  connectSub:       { margin: 0, fontSize: '0.825rem', color: '#666', maxWidth: 300 },
  connectBtn:       { marginTop: '0.5rem', padding: '0.65rem 1.75rem', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
  header:           { display: 'flex', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid #eee', flexShrink: 0, gap: '1rem' },
  headerLeft:       { display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 },
  title:            { fontSize: '1.05rem', fontWeight: 700, color: NAVY },
  listSelect:       { fontSize: '0.825rem', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 8px', background: '#f9f9fb', cursor: 'pointer', color: '#333' },
  listName:         { fontSize: '0.825rem', color: '#666' },
  addRow:           { display: 'flex', gap: '0.5rem', padding: '0.875rem 1.75rem', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
  addInput:         { flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem', outline: 'none', background: '#fff' },
  addBtn:           { padding: '0.5rem 1.1rem', background: GOLD, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
  taskList:         { flex: 1, overflowY: 'auto', padding: '0.5rem 0 2rem' },
  taskRow:          { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1.75rem', borderBottom: '1px solid #f8f8f8', transition: 'background 0.1s' },
  checkbox:         { width: 18, height: 18, minWidth: 18, borderRadius: 4, border: '2px solid #d1d5db', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  checkboxDone:     { background: NAVY, border: `2px solid ${NAVY}` },
  taskTitle:        { flex: 1, fontSize: '0.9rem', color: '#111' },
  taskDone:         { textDecoration: 'line-through', color: '#aaa' },
  taskNotes:        { fontSize: '0.75rem', color: '#999', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  completedDivider: { fontSize: '0.7rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0.875rem 1.75rem 0.375rem' },
  delBtn:           { background: 'none', border: 'none', color: '#ccc', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
};
