import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function FolderTree({ accounts, selectedAccountId, selectedFolder, onSelectAccount, onSelectFolder }) {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!selectedAccountId)
            return;
        setLoading(true);
        fetch(`/api/email/accounts/${selectedAccountId}/folders`)
            .then(r => r.json())
            .then(data => { setFolders(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [selectedAccountId]);
    const ICONS = {
        inbox: '📥', sent: '📤', drafts: '📝', trash: '🗑', spam: '⚠', junk: '⚠',
        archive: '📦', starred: '⭐', all: '📋',
    };
    const folderIcon = (path) => {
        const p = path.toLowerCase();
        for (const [key, icon] of Object.entries(ICONS)) {
            if (p.includes(key))
                return icon;
        }
        return '📁';
    };
    return (_jsxs("div", { style: s.wrap, children: [_jsx("div", { style: s.accountTabs, children: accounts.map(a => (_jsx("button", { style: { ...s.accountTab, background: selectedAccountId === a.id ? '#1c2866' : 'transparent', color: selectedAccountId === a.id ? '#c9a840' : '#555' }, onClick: () => { onSelectAccount(a.id); onSelectFolder('INBOX'); }, title: a.email_address, children: a.display_name.charAt(0).toUpperCase() }, a.id))) }), _jsxs("div", { style: s.folderList, children: [loading && _jsx("div", { style: s.hint, children: "Loading\u2026" }), !loading && folders.map(f => (_jsxs("button", { style: { ...s.folderBtn, background: selectedFolder === f.path ? '#eef1ff' : 'transparent', fontWeight: selectedFolder === f.path ? 700 : 400, borderLeft: selectedFolder === f.path ? '3px solid #c9a840' : '3px solid transparent' }, onClick: () => onSelectFolder(f.path), children: [_jsx("span", { style: s.folderIcon, children: folderIcon(f.path) }), _jsx("span", { style: s.folderName, children: f.name }), f.unseen_count > 0 && _jsx("span", { style: s.badge, children: f.unseen_count })] }, f.id)))] })] }));
}
const s = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
    accountTabs: { display: 'flex', gap: 4, padding: '0.5rem 0.5rem 0', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' },
    accountTab: { width: 32, height: 32, borderRadius: '50%', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 },
    folderList: { overflowY: 'auto', flex: 1, padding: '0.25rem 0' },
    hint: { padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#aaa' },
    folderBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.75rem', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem', color: '#222' },
    folderIcon: { fontSize: '0.85rem', flexShrink: 0 },
    folderName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    badge: { fontSize: '0.68rem', fontWeight: 700, background: '#1c2866', color: '#c9a840', borderRadius: 10, padding: '1px 5px', flexShrink: 0 },
};
