import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
const HOUR_H = 56;
const DAY_START = 7;
// ── helpers ──────────────────────────────────────────────────────────────────
function isoDate(d) { return d.toISOString().slice(0, 10); }
function startOfWeek(d) { const r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() - r.getDay()); return r; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function getEventDate(e) { return e.start.date ?? e.start.dateTime?.slice(0, 10) ?? ''; }
function startMin(e) { if (!e.start.dateTime)
    return 0; const d = new Date(e.start.dateTime); return d.getHours() * 60 + d.getMinutes(); }
function durMin(e) { if (!e.start.dateTime || !e.end.dateTime)
    return 60; return (new Date(e.end.dateTime).getTime() - new Date(e.start.dateTime).getTime()) / 60000; }
function fmtTime(dt) { return new Date(dt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function fmtHour(h) { if (h === 12)
    return '12pm'; return h < 12 ? `${h}am` : `${h - 12}pm`; }
function eventColor(_e) { return NAVY; }
function todayStr() { return isoDate(new Date()); }
function blankForm(date) {
    const t = date ?? todayStr();
    return { summary: '', startDate: t, endDate: t, startTime: '09:00', endTime: '10:00', description: '', allDay: false };
}
// ── Month view ────────────────────────────────────────────────────────────────
function MonthView({ events, focusDate, today, onDayClick, onEventClick }) {
    const monthStart = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const byDate = new Map();
    for (const e of events) {
        const k = getEventDate(e);
        if (!byDate.has(k))
            byDate.set(k, []);
        byDate.get(k).push(e);
    }
    return (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }, children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (_jsx("div", { style: { padding: '8px 0', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: d }, d))) }), _jsx("div", { style: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(6,1fr)', overflow: 'hidden' }, children: days.map((day, i) => {
                    const ds = isoDate(day);
                    const isToday = ds === today;
                    const inMonth = day.getMonth() === focusDate.getMonth();
                    const evts = byDate.get(ds) ?? [];
                    const show = evts.slice(0, 3);
                    const more = evts.length - 3;
                    return (_jsxs("div", { onClick: () => onDayClick(ds), style: { border: '1px solid #f0f0f0', borderTop: isToday ? `2px solid ${GOLD}` : '1px solid #f0f0f0', padding: '4px 6px', overflow: 'hidden', cursor: 'pointer', background: isToday ? '#fffbeb' : '#fff' }, children: [_jsx("div", { style: { width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                                    background: isToday ? GOLD : 'transparent',
                                    color: isToday ? '#fff' : inMonth ? '#333' : '#ccc',
                                    fontSize: '0.75rem', fontWeight: isToday ? 700 : 400, marginBottom: 2 }, children: day.getDate() }), show.map(ev => (_jsxs("div", { onClick: e => { e.stopPropagation(); onEventClick(ev); }, style: { background: eventColor(ev), color: '#fff', borderRadius: 3, padding: '1px 5px', fontSize: '0.67rem', fontWeight: 500, marginBottom: 2,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }, children: [ev.start.dateTime ? fmtTime(ev.start.dateTime) + ' ' : '', ev.summary] }, ev.id))), more > 0 && _jsxs("div", { style: { fontSize: '0.62rem', color: '#888', paddingLeft: 4 }, children: ["+", more, " more"] })] }, i));
                }) })] }));
}
// ── Week view ─────────────────────────────────────────────────────────────────
function WeekView({ events, focusDate, today, onEventClick }) {
    const ws = startOfWeek(focusDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const hours = Array.from({ length: 15 }, (_, i) => i + DAY_START);
    const totalH = hours.length * HOUR_H;
    const allDay = events.filter(e => !!e.start.date || !e.start.dateTime);
    const timed = events.filter(e => !!e.start.dateTime);
    return (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '52px repeat(7,1fr)', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }, children: [_jsx("div", {}), days.map((d, i) => {
                        const ds = isoDate(d);
                        const isT = ds === today;
                        return (_jsxs("div", { style: { padding: '8px 4px', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '0.65rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }, children: d.toLocaleDateString([], { weekday: 'short' }) }), _jsx("div", { style: { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0', borderRadius: '50%',
                                        background: isT ? GOLD : 'transparent', color: isT ? '#fff' : '#333', fontSize: '0.95rem', fontWeight: 700 }, children: d.getDate() })] }, i));
                    })] }), allDay.length > 0 && (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '52px repeat(7,1fr)', borderBottom: '1px solid #eee', minHeight: 26, flexShrink: 0 }, children: [_jsx("div", { style: { fontSize: '0.6rem', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }, children: "all-day" }), days.map((d, i) => {
                        const evs = allDay.filter(e => getEventDate(e) === isoDate(d));
                        return _jsx("div", { style: { padding: '2px 3px' }, children: evs.map(ev => (_jsx("div", { onClick: () => onEventClick(ev), style: { background: eventColor(ev), color: '#fff', borderRadius: 3, padding: '1px 5px', fontSize: '0.67rem', fontWeight: 500, cursor: 'pointer', marginBottom: 2,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: ev.summary }, ev.id))) }, i);
                    })] })), _jsx("div", { style: { flex: 1, overflowY: 'auto' }, children: _jsxs("div", { style: { display: 'flex', position: 'relative', height: totalH }, children: [_jsx("div", { style: { width: 52, flexShrink: 0 }, children: hours.map(h => (_jsx("div", { style: { height: HOUR_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, fontSize: '0.62rem', color: '#bbb', userSelect: 'none' }, children: fmtHour(h) }, h))) }), days.map((d, di) => {
                            const ds = isoDate(d);
                            const dayEvts = timed.filter(e => getEventDate(e) === ds);
                            return (_jsxs("div", { style: { flex: 1, position: 'relative', borderLeft: '1px solid #e5e7eb' }, children: [hours.map(h => (_jsx("div", { style: { position: 'absolute', top: (h - DAY_START) * HOUR_H, width: '100%', height: HOUR_H, borderTop: '1px solid #f5f5f5' } }, h))), dayEvts.map(ev => {
                                        const top = Math.max(0, (startMin(ev) - DAY_START * 60) / 60 * HOUR_H);
                                        const h = Math.max(22, durMin(ev) / 60 * HOUR_H - 2);
                                        return (_jsxs("div", { onClick: () => onEventClick(ev), style: { position: 'absolute', top, left: 2, right: 2, height: h, background: eventColor(ev), color: '#fff',
                                                borderRadius: 4, padding: '2px 5px', fontSize: '0.68rem', fontWeight: 500, overflow: 'hidden', cursor: 'pointer',
                                                zIndex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }, children: [_jsx("div", { style: { fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: ev.summary }), h > 30 && _jsx("div", { style: { fontSize: '0.6rem', opacity: 0.9 }, children: fmtTime(ev.start.dateTime) })] }, ev.id));
                                    })] }, di));
                        })] }) })] }));
}
// ── Day view ──────────────────────────────────────────────────────────────────
function DayView({ events, focusDate, today, onEventClick }) {
    const ds = isoDate(focusDate);
    const dayEvts = events.filter(e => getEventDate(e) === ds);
    const allDay = dayEvts.filter(e => !!e.start.date || !e.start.dateTime);
    const timed = dayEvts.filter(e => !!e.start.dateTime);
    const hours = Array.from({ length: 15 }, (_, i) => i + DAY_START);
    const totalH = hours.length * HOUR_H;
    const isToday = ds === today;
    return (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsxs("div", { style: { padding: '10px 20px', borderBottom: '1px solid #eee', flexShrink: 0 }, children: [_jsx("span", { style: { fontSize: '1rem', fontWeight: 700, color: isToday ? GOLD : NAVY }, children: focusDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }), isToday && _jsx("span", { style: { fontSize: '0.72rem', color: GOLD, marginLeft: 8, fontWeight: 600 }, children: "Today" })] }), allDay.length > 0 && (_jsx("div", { style: { padding: '6px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }, children: allDay.map(ev => (_jsx("div", { onClick: () => onEventClick(ev), style: { background: eventColor(ev), color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }, children: ev.summary }, ev.id))) })), _jsx("div", { style: { flex: 1, overflowY: 'auto' }, children: _jsxs("div", { style: { display: 'flex', position: 'relative', height: totalH }, children: [_jsx("div", { style: { width: 52, flexShrink: 0 }, children: hours.map(h => (_jsx("div", { style: { height: HOUR_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, fontSize: '0.62rem', color: '#bbb', userSelect: 'none' }, children: fmtHour(h) }, h))) }), _jsxs("div", { style: { flex: 1, position: 'relative', borderLeft: '1px solid #e5e7eb' }, children: [hours.map(h => (_jsx("div", { style: { position: 'absolute', top: (h - DAY_START) * HOUR_H, width: '100%', height: HOUR_H, borderTop: '1px solid #f5f5f5' } }, h))), timed.map(ev => {
                                    const top = Math.max(0, (startMin(ev) - DAY_START * 60) / 60 * HOUR_H);
                                    const h = Math.max(24, durMin(ev) / 60 * HOUR_H - 2);
                                    return (_jsxs("div", { onClick: () => onEventClick(ev), style: { position: 'absolute', top, left: 4, right: 4, height: h, background: eventColor(ev), color: '#fff',
                                            borderRadius: 5, padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', cursor: 'pointer',
                                            zIndex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: ev.summary }), h > 36 && _jsxs("div", { style: { fontSize: '0.7rem', opacity: 0.9 }, children: [fmtTime(ev.start.dateTime), " \u2013 ", fmtTime(ev.end.dateTime)] })] }, ev.id));
                                })] })] }) })] }));
}
// ── Event detail modal ────────────────────────────────────────────────────────
function EventModal({ event, onClose, onDelete, deleting }) {
    return (_jsx("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }, onClick: onClose, children: _jsxs("div", { style: { background: '#fff', borderRadius: 10, padding: '1.5rem', maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }, onClick: e => e.stopPropagation(), children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }, children: [_jsx("div", { style: { width: 10, height: 10, borderRadius: '50%', background: eventColor(event), marginTop: 5, marginRight: 8, flexShrink: 0 } }), _jsx("span", { style: { flex: 1, fontSize: '1rem', fontWeight: 700, color: '#111' }, children: event.summary }), _jsx("button", { onClick: onClose, style: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#aaa', padding: '0 4px' }, children: "\u00D7" })] }), _jsx("div", { style: { fontSize: '0.82rem', color: '#666', marginBottom: '0.5rem' }, children: event.start.dateTime
                        ? `${new Date(event.start.dateTime).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} · ${fmtTime(event.start.dateTime)} – ${fmtTime(event.end.dateTime)}`
                        : new Date(event.start.date + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }), event.description && _jsx("div", { style: { fontSize: '0.82rem', color: '#555', marginBottom: '0.75rem' }, children: event.description }), _jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0' }, children: _jsx("button", { onClick: () => onDelete(event.id), disabled: deleting, style: { padding: '0.4rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 5, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }, children: deleting ? 'Deleting…' : 'Delete Event' }) })] }) }));
}
// ── New event form ────────────────────────────────────────────────────────────
function NewEventForm({ form, setF, error, saving, onSave, onCancel }) {
    return (_jsxs("div", { style: { margin: '0.875rem 1.5rem', background: '#f9f9fb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flexShrink: 0 }, children: [_jsxs("div", { style: fs.row, children: [_jsx("label", { style: fs.lbl, children: "Title" }), _jsx("input", { style: fs.inp, value: form.summary, onChange: e => setF('summary', e.target.value), placeholder: "Event title", autoFocus: true })] }), _jsxs("div", { style: fs.grid2, children: [_jsxs("div", { style: fs.row, children: [_jsx("label", { style: fs.lbl, children: "Date" }), _jsx("input", { style: fs.inp, type: "date", value: form.startDate, onChange: e => { setF('startDate', e.target.value); setF('endDate', e.target.value); } })] }), _jsx("div", { style: { ...fs.row, justifyContent: 'center', paddingTop: 18 }, children: _jsxs("label", { style: { fontSize: '0.8rem', color: '#555', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: form.allDay, onChange: e => setF('allDay', e.target.checked) }), "All day"] }) })] }), !form.allDay && (_jsxs("div", { style: fs.grid2, children: [_jsxs("div", { style: fs.row, children: [_jsx("label", { style: fs.lbl, children: "Start" }), _jsx("input", { style: fs.inp, type: "time", value: form.startTime, onChange: e => setF('startTime', e.target.value) })] }), _jsxs("div", { style: fs.row, children: [_jsx("label", { style: fs.lbl, children: "End" }), _jsx("input", { style: fs.inp, type: "time", value: form.endTime, onChange: e => setF('endTime', e.target.value) })] })] })), _jsxs("div", { style: fs.row, children: [_jsx("label", { style: fs.lbl, children: "Description" }), _jsx("input", { style: fs.inp, value: form.description, onChange: e => setF('description', e.target.value), placeholder: "Optional" })] }), error && _jsx("div", { style: { fontSize: '0.78rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '0.4rem 0.6rem' }, children: error }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }, children: [_jsx("button", { style: fs.cancel, onClick: onCancel, children: "Cancel" }), _jsx("button", { style: fs.save, onClick: onSave, disabled: saving, children: saving ? 'Saving…' : 'Save Event' })] })] }));
}
const fs = {
    row: { display: 'flex', flexDirection: 'column', gap: 3 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' },
    lbl: { fontSize: '0.68rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' },
    inp: { padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 5, fontSize: '0.85rem', background: '#fff', outline: 'none' },
    cancel: { padding: '0.4rem 0.9rem', border: '1px solid #d1d5db', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: '0.8rem', color: '#555' },
    save: { padding: '0.4rem 1rem', background: GOLD, color: '#fff', border: 'none', borderRadius: 5, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' },
};
// ── Main component ────────────────────────────────────────────────────────────
export default function CalendarModule() {
    const today = todayStr();
    const [status, setStatus] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month');
    const [focusDate, setFocusDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [form, setFormState] = useState(blankForm());
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const fetchedRange = useRef(null);
    const setF = (k, v) => setFormState(f => ({ ...f, [k]: v }));
    const loadEventsForDate = useCallback(async (d, force = false) => {
        const winMin = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        const winMax = new Date(d.getFullYear(), d.getMonth() + 3, 1);
        const ts = d.getTime();
        if (!force && fetchedRange.current) {
            const { min, max } = fetchedRange.current;
            if (ts >= min && ts <= max)
                return; // already cached
        }
        setSyncing(true);
        try {
            const params = new URLSearchParams({
                timeMin: winMin.toISOString(),
                timeMax: winMax.toISOString(),
            });
            const res = await fetch(`/api/calendar/events?${params}`);
            const data = await res.json();
            if (data.items) {
                setEvents(data.items);
                fetchedRange.current = { min: winMin.getTime(), max: winMax.getTime() };
            }
        }
        finally {
            setSyncing(false);
        }
    }, []);
    const loadStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/calendar/status');
            const data = await res.json();
            setStatus(data);
            if (data.connected)
                await loadEventsForDate(new Date());
        }
        finally {
            setLoading(false);
        }
    }, [loadEventsForDate]);
    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        if (p.get('google_auth_success'))
            window.history.replaceState({}, '', window.location.pathname);
        loadStatus();
    }, [loadStatus]);
    // Re-sync when navigating to a period outside the cached range
    useEffect(() => {
        if (status?.connected)
            loadEventsForDate(focusDate);
    }, [focusDate, status?.connected, loadEventsForDate]);
    // ── Navigation ──────────────────────────────────────────────────────────────
    function navPrev() {
        setFocusDate(d => {
            if (view === 'month')
                return addMonths(d, -1);
            if (view === 'week')
                return addDays(d, -7);
            return addDays(d, -1);
        });
    }
    function navNext() {
        setFocusDate(d => {
            if (view === 'month')
                return addMonths(d, 1);
            if (view === 'week')
                return addDays(d, 7);
            return addDays(d, 1);
        });
    }
    function periodLabel() {
        if (view === 'month')
            return focusDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
        if (view === 'week') {
            const ws = startOfWeek(focusDate);
            const we = addDays(ws, 6);
            return `${ws.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return focusDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    // ── Actions ─────────────────────────────────────────────────────────────────
    async function handleSaveEvent() {
        if (!form.summary.trim()) {
            setFormError('Title is required');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            const res = await fetch('/api/calendar/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const data = await res.json();
            if (data.error) {
                setFormError(data.error);
                return;
            }
            setShowForm(false);
            await loadEventsForDate(focusDate, true);
        }
        finally {
            setSaving(false);
        }
    }
    async function handleDelete(id) {
        setDeletingId(id);
        try {
            await fetch(`/api/calendar/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
            setEvents(ev => ev.filter(e => e.id !== id));
            setSelectedEvent(null);
        }
        finally {
            setDeletingId(null);
        }
    }
    async function handleDisconnect() {
        if (!confirm('Disconnect Google Calendar & Tasks?'))
            return;
        await fetch('/api/calendar/auth', { method: 'DELETE' });
        setStatus({ connected: false, email: null });
        setEvents([]);
    }
    function openNewEvent(date) {
        setFormState(blankForm(date));
        setFormError('');
        setShowForm(true);
    }
    if (loading)
        return _jsx("div", { style: s.center, children: _jsx("span", { style: s.subtle, children: "Loading\u2026" }) });
    if (!status?.connected) {
        return (_jsx("div", { style: s.center, children: _jsxs("div", { style: s.connectCard, children: [_jsxs("svg", { width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: NAVY, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { marginBottom: 8 }, children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), _jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })] }), _jsx("p", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: NAVY }, children: "Connect Google Calendar" }), _jsx("p", { style: { margin: 0, fontSize: '0.825rem', color: '#666', maxWidth: 300, textAlign: 'center' }, children: "Authorize once to enable both Calendar and Tasks." }), _jsx("button", { style: s.connectBtn, onClick: () => { window.location.href = '/api/calendar/auth/start'; }, children: "Connect with Google" })] }) }));
    }
    return (_jsxs("div", { style: s.page, children: [_jsxs("div", { style: s.topBar, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("button", { style: s.navBtn, onClick: navPrev, children: "\u2039" }), _jsx("button", { style: s.navBtn, onClick: navNext, children: "\u203A" }), _jsx("button", { style: s.todayBtn, onClick: () => setFocusDate(new Date()), children: "Today" }), _jsx("span", { style: s.periodLabel, children: periodLabel() })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("div", { style: s.viewSwitcher, children: ['day', 'week', 'month'].map(v => (_jsx("button", { style: { ...s.viewBtn, ...(view === v ? s.viewBtnActive : {}) }, onClick: () => setView(v), children: v.charAt(0).toUpperCase() + v.slice(1) }, v))) }), _jsx("button", { style: s.newBtn, onClick: () => openNewEvent(), children: "+ New Event" }), _jsx("button", { style: s.disconnectBtn, onClick: () => loadEventsForDate(focusDate, true), title: "Sync", disabled: syncing, children: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { animation: syncing ? 'spin 1s linear infinite' : 'none' }, children: [_jsx("polyline", { points: "23 4 23 10 17 10" }), _jsx("polyline", { points: "1 20 1 14 7 14" }), _jsx("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })] }) }), _jsx("button", { style: s.disconnectBtn, onClick: handleDisconnect, title: "Disconnect Google", children: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }), _jsx("polyline", { points: "16 17 21 12 16 7" }), _jsx("line", { x1: "21", y1: "12", x2: "9", y2: "12" })] }) })] })] }), showForm && (_jsx(NewEventForm, { form: form, setF: setF, error: formError, saving: saving, onSave: handleSaveEvent, onCancel: () => setShowForm(false) })), view === 'month' && (_jsx(MonthView, { events: events, focusDate: focusDate, today: today, onDayClick: d => openNewEvent(d), onEventClick: e => setSelectedEvent(e) })), view === 'week' && (_jsx(WeekView, { events: events, focusDate: focusDate, today: today, onEventClick: e => setSelectedEvent(e) })), view === 'day' && (_jsx(DayView, { events: events, focusDate: focusDate, today: today, onEventClick: e => setSelectedEvent(e) })), selectedEvent && (_jsx(EventModal, { event: selectedEvent, onClose: () => setSelectedEvent(null), onDelete: handleDelete, deleting: deletingId === selectedEvent.id }))] }));
}
// inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('cal-spin')) {
    const style = document.createElement('style');
    style.id = 'cal-spin';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}
const s = {
    page: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
    subtle: { color: '#888', fontSize: '0.875rem' },
    connectCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 2.5rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: 360 },
    connectBtn: { marginTop: '0.5rem', padding: '0.65rem 1.75rem', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
    topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #eee', flexShrink: 0, gap: '0.5rem' },
    navBtn: { background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem', color: '#555', fontWeight: 700 },
    todayBtn: { padding: '0.3rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#333' },
    periodLabel: { fontSize: '0.95rem', fontWeight: 700, color: NAVY, minWidth: 160 },
    viewSwitcher: { display: 'flex', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' },
    viewBtn: { padding: '0.3rem 0.75rem', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, color: '#555', borderRight: '1px solid #e5e7eb' },
    viewBtnActive: { background: NAVY, color: '#fff', fontWeight: 700 },
    newBtn: { padding: '0.35rem 0.9rem', background: GOLD, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' },
    disconnectBtn: { padding: '0.3rem 0.5rem', background: '#fff', color: '#aaa', border: '1px solid #e5e7eb', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center' },
};
