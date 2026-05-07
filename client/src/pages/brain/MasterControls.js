import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const ACCENT = '#22d3ee';
export default function MasterControls() {
    const [settings, setSettings] = useState({ system_prompt: '', persona_name: 'Assistant', agentic_mode: 'manual' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        fetch('/api/brain/settings')
            .then(r => r.json())
            .then((data) => { setSettings(data); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, []);
    const save = async () => {
        setSaving(true);
        try {
            await fetch('/api/brain/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
        finally {
            setSaving(false);
        }
    };
    if (!loaded)
        return _jsx("div", { style: { color: 'rgba(248,250,252,0.3)', fontSize: '0.85rem' }, children: "Loading\u2026" });
    const field = { label: { fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.4)', display: 'block', marginBottom: '0.5rem' } };
    const inputBase = { background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f8fafc', fontSize: '0.875rem', padding: '0.65rem 0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
    return (_jsxs("div", { style: { maxWidth: '720px' }, children: [_jsxs("div", { style: { marginBottom: '1.75rem' }, children: [_jsx("h2", { style: { margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }, children: "Master Controls" }), _jsx("p", { style: { margin: 0, fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)' }, children: "Set the global system prompt and persona for all BRAIN interactions." })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: field.label, children: "Persona Name" }), _jsx("input", { type: "text", value: settings.persona_name, onChange: e => setSettings(s => ({ ...s, persona_name: e.target.value })), placeholder: "e.g. Assistant, BRAIN, Jay's AI", style: inputBase }), _jsx("p", { style: { margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'rgba(248,250,252,0.25)' }, children: "How the AI refers to itself in conversations." })] }), _jsxs("div", { children: [_jsx("label", { style: field.label, children: "System Prompt" }), _jsx("textarea", { value: settings.system_prompt, onChange: e => setSettings(s => ({ ...s, system_prompt: e.target.value })), placeholder: "You are a helpful assistant. You are direct, concise, and technically precise...", rows: 10, style: { ...inputBase, resize: 'vertical', lineHeight: 1.6, minHeight: '180px' } }), _jsxs("p", { style: { margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'rgba(248,250,252,0.25)' }, children: ["Applied as the system context for all BRAIN chatbox conversations.", settings.system_prompt.length > 0 && ` ${settings.system_prompt.length} characters.`] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("button", { onClick: save, disabled: saving, style: { background: saving ? '#1a2a2a' : ACCENT, border: 'none', borderRadius: '8px', color: saving ? 'rgba(248,250,252,0.3)' : '#0a0a0a', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: '0.6rem 1.75rem', transition: 'all 0.15s', letterSpacing: '0.03em' }, children: saving ? 'Saving…' : 'Save Changes' }), saved && (_jsx("span", { style: { color: '#22c55e', fontSize: '0.78rem' }, children: "\u2713 Saved" }))] })] })] }));
}
