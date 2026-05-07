import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export default function MessageReader({ message }) {
    const [body, setBody] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!message) {
            setBody(null);
            return;
        }
        setLoading(true);
        setBody(null);
        fetch(`/api/email/messages/${message.id}/body`)
            .then(r => r.json())
            .then(data => { setBody(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [message?.id]);
    if (!message) {
        return (_jsxs("div", { style: s.empty, children: [_jsx("div", { style: s.emptyIcon, children: "\u2709" }), _jsx("p", { style: s.emptyText, children: "Select a message to read" })] }));
    }
    const from = message.from_name
        ? `${message.from_name} <${message.from_address}>`
        : (message.from_address ?? 'Unknown');
    const dateStr = message.date_sent
        ? new Date(message.date_sent).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : '';
    return (_jsxs("div", { style: s.wrap, children: [_jsxs("div", { style: s.header, children: [_jsx("div", { style: s.subject, children: message.subject || '(no subject)' }), _jsxs("div", { style: s.meta, children: [_jsx("span", { style: s.from, children: from }), _jsx("span", { style: s.date, children: dateStr })] })] }), _jsxs("div", { style: s.bodyWrap, children: [loading && _jsx("div", { style: s.loading, children: "Loading\u2026" }), !loading && body && (body.html
                        ? _jsx("iframe", { srcDoc: body.html, sandbox: "allow-popups allow-popups-to-escape-sandbox", style: s.iframe, title: "email-body" })
                        : _jsx("pre", { style: s.text, children: body.text })), !loading && !body && _jsx("div", { style: s.loading, children: "Could not load message" })] })] }));
}
const s = {
    empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#bbb' },
    emptyIcon: { fontSize: '2.5rem', opacity: 0.3 },
    emptyText: { fontSize: '0.875rem', margin: 0 },
    wrap: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
    header: { padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#fff' },
    subject: { fontSize: '1rem', fontWeight: 700, color: '#111', marginBottom: '0.4rem' },
    meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
    from: { fontSize: '0.8rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    date: { fontSize: '0.75rem', color: '#888', flexShrink: 0 },
    bodyWrap: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff' },
    iframe: { flex: 1, border: 'none', width: '100%', height: '100%' },
    text: { flex: 1, padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#333', whiteSpace: 'pre-wrap', overflowY: 'auto', margin: 0, lineHeight: 1.6 },
    loading: { padding: '2rem', color: '#aaa', fontSize: '0.875rem', textAlign: 'center' },
};
