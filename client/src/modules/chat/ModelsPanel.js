import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const NAVY = '#1c2866';
const PROVIDER_KEY = 'chat_provider';
export function getStoredProvider() {
    return localStorage.getItem(PROVIDER_KEY) || 'claude';
}
export function setStoredProvider(p) {
    localStorage.setItem(PROVIDER_KEY, p);
    window.dispatchEvent(new CustomEvent('chat-provider-change', { detail: p }));
}
const PROVIDERS = [
    {
        id: 'claude',
        label: 'Claude',
        vendor: 'Anthropic',
        model: 'Haiku 4.5',
        modelFull: 'claude-haiku-4-5-20251001',
        color: '#D97706',
        description: 'Fast and efficient. Great for everyday tasks, writing, and nuanced instruction following.',
        logo: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { cx: "12", cy: "12", r: "10", fill: "#D97706", opacity: "0.15" }), _jsx("text", { x: "12", y: "16", textAnchor: "middle", fontSize: "11", fontWeight: "800", fill: "#D97706", children: "C" })] })),
    },
    {
        id: 'gpt',
        label: 'GPT',
        vendor: 'OpenAI',
        model: 'GPT-4o mini',
        modelFull: 'gpt-4o-mini',
        color: '#16A34A',
        description: 'OpenAI\'s lightweight model. Strong reasoning, broad knowledge, reliable instruction following.',
        logo: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { cx: "12", cy: "12", r: "10", fill: "#16A34A", opacity: "0.15" }), _jsx("text", { x: "12", y: "16", textAnchor: "middle", fontSize: "11", fontWeight: "800", fill: "#16A34A", children: "G" })] })),
    },
    {
        id: 'gemini',
        label: 'Gemini',
        vendor: 'Google',
        model: '2.0 Flash',
        modelFull: 'gemini-2.0-flash',
        color: '#2563EB',
        description: 'Google\'s multimodal model. Handles text and images with low latency and strong reasoning.',
        logo: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { cx: "12", cy: "12", r: "10", fill: "#2563EB", opacity: "0.15" }), _jsx("text", { x: "12", y: "16", textAnchor: "middle", fontSize: "11", fontWeight: "800", fill: "#2563EB", children: "G" })] })),
    },
    {
        id: 'grok',
        label: 'Grok',
        vendor: 'xAI',
        model: 'Grok-3 Mini',
        modelFull: 'grok-3-mini',
        color: '#7C3AED',
        description: 'xAI\'s fast reasoning model. Direct, efficient responses with strong logical depth.',
        logo: (_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { cx: "12", cy: "12", r: "10", fill: "#7C3AED", opacity: "0.15" }), _jsx("text", { x: "12", y: "16", textAnchor: "middle", fontSize: "11", fontWeight: "800", fill: "#7C3AED", children: "X" })] })),
    },
];
export default function ModelsPanel() {
    const [selected, setSelected] = useState(getStoredProvider);
    const [keys, setKeys] = useState({ claude: false, gpt: false, gemini: false, grok: false });
    const [keysLoaded, setKeysLoaded] = useState(false);
    useEffect(() => {
        fetch('/api/apikeys')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
            if (d)
                setKeys({ claude: !!d.anthropic, gpt: !!d.openai, gemini: !!d.gemini, grok: !!d.grok });
        })
            .finally(() => setKeysLoaded(true));
    }, []);
    // Stay in sync if chat panel changes the provider
    useEffect(() => {
        const handler = (e) => {
            setSelected(e.detail);
        };
        window.addEventListener('chat-provider-change', handler);
        return () => window.removeEventListener('chat-provider-change', handler);
    }, []);
    const select = (p) => {
        setSelected(p);
        setStoredProvider(p);
    };
    return (_jsxs("div", { style: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 700, color: '#111' }, children: "Models" }), _jsxs("p", { style: { margin: 0, fontSize: '0.85rem', color: '#6b7280' }, children: ["Select the AI model used in the chat panel. Add API keys in ", _jsx("strong", { children: "API Assist" }), " to activate a provider."] })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }, children: PROVIDERS.map(p => {
                    const active = selected === p.id;
                    const hasKey = keys[p.id];
                    return (_jsxs("button", { onClick: () => select(p.id), style: {
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            padding: '1.1rem 1.1rem 1rem',
                            background: active ? `${NAVY}06` : '#fff',
                            border: `2px solid ${active ? NAVY : '#e5e7eb'}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border-color 0.15s, background 0.15s',
                            position: 'relative',
                        }, onMouseEnter: e => { if (!active)
                            e.currentTarget.style.borderColor = '#d1d5db'; }, onMouseLeave: e => { if (!active)
                            e.currentTarget.style.borderColor = '#e5e7eb'; }, children: [active && (_jsx("div", { style: {
                                    position: 'absolute', top: 10, right: 10,
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }, children: _jsx("svg", { width: "11", height: "11", viewBox: "0 0 12 12", fill: "none", children: _jsx("polyline", { points: "2,6 5,9 10,3", stroke: "#fff", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }) })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.6rem' }, children: [_jsx("div", { style: {
                                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                            background: `${p.color}18`,
                                            border: `1px solid ${p.color}33`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }, children: _jsx("span", { style: { fontSize: '1rem', fontWeight: 900, color: p.color }, children: p.label[0] }) }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.92rem', fontWeight: 700, color: active ? NAVY : '#111', lineHeight: 1.2 }, children: p.label }), _jsx("div", { style: { fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.2 }, children: p.vendor })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("span", { style: {
                                            padding: '2px 8px',
                                            background: `${p.color}14`,
                                            border: `1px solid ${p.color}28`,
                                            borderRadius: 20,
                                            fontSize: '0.68rem', fontWeight: 700,
                                            color: p.color, letterSpacing: '0.02em',
                                            whiteSpace: 'nowrap',
                                        }, children: p.model }), keysLoaded && (_jsx("span", { style: {
                                            fontSize: '0.65rem', fontWeight: 600,
                                            color: hasKey ? '#16a34a' : '#9ca3af',
                                            display: 'flex', alignItems: 'center', gap: '3px',
                                        }, children: hasKey
                                            ? _jsxs(_Fragment, { children: [_jsxs("svg", { width: "10", height: "10", viewBox: "0 0 12 12", fill: "none", children: [_jsx("circle", { cx: "6", cy: "6", r: "5", fill: "#16a34a", opacity: "0.2" }), _jsx("polyline", { points: "2.5,6 5,8.5 9.5,3.5", stroke: "#16a34a", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" })] }), " Key set"] })
                                            : _jsxs(_Fragment, { children: [_jsx("svg", { width: "10", height: "10", viewBox: "0 0 12 12", fill: "none", children: _jsx("circle", { cx: "6", cy: "6", r: "5", stroke: "#9ca3af", strokeWidth: "1.2" }) }), " No key"] }) }))] }), _jsx("p", { style: { margin: 0, fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }, children: p.description }), _jsx("div", { style: { fontSize: '0.62rem', color: '#d1d5db', fontFamily: 'monospace', letterSpacing: '0.02em' }, children: p.modelFull })] }, p.id));
                }) }), _jsxs("div", { style: {
                    padding: '0.85rem 1rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5,
                }, children: [_jsx("strong", { style: { color: '#374151' }, children: "Active model:" }), ' ', PROVIDERS.find(p => p.id === selected)?.label, " \u2014 ", PROVIDERS.find(p => p.id === selected)?.modelFull, !keys[selected] && keysLoaded && (_jsx("span", { style: { color: '#f59e0b', marginLeft: '0.5rem' }, children: "\u00B7 No API key \u2014 add one in API Assist to use this model." }))] })] }));
}
