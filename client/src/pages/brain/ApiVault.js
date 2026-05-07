import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const ACCENT = '#22d3ee';
const PROVIDERS = [
    { id: 'anthropic', label: 'Anthropic', color: '#f97316', description: 'Powers Claude models', placeholder: 'sk-ant-api03-…' },
    { id: 'openai', label: 'OpenAI', color: '#22c55e', description: 'Powers GPT-4 models', placeholder: 'sk-proj-…' },
    { id: 'gemini', label: 'Google', color: '#8b5cf6', description: 'Powers Gemini models', placeholder: 'AIza…' },
    { id: 'grok', label: 'xAI', color: ACCENT, description: 'Powers Grok models', placeholder: 'xai-…' },
];
export default function ApiVault() {
    const [status, setStatus] = useState({ anthropic: false, openai: false, gemini: false, grok: false });
    const [editing, setEditing] = useState(null);
    const [keyInput, setKeyInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => {
        fetch('/api/apikeys').then(r => r.json()).then(setStatus).catch(() => { });
    }, []);
    const saveKey = async (provider) => {
        if (!keyInput.trim())
            return;
        setSaving(true);
        try {
            const res = await fetch(`/api/apikeys/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: keyInput.trim() }),
            });
            if (res.ok) {
                setStatus(prev => ({ ...prev, [provider]: true }));
                setEditing(null);
                setKeyInput('');
                setMessage(`${PROVIDERS.find(p => p.id === provider)?.label} key saved`);
                setTimeout(() => setMessage(''), 3000);
            }
        }
        finally {
            setSaving(false);
        }
    };
    const removeKey = async (provider) => {
        await fetch(`/api/apikeys/${provider}`, { method: 'DELETE' });
        setStatus(prev => ({ ...prev, [provider]: false }));
        setMessage(`${PROVIDERS.find(p => p.id === provider)?.label} key removed`);
        setTimeout(() => setMessage(''), 3000);
    };
    const connected = Object.values(status).filter(Boolean).length;
    return (_jsxs("div", { style: { maxWidth: '720px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }, children: "API Vault" }), _jsxs("p", { style: { margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)' }, children: [connected, " of ", PROVIDERS.length, " providers connected"] })] }), message && (_jsx("div", { style: { background: '#0d2a1a', border: '1px solid #22c55e44', borderRadius: '6px', color: '#22c55e', fontSize: '0.78rem', padding: '0.4rem 0.875rem' }, children: message }))] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: PROVIDERS.map(p => (_jsxs("div", { style: { background: '#111', border: `1px solid ${status[p.id] ? p.color + '33' : '#1e1e1e'}`, borderRadius: '8px', padding: '1rem 1.25rem', transition: 'border-color 0.2s' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.875rem' }, children: [_jsx("div", { style: { width: '8px', height: '8px', borderRadius: '50%', background: status[p.id] ? p.color : '#333', boxShadow: status[p.id] ? `0 0 8px ${p.color}` : 'none', flexShrink: 0, transition: 'all 0.2s' } }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }, children: p.label }), _jsx("div", { style: { fontSize: '0.72rem', color: 'rgba(248,250,252,0.35)', marginTop: '1px' }, children: p.description })] })] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: '0.7rem', color: status[p.id] ? p.color : 'rgba(248,250,252,0.25)', fontFamily: 'monospace', letterSpacing: '0.08em' }, children: status[p.id] ? 'CONNECTED' : 'NOT SET' }), status[p.id] ? (_jsx("button", { onClick: () => removeKey(p.id), style: { background: 'none', border: '1px solid #333', borderRadius: '4px', color: 'rgba(248,250,252,0.4)', cursor: 'pointer', fontSize: '0.72rem', padding: '3px 8px' }, children: "Remove" })) : (_jsx("button", { onClick: () => { setEditing(p.id); setKeyInput(''); }, style: { background: `${ACCENT}18`, border: `1px solid ${ACCENT}33`, borderRadius: '4px', color: ACCENT, cursor: 'pointer', fontSize: '0.72rem', padding: '3px 8px' }, children: "Add Key" }))] })] }), editing === p.id && (_jsxs("div", { style: { marginTop: '0.875rem', display: 'flex', gap: '0.5rem' }, children: [_jsx("input", { type: "password", autoFocus: true, value: keyInput, onChange: e => setKeyInput(e.target.value), placeholder: p.placeholder, onKeyDown: e => { if (e.key === 'Enter')
                                        saveKey(p.id); if (e.key === 'Escape')
                                        setEditing(null); }, style: { flex: 1, background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f8fafc', fontSize: '0.82rem', padding: '0.5rem 0.75rem', outline: 'none', fontFamily: 'monospace' } }), _jsx("button", { onClick: () => saveKey(p.id), disabled: saving || !keyInput.trim(), style: { background: ACCENT, border: 'none', borderRadius: '6px', color: '#0a0a0a', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, padding: '0.5rem 1rem' }, children: saving ? '…' : 'Save' }), _jsx("button", { onClick: () => setEditing(null), style: { background: 'none', border: '1px solid #2a2a2a', borderRadius: '6px', color: 'rgba(248,250,252,0.4)', cursor: 'pointer', fontSize: '0.78rem', padding: '0.5rem 0.75rem' }, children: "Cancel" })] }))] }, p.id))) })] }));
}
