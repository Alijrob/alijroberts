import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function AccountList({ accounts, selectedId, onSelect, onRefresh }) {
    const [testing, setTesting] = useState(null);
    const [results, setResults] = useState({});
    const [deleting, setDeleting] = useState(null);
    const testAccount = async (e, id) => {
        e.stopPropagation();
        setTesting(id);
        try {
            const res = await fetch(`/api/email/accounts/${id}/test`, { method: 'POST' });
            const data = await res.json();
            setResults(prev => ({ ...prev, [id]: data.ok }));
        }
        finally {
            setTesting(null);
        }
    };
    const deleteAccount = async (e, id, name) => {
        e.stopPropagation();
        if (!confirm(`Remove "${name}"?`))
            return;
        setDeleting(id);
        await fetch(`/api/email/accounts/${id}`, { method: 'DELETE' });
        setDeleting(null);
        onRefresh();
    };
    const reconnectOAuth = (e, id, provider) => {
        e.stopPropagation();
        window.location.href = `/api/email/oauth/${provider}/authorize?account_id=${id}`;
    };
    if (accounts.length === 0) {
        return _jsx("div", { style: s.empty, children: "No accounts connected yet" });
    }
    return (_jsx("div", { style: s.list, children: accounts.map(acct => {
            const result = results[acct.id];
            const isTesting = testing === acct.id;
            const isSelected = selectedId === acct.id;
            const needsAuth = acct.oauth_provider && !acct.oauth_connected;
            return (_jsxs("div", { style: { ...s.row, background: isSelected ? '#f0f4ff' : 'transparent', borderLeft: isSelected ? '3px solid #c9a840' : '3px solid transparent' }, onClick: () => onSelect(acct.id), children: [_jsx("div", { style: s.avatar, children: acct.display_name.charAt(0).toUpperCase() }), _jsxs("div", { style: s.info, children: [_jsxs("div", { style: s.nameRow, children: [_jsx("span", { style: s.name, children: acct.display_name }), acct.oauth_provider && (_jsx("span", { style: { ...s.badge, background: acct.oauth_connected ? '#dbeafe' : '#fee2e2', color: acct.oauth_connected ? '#1d4ed8' : '#dc2626' }, children: acct.oauth_connected ? 'OAuth ✓' : 'needs auth' }))] }), _jsx("span", { style: s.addr, children: acct.email_address })] }), _jsxs("div", { style: s.actions, children: [needsAuth ? (_jsx("button", { title: "Re-authorize", style: { ...s.actionBtn, color: '#dc2626', fontSize: '0.7rem', fontWeight: 700 }, onClick: e => reconnectOAuth(e, acct.id, acct.oauth_provider), children: "Auth" })) : (_jsx("button", { title: "Test connection", style: { ...s.actionBtn, color: result === true ? '#15803d' : result === false ? '#dc2626' : '#9ca3af' }, onClick: e => testAccount(e, acct.id), disabled: isTesting, children: isTesting ? '…' : result === true ? '✓' : result === false ? '✗' : '⟳' })), _jsx("button", { title: "Remove account", style: { ...s.actionBtn, color: '#dc2626' }, onClick: e => deleteAccount(e, acct.id, acct.display_name), disabled: deleting === acct.id, children: "\u2715" })] })] }, acct.id));
        }) }));
}
const s = {
    list: { overflowY: 'auto', flex: 1 },
    empty: { padding: '1.5rem 1rem', color: '#aaa', fontSize: '0.85rem', textAlign: 'center' },
    row: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.75rem', cursor: 'pointer', transition: 'background 0.1s' },
    avatar: { width: 34, height: 34, borderRadius: '50%', background: '#1c2866', color: '#c9a840', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 },
    info: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
    nameRow: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
    name: { fontSize: '0.83rem', fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    badge: { fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 10, flexShrink: 0 },
    addr: { fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    actions: { display: 'flex', gap: '0.15rem', flexShrink: 0 },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', padding: '4px 5px', borderRadius: 4 },
};
