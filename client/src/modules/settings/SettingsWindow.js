import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import SecurityPanel from './SecurityPanel';
import BehaviorPanel from '../chat/BehaviorPanel';
import ModelsPanel from '../chat/ModelsPanel';
const NAVY = '#1c2866';
const GOLD = '#c9a840';
const METALLIC_GOLD_V = 'linear-gradient(180deg, #5c3d08 0%, #b8860b 20%, #f0d060 45%, #fffacd 55%, #f0d060 70%, #b8860b 85%, #5c3d08 100%)';
const SECTIONS = [
    {
        id: 'security',
        label: 'Security',
        icon: (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) })),
    },
    {
        id: 'chat',
        label: 'Chat Settings',
        icon: (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) })),
    },
];
const CHAT_SUB_SECTIONS = [
    {
        id: 'models',
        label: 'Models',
        icon: (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" })] })),
    },
    {
        id: 'behavior',
        label: 'Behavior',
        icon: (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "20", x2: "18", y2: "10" }), _jsx("line", { x1: "12", y1: "20", x2: "12", y2: "4" }), _jsx("line", { x1: "6", y1: "20", x2: "6", y2: "14" })] })),
    },
];
const SA_PROVIDER_LABELS = { gpt: 'GPT-4o mini', claude: 'Claude Haiku', gemini: 'Gemini Flash' };
const SA_PROVIDER_IDS = { gpt: 'gpt', claude: 'claude', gemini: 'gemini' };
function SettingsChat({ pendingQuestion, onClear, pendingDrill, onClearDrill }) {
    const [expanded, setExpanded] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState('gpt');
    const [activeDrill, setActiveDrill] = useState(null);
    const endRef = useRef(null);
    const callLLM = async (content) => {
        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: SA_PROVIDER_IDS[provider], content }),
            });
            const data = await res.json();
            return res.ok ? data.reply : (data.error || 'Something went wrong.');
        }
        catch {
            return 'Connection error.';
        }
    };
    const sendMessage = async (text) => {
        setMessages(m => [...m, { role: 'user', text }]);
        setLoading(true);
        const reply = await callLLM(text);
        setMessages(m => [...m, { role: 'assistant', text: reply }]);
        setLoading(false);
    };
    const runDrill = async (drill, question) => {
        setMessages(m => [...m, { role: 'user', text: question }]);
        setLoading(true);
        const lowPrompt = `You are a settings assistant demonstrating behavior extremes. Respond to the following question while SPECIFICALLY embodying the "${drill.channelLabel}" setting at its LOWEST extreme ("${drill.lowLabel}"). Keep your response clearly in that style so the user can see the difference.\n\nQuestion: ${question}`;
        const highPrompt = `You are a settings assistant demonstrating behavior extremes. Respond to the following question while SPECIFICALLY embodying the "${drill.channelLabel}" setting at its HIGHEST extreme ("${drill.highLabel}"). Keep your response clearly in that style so the user can see the difference.\n\nQuestion: ${question}`;
        const [lowReply, highReply] = await Promise.all([callLLM(lowPrompt), callLLM(highPrompt)]);
        setMessages(m => [
            ...m,
            { role: 'assistant', text: lowReply, drillLabel: `LOW — ${drill.lowLabel}`, drillColor: drill.color },
            { role: 'assistant', text: highReply, drillLabel: `HIGH — ${drill.highLabel}`, drillColor: drill.color },
        ]);
        setLoading(false);
        setActiveDrill(null);
    };
    useEffect(() => {
        if (pendingQuestion) {
            setExpanded(true);
            sendMessage(pendingQuestion);
            onClear();
        }
    }, [pendingQuestion]);
    useEffect(() => {
        if (pendingDrill) {
            setExpanded(true);
            setActiveDrill(pendingDrill);
            onClearDrill();
        }
    }, [pendingDrill]);
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);
    const send = () => {
        if (!input.trim() || loading)
            return;
        const text = input.trim();
        setInput('');
        if (activeDrill) {
            runDrill(activeDrill, text);
        }
        else {
            sendMessage(text);
        }
    };
    return (_jsxs("div", { style: {
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: expanded ? 332 : 48,
            background: '#fff',
            borderTop: `2px solid ${NAVY}22`,
            transition: 'height 0.2s ease',
            display: 'flex', flexDirection: 'column',
            zIndex: 20,
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: {
                    height: 48, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 10px 0 12px',
                    background: expanded ? NAVY : '#f9fafb',
                    transition: 'background 0.2s',
                }, children: [_jsxs("div", { onClick: () => setExpanded(e => !e), style: { display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', flex: 1 }, children: [_jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: expanded ? '#c9a840' : NAVY, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }), _jsx("span", { style: { fontSize: '0.7rem', fontWeight: 700, color: expanded ? '#c9a840' : NAVY, letterSpacing: '0.06em', textTransform: 'uppercase' }, children: "Settings Assistant" }), activeDrill && (_jsxs("span", { style: { fontSize: '0.62rem', fontWeight: 700, color: activeDrill.color, background: `${activeDrill.color}22`, padding: '1px 6px', borderRadius: 4 }, children: ["DRILL: ", activeDrill.channelLabel] })), !activeDrill && messages.length > 0 && !expanded && (_jsxs("span", { style: { fontSize: '0.62rem', color: '#9ca3af', fontWeight: 500 }, children: ["\u00B7 ", messages.length, " msg", messages.length !== 1 ? 's' : ''] }))] }), _jsx("select", { value: provider, onChange: e => setProvider(e.target.value), onClick: e => e.stopPropagation(), style: {
                            fontSize: '0.62rem', fontWeight: 600,
                            background: expanded ? 'rgba(255,255,255,0.12)' : '#f0f0f0',
                            border: expanded ? '1px solid rgba(201,168,64,0.4)' : '1px solid #ddd',
                            borderRadius: 5,
                            color: expanded ? GOLD : '#555',
                            padding: '2px 5px',
                            cursor: 'pointer',
                            outline: 'none',
                            marginRight: '6px',
                        }, children: Object.keys(SA_PROVIDER_LABELS).map(k => (_jsx("option", { value: k, children: SA_PROVIDER_LABELS[k] }, k))) }), _jsx("span", { onClick: () => setExpanded(e => !e), style: { fontSize: '0.65rem', color: expanded ? '#c9a84088' : '#9ca3af', cursor: 'pointer' }, children: expanded ? '▾' : '▴' })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#fafafa' }, children: [activeDrill && messages.length === 0 && !loading && (_jsxs("div", { style: { padding: '8px 10px', background: `${activeDrill.color}12`, border: `1px solid ${activeDrill.color}33`, borderRadius: 8, fontSize: '0.73rem', color: '#444', lineHeight: 1.5 }, children: [_jsxs("strong", { style: { color: activeDrill.color }, children: ["Drill: ", activeDrill.channelLabel] }), _jsx("br", {}), "Type a test question below \u2014 you'll see two responses: one at ", _jsx("em", { children: activeDrill.lowLabel }), " (low) and one at ", _jsx("em", { children: activeDrill.highLabel }), " (high)."] })), messages.length === 0 && !loading && !activeDrill && (_jsxs("p", { style: { margin: '0 auto', fontSize: '0.73rem', color: '#ccc', paddingTop: '12px', textAlign: 'center' }, children: ["Click \u24D8 on any behavior channel, then hit ", _jsx("strong", { children: "More \u2192" }), " or ", _jsx("strong", { children: "Example" })] })), messages.map((m, i) => (_jsx("div", { children: m.drillLabel ? (_jsxs("div", { style: { border: `1px solid ${m.drillColor}44`, borderTop: `3px solid ${m.drillColor}`, borderRadius: 8, overflow: 'hidden', marginBottom: 2 }, children: [_jsx("div", { style: { padding: '3px 8px', background: `${m.drillColor}18`, fontSize: '0.6rem', fontWeight: 800, color: m.drillColor, letterSpacing: '0.08em', textTransform: 'uppercase' }, children: m.drillLabel }), _jsx("div", { style: { padding: '0.4rem 0.7rem', fontSize: '0.75rem', lineHeight: 1.5, color: '#1a1a1a', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fff' }, children: m.text })] })) : (_jsxs("div", { style: { display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: '6px', alignItems: 'flex-start' }, children: [_jsx("div", { style: { width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: m.role === 'user' ? NAVY : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: m.role === 'user' ? '#fff' : '#666' }, children: m.role === 'user' ? 'J' : 'A' }), _jsx("div", { style: { maxWidth: '82%', padding: '0.35rem 0.6rem', background: m.role === 'user' ? NAVY : '#fff', color: m.role === 'user' ? '#fff' : '#1a1a1a', borderRadius: m.role === 'user' ? '10px 3px 10px 10px' : '3px 10px 10px 10px', fontSize: '0.75rem', lineHeight: 1.5, border: m.role === 'assistant' ? '1px solid #e5e7eb' : 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: m.text })] })) }, i))), loading && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx("div", { style: { width: 20, height: 20, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#666', fontWeight: 800, flexShrink: 0 }, children: "A" }), _jsx("div", { style: { padding: '0.4rem 0.65rem', background: '#f0f0f0', borderRadius: '3px 10px 10px 10px', display: 'flex', gap: 4, alignItems: 'center' }, children: [0, 1, 2].map(i => (_jsx("div", { style: { width: 4, height: 4, borderRadius: '50%', background: '#bbb', animation: `bounce 1.2s ${i * 0.2}s infinite` } }, i))) })] })), _jsx("div", { ref: endRef })] }), _jsxs("div", { style: { flexShrink: 0, padding: '6px 10px 10px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '6px', background: '#fff' }, children: [_jsx("input", { value: input, onChange: e => setInput(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        } }, placeholder: activeDrill ? `Enter a test question for ${activeDrill.channelLabel}…` : 'Ask about any setting…', style: { flex: 1, padding: '4px 8px', border: `1px solid ${activeDrill ? activeDrill.color + '66' : '#e5e7eb'}`, borderRadius: 6, fontSize: '0.75rem', outline: 'none', fontFamily: 'inherit' } }), _jsx("button", { onClick: send, disabled: loading || !input.trim(), style: { padding: '4px 10px', background: loading || !input.trim() ? '#e5e7eb' : NAVY, color: loading || !input.trim() ? '#9ca3af' : '#fff', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }, children: "\u2191" })] })] }));
}
function ChatSettingsPanel() {
    const [sub, setSub] = useState('models');
    const [pendingQuestion, setPendingQuestion] = useState(null);
    const [pendingDrill, setPendingDrill] = useState(null);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }, children: [_jsx("div", { style: {
                    height: '40px', flexShrink: 0,
                    display: 'flex', alignItems: 'stretch',
                    background: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '0 1rem',
                    gap: '2px',
                }, children: CHAT_SUB_SECTIONS.map(s => {
                    const active = sub === s.id;
                    return (_jsxs("button", { onClick: () => setSub(s.id), style: {
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '0 12px',
                            background: 'none', border: 'none',
                            borderBottom: active ? `2px solid ${NAVY}` : '2px solid transparent',
                            color: active ? NAVY : '#888',
                            fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'color 0.15s, border-color 0.15s',
                        }, onMouseEnter: e => { if (!active)
                            e.currentTarget.style.color = '#444'; }, onMouseLeave: e => { if (!active)
                            e.currentTarget.style.color = '#888'; }, children: [_jsx("span", { style: { display: 'flex' }, children: s.icon }), s.label] }, s.id));
                }) }), _jsxs("div", { style: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }, children: [sub === 'models' && (_jsx("div", { style: { flex: 1, overflowY: 'auto', background: '#f4f5f7' }, children: _jsx(ModelsPanel, {}) })), sub === 'behavior' && (_jsx(BehaviorPanel, { onAskChatbot: setPendingQuestion, onStartDrill: setPendingDrill }))] }), _jsx(SettingsChat, { pendingQuestion: pendingQuestion, onClear: () => setPendingQuestion(null), pendingDrill: pendingDrill, onClearDrill: () => setPendingDrill(null) })] }));
}
export default function SettingsWindow({ section, onChangeSection, onClose, onLogout }) {
    return (_jsx("div", { style: {
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }, onClick: e => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { style: {
                width: '860px', maxWidth: '96vw',
                height: '720px', maxHeight: '92vh',
                background: '#f4f5f7',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
                border: '1px solid rgba(201,168,64,0.25)',
            }, children: [_jsxs("div", { style: {
                        width: '210px',
                        flexShrink: 0,
                        background: NAVY,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                    }, children: [_jsx("div", { style: { position: 'absolute', inset: 0, backgroundImage: "url('/uploads/raven.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08, zIndex: 0 } }), _jsx("div", { style: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '3px', background: METALLIC_GOLD_V, zIndex: 2 } }), _jsx("div", { style: { position: 'relative', zIndex: 1, padding: '1.25rem 1rem 0.75rem' }, children: _jsx("span", { style: {
                                    fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
                                    textTransform: 'uppercase', color: `${GOLD}99`,
                                }, children: "Settings" }) }), _jsx("nav", { style: { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '0.25rem 0' }, children: SECTIONS.map(s => {
                                const active = section === s.id;
                                return (_jsxs("button", { onClick: () => onChangeSection(s.id), style: {
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: active ? 'rgba(201,168,64,0.16)' : 'transparent',
                                        border: 'none',
                                        borderLeft: active ? `3px solid ${GOLD}` : '3px solid transparent',
                                        color: active ? GOLD : 'rgba(255,255,255,0.75)',
                                        cursor: 'pointer', fontSize: '0.9rem',
                                        fontWeight: active ? 700 : 400,
                                        width: '100%', textAlign: 'left',
                                        transition: 'background 0.15s, color 0.15s',
                                        whiteSpace: 'nowrap',
                                    }, onMouseEnter: e => { if (!active)
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }, onMouseLeave: e => { if (!active)
                                        e.currentTarget.style.background = 'transparent'; }, children: [_jsx("span", { style: { flexShrink: 0, display: 'flex' }, children: s.icon }), _jsx("span", { children: s.label })] }, s.id));
                            }) })] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsxs("div", { style: {
                                height: '52px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0 1.25rem',
                                background: '#fff',
                                borderBottom: '1px solid #e5e7eb',
                            }, children: [_jsx("span", { style: { fontSize: '0.85rem', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: SECTIONS.find(s => s.id === section)?.label }), _jsx("button", { onClick: onClose, style: {
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#aaa', padding: '4px', borderRadius: '6px',
                                        display: 'flex', alignItems: 'center',
                                    }, onMouseEnter: e => e.currentTarget.style.color = '#333', onMouseLeave: e => e.currentTarget.style.color = '#aaa', title: "Close", children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) })] }), _jsxs("div", { style: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }, children: [section === 'security' && (_jsx("div", { style: { flex: 1, overflowY: 'auto', background: '#f4f5f7' }, children: _jsx(SecurityPanel, { onLogout: onLogout }) })), section === 'chat' && _jsx(ChatSettingsPanel, {})] })] })] }) }));
}
