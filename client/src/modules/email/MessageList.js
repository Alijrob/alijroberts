import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
function fmt(dateStr) {
    if (!dateStr)
        return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (now.getTime() - d.getTime() < 7 * 86400000)
        return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
export default function MessageList({ accountId, folder, selectedId, onSelect }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!accountId)
            return;
        setLoading(true);
        setError('');
        setMessages([]);
        fetch(`/api/email/accounts/${accountId}/messages?folder=${encodeURIComponent(folder)}&limit=50`)
            .then(r => r.json())
            .then(data => {
            if (data.error) {
                setError(data.error);
                setLoading(false);
                return;
            }
            setMessages(Array.isArray(data) ? data : []);
            setLoading(false);
        })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [accountId, folder]);
    if (loading)
        return _jsx("div", { style: s.state, children: "Syncing\u2026" });
    if (error)
        return _jsx("div", { style: { ...s.state, color: '#dc2626', fontSize: '0.8rem', padding: '1rem' }, children: error });
    if (!messages.length)
        return _jsx("div", { style: s.state, children: "No messages" });
    return (_jsx("div", { style: s.list, children: messages.map(msg => (_jsxs("div", { style: { ...s.row, background: selectedId === msg.id ? '#eef1ff' : 'transparent', borderLeft: selectedId === msg.id ? '3px solid #c9a840' : '3px solid transparent' }, onClick: () => onSelect(msg), children: [_jsx("div", { style: s.dot, children: !msg.is_read && _jsx("span", { style: s.unreadDot }) }), _jsxs("div", { style: s.body, children: [_jsxs("div", { style: s.top, children: [_jsx("span", { style: { ...s.sender, fontWeight: msg.is_read ? 400 : 700 }, children: msg.from_name || msg.from_address || 'Unknown' }), _jsx("span", { style: s.date, children: fmt(msg.date_sent) })] }), _jsx("div", { style: { ...s.subject, fontWeight: msg.is_read ? 400 : 600 }, children: msg.subject || '(no subject)' }), msg.snippet && _jsx("div", { style: s.snippet, children: msg.snippet })] })] }, msg.id))) }));
}
const s = {
    list: { overflowY: 'auto', flex: 1 },
    state: { padding: '2rem 1rem', color: '#aaa', fontSize: '0.875rem', textAlign: 'center' },
    row: { display: 'flex', gap: '0.5rem', padding: '0.65rem 0.75rem', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', transition: 'background 0.1s' },
    dot: { width: 10, flexShrink: 0, display: 'flex', alignItems: 'flex-start', paddingTop: 5 },
    unreadDot: { display: 'block', width: 8, height: 8, borderRadius: '50%', background: '#1c2866' },
    body: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
    top: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem' },
    sender: { fontSize: '0.83rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    date: { fontSize: '0.72rem', color: '#888', flexShrink: 0 },
    subject: { fontSize: '0.8rem', color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    snippet: { fontSize: '0.75rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
