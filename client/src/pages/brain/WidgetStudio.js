import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const ACCENT = '#22d3ee';
export default function WidgetStudio() {
    const [status, setStatus] = useState(null);
    const [pushing, setPushing] = useState(false);
    const [pushResult, setPushResult] = useState(null);
    const load = () => {
        fetch('/api/brain/widget-status')
            .then(r => r.json())
            .then(setStatus)
            .catch(() => { });
    };
    useEffect(() => { load(); }, []);
    const pushUpdate = async () => {
        setPushing(true);
        setPushResult(null);
        try {
            const res = await fetch('/api/brain/widget-push', { method: 'POST' });
            const data = await res.json();
            setPushResult({ version: data.version });
            setStatus(s => s ? { ...s, version: data.version, deployedAt: data.deployedAt } : null);
            setTimeout(() => setPushResult(null), 4000);
        }
        finally {
            setPushing(false);
        }
    };
    const formatDate = (iso) => {
        if (!iso)
            return '—';
        try {
            return new Date(iso).toLocaleString();
        }
        catch {
            return iso;
        }
    };
    return (_jsxs("div", { style: { maxWidth: '720px' }, children: [_jsxs("div", { style: { marginBottom: '1.75rem' }, children: [_jsx("h2", { style: { margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }, children: "Widget Studio" }), _jsx("p", { style: { margin: 0, fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)' }, children: "Manage the DAEDALUS embed widget \u2014 push version updates to all deployed clients." })] }), _jsxs("div", { style: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }, children: [_jsx("div", { style: { fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.3)', marginBottom: '1.25rem' }, children: "Current State" }), !status ? (_jsx("div", { style: { color: 'rgba(248,250,252,0.3)', fontSize: '0.85rem' }, children: "Loading\u2026" })) : (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.35)', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }, children: "Version" }), _jsxs("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: ACCENT, fontFamily: 'monospace' }, children: ["v", status.version] })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.35)', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }, children: "Active Clients" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }, children: status.activeClients })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.35)', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }, children: "Last Deployed" }), _jsx("div", { style: { fontSize: '0.78rem', color: 'rgba(248,250,252,0.55)' }, children: formatDate(status.deployedAt) })] })] }))] }), _jsxs("div", { style: { background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }, children: [_jsx("div", { style: { fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', lineHeight: 1.6, marginBottom: '0.75rem' }, children: "Pushing an update bumps the patch version. All deployed embed widgets will load the new version on their next page load \u2014 no client action required." }), _jsxs("div", { style: { fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.2)' }, children: ["Snippet URL: ", _jsx("span", { style: { color: ACCENT }, children: "ajrcentralcommand.com/operations/daedalus/embed.js" })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("button", { onClick: pushUpdate, disabled: pushing || !status, style: { background: pushing ? '#1a2a2a' : ACCENT, border: 'none', borderRadius: '8px', color: pushing ? 'rgba(248,250,252,0.3)' : '#0a0a0a', cursor: pushing || !status ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: '0.65rem 1.75rem', transition: 'all 0.15s', letterSpacing: '0.03em' }, children: pushing ? 'Pushing…' : 'Push Update to All Clients' }), pushResult && (_jsxs("span", { style: { color: '#22c55e', fontSize: '0.78rem' }, children: ["\u2713 Updated to v", pushResult.version] }))] })] }));
}
