import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
export default function TasksModule() {
    const [status, setStatus] = useState(null);
    const [lists, setLists] = useState([]);
    const [activeList, setActiveList] = useState('@default');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [addingTask, setAddingTask] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const loadStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/tasks/status');
            const data = await res.json();
            setStatus(data);
            if (data.connected) {
                await loadLists();
            }
        }
        finally {
            setLoading(false);
        }
    }, []);
    const loadLists = async () => {
        const res = await fetch('/api/tasks/lists');
        const data = await res.json();
        if (data.items?.length) {
            setLists(data.items);
            setActiveList(data.items[0].id);
            await loadTasks(data.items[0].id);
        }
    };
    const loadTasks = async (listId) => {
        setTasksLoading(true);
        try {
            const res = await fetch(`/api/tasks/tasks?list_id=${encodeURIComponent(listId)}`);
            const data = await res.json();
            setTasks(data.items ?? []);
        }
        finally {
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
    const handleListChange = (listId) => {
        setActiveList(listId);
        loadTasks(listId);
    };
    const handleAddTask = async () => {
        if (!newTitle.trim())
            return;
        setAddingTask(true);
        try {
            const res = await fetch('/api/tasks/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle.trim(), list_id: activeList }),
            });
            const task = await res.json();
            if (task.id) {
                setTasks(t => [task, ...t]);
                setNewTitle('');
            }
        }
        finally {
            setAddingTask(false);
        }
    };
    const handleToggle = async (task) => {
        const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
        setTogglingId(task.id);
        try {
            const res = await fetch(`/api/tasks/tasks/${encodeURIComponent(task.id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, list_id: activeList }),
            });
            const updated = await res.json();
            setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: updated.status } : t));
        }
        finally {
            setTogglingId(null);
        }
    };
    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await fetch(`/api/tasks/tasks/${encodeURIComponent(id)}?list_id=${encodeURIComponent(activeList)}`, {
                method: 'DELETE',
            });
            setTasks(ts => ts.filter(t => t.id !== id));
        }
        finally {
            setDeletingId(null);
        }
    };
    const pending = tasks.filter(t => t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');
    if (loading)
        return _jsx("div", { style: s.center, children: _jsx("span", { style: s.subtle, children: "Loading\u2026" }) });
    if (!status?.connected) {
        return (_jsx("div", { style: s.center, children: _jsxs("div", { style: s.connectCard, children: [_jsx("div", { style: s.taskIcon, children: _jsxs("svg", { width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: NAVY, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "9 11 12 14 22 4" }), _jsx("path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" })] }) }), _jsx("p", { style: s.connectTitle, children: "Connect Google Tasks" }), _jsx("p", { style: s.connectSub, children: "Uses the same Google authorization as Calendar \u2014 one click enables both." }), _jsx("button", { style: s.connectBtn, onClick: () => { window.location.href = '/api/tasks/auth/start'; }, children: "Connect with Google" })] }) }));
    }
    return (_jsxs("div", { style: s.page, children: [_jsx("div", { style: s.header, children: _jsxs("div", { style: s.headerLeft, children: [_jsx("span", { style: s.title, children: "Tasks" }), lists.length > 1 && (_jsx("select", { style: s.listSelect, value: activeList, onChange: e => handleListChange(e.target.value), children: lists.map(l => _jsx("option", { value: l.id, children: l.title }, l.id)) })), lists.length > 0 && lists[0].id !== '@default' && lists.length === 1 && (_jsx("span", { style: s.listName, children: lists[0].title }))] }) }), _jsxs("div", { style: s.addRow, children: [_jsx("input", { style: s.addInput, value: newTitle, onChange: e => setNewTitle(e.target.value), onKeyDown: e => e.key === 'Enter' && handleAddTask(), placeholder: "Add a task\u2026" }), _jsx("button", { style: s.addBtn, onClick: handleAddTask, disabled: addingTask || !newTitle.trim(), children: addingTask ? '…' : 'Add' })] }), _jsxs("div", { style: s.taskList, children: [tasksLoading && _jsx("p", { style: { ...s.subtle, padding: '1rem 1.75rem' }, children: "Loading tasks\u2026" }), !tasksLoading && tasks.length === 0 && (_jsx("p", { style: { ...s.subtle, padding: '1rem 1.75rem' }, children: "No tasks yet." })), pending.map(task => (_jsx(TaskRow, { task: task, toggling: togglingId === task.id, deleting: deletingId === task.id, onToggle: () => handleToggle(task), onDelete: () => handleDelete(task.id) }, task.id))), completed.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { style: s.completedDivider, children: ["Completed (", completed.length, ")"] }), completed.map(task => (_jsx(TaskRow, { task: task, toggling: togglingId === task.id, deleting: deletingId === task.id, onToggle: () => handleToggle(task), onDelete: () => handleDelete(task.id) }, task.id)))] }))] })] }));
}
function TaskRow({ task, toggling, deleting, onToggle, onDelete }) {
    const done = task.status === 'completed';
    return (_jsxs("div", { style: { ...s.taskRow, opacity: deleting ? 0.4 : 1 }, children: [_jsx("button", { style: { ...s.checkbox, ...(done ? s.checkboxDone : {}) }, onClick: onToggle, disabled: toggling, children: done && (_jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "1.5 5 4 7.5 8.5 2" }) })) }), _jsx("span", { style: { ...s.taskTitle, ...(done ? s.taskDone : {}) }, children: task.title }), task.notes && !done && _jsx("span", { style: s.taskNotes, children: task.notes }), _jsx("button", { style: s.delBtn, onClick: onDelete, disabled: deleting, title: "Delete", children: "\u00D7" })] }));
}
const s = {
    page: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
    subtle: { color: '#888', fontSize: '0.875rem' },
    connectCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 2.5rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: 360, textAlign: 'center' },
    taskIcon: { marginBottom: '0.5rem' },
    connectTitle: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY },
    connectSub: { margin: 0, fontSize: '0.825rem', color: '#666', maxWidth: 300 },
    connectBtn: { marginTop: '0.5rem', padding: '0.65rem 1.75rem', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
    header: { display: 'flex', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid #eee', flexShrink: 0, gap: '1rem' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 },
    title: { fontSize: '1.05rem', fontWeight: 700, color: NAVY },
    listSelect: { fontSize: '0.825rem', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 8px', background: '#f9f9fb', cursor: 'pointer', color: '#333' },
    listName: { fontSize: '0.825rem', color: '#666' },
    addRow: { display: 'flex', gap: '0.5rem', padding: '0.875rem 1.75rem', borderBottom: '1px solid #f0f0f0', flexShrink: 0 },
    addInput: { flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem', outline: 'none', background: '#fff' },
    addBtn: { padding: '0.5rem 1.1rem', background: GOLD, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
    taskList: { flex: 1, overflowY: 'auto', padding: '0.5rem 0 2rem' },
    taskRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1.75rem', borderBottom: '1px solid #f8f8f8', transition: 'background 0.1s' },
    checkbox: { width: 18, height: 18, minWidth: 18, borderRadius: 4, border: '2px solid #d1d5db', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    checkboxDone: { background: NAVY, border: `2px solid ${NAVY}` },
    taskTitle: { flex: 1, fontSize: '0.9rem', color: '#111' },
    taskDone: { textDecoration: 'line-through', color: '#aaa' },
    taskNotes: { fontSize: '0.75rem', color: '#999', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    completedDivider: { fontSize: '0.7rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0.875rem 1.75rem 0.375rem' },
    delBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
};
