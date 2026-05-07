import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const NAVY = '#1c2866';
const GOLD = '#c9a840';
const DEFAULTS = {
    promptStrictness: 50,
    creativity: 50,
    initiative: 50,
    contextUse: 50,
    formatDiscipline: 50,
    repetitionControl: 50,
    toolUsePermission: 50,
    safetyLevel: 50,
    brevity: 50,
};
const CHANNELS = [
    {
        id: 'promptStrictness',
        short: 'STRICT',
        label: 'Prompt Strictness',
        lowLabel: 'Interpretive',
        highLabel: 'Literal',
        color: '#4a9eff',
        tooltip: 'Low: model may reframe, expand, or "help" beyond your exact request. High: model stays tightly bound to your wording and avoids changing intent.',
    },
    {
        id: 'creativity',
        short: 'CRTVTY',
        label: 'Creativity',
        lowLabel: 'Deterministic',
        highLabel: 'Novel',
        color: '#a855f7',
        tooltip: 'Low: stable, predictable, conventional responses. High: more novelty, wider phrasing variation, and more speculative output.',
    },
    {
        id: 'initiative',
        short: 'INIT',
        label: 'Initiative',
        lowLabel: 'Reactive',
        highLabel: 'Proactive',
        color: '#22c55e',
        tooltip: 'Low: answer only what was asked. High: infer missing pieces, suggest next steps, and expand without being explicitly prompted.',
    },
    {
        id: 'contextUse',
        short: 'CONTEXT',
        label: 'Context Use',
        lowLabel: 'Current Only',
        highLabel: 'Full History',
        color: '#f59e0b',
        tooltip: 'Low: prioritize the current message only. High: heavily factor in conversation history, memory, and continuity.',
    },
    {
        id: 'formatDiscipline',
        short: 'FORMAT',
        label: 'Format Discipline',
        lowLabel: 'Freeform',
        highLabel: 'Rigid',
        color: '#06b6d4',
        tooltip: 'Low: natural freeform responses. High: strict adherence to requested layouts, schemas, templates, or exact formatting.',
    },
    {
        id: 'repetitionControl',
        short: 'REPET',
        label: 'Repetition Control',
        lowLabel: 'Stable',
        highLabel: 'High Variation',
        color: '#ec4899',
        tooltip: 'Low: allows repeated structure and familiar phrasing. High: pushes for novelty and discourages reused wording.',
    },
    {
        id: 'toolUsePermission',
        short: 'TOOLS',
        label: 'Tool Use',
        lowLabel: 'Text Only',
        highLabel: 'Autonomous',
        color: '#84cc16',
        tooltip: 'Low: stay text-only. High: actively use connected tools — browsing, retrieval, scheduling, and actions when available.',
    },
    {
        id: 'safetyLevel',
        short: 'CAUTION',
        label: 'Safety / Caution',
        lowLabel: 'Assertive',
        highLabel: 'Conservative',
        color: '#f97316',
        tooltip: 'Low: more assertive answers and confident inference. High: increased restraint, qualification, and refusal of weakly supported claims.',
    },
    {
        id: 'brevity',
        short: 'BREVITY',
        label: 'Brevity',
        lowLabel: 'Verbose',
        highLabel: 'Concise',
        color: '#e879f9',
        tooltip: 'Low: full, detailed responses with elaboration and context. High: short, direct answers — minimum words to fully address the request.',
    },
];
const BUILTIN_PRESETS = [
    {
        name: 'Balanced',
        values: { promptStrictness: 50, creativity: 50, initiative: 50, contextUse: 50, formatDiscipline: 50, repetitionControl: 50, toolUsePermission: 50, safetyLevel: 50, brevity: 50 },
        builtin: true,
    },
    {
        name: 'Focused',
        values: { promptStrictness: 80, creativity: 20, initiative: 20, contextUse: 40, formatDiscipline: 80, repetitionControl: 25, toolUsePermission: 15, safetyLevel: 65, brevity: 75 },
        builtin: true,
    },
    {
        name: 'Creative',
        values: { promptStrictness: 20, creativity: 90, initiative: 65, contextUse: 50, formatDiscipline: 15, repetitionControl: 85, toolUsePermission: 35, safetyLevel: 25, brevity: 30 },
        builtin: true,
    },
    {
        name: 'Full Assistant',
        values: { promptStrictness: 45, creativity: 55, initiative: 88, contextUse: 88, formatDiscipline: 60, repetitionControl: 50, toolUsePermission: 90, safetyLevel: 40, brevity: 40 },
        builtin: true,
    },
];
function loadValues() {
    try {
        const r = localStorage.getItem('bhvr_values');
        return r ? { ...DEFAULTS, ...JSON.parse(r) } : { ...DEFAULTS };
    }
    catch {
        return { ...DEFAULTS };
    }
}
function saveValues(v) { localStorage.setItem('bhvr_values', JSON.stringify(v)); }
function loadUserPresets() {
    try {
        const r = localStorage.getItem('bhvr_presets');
        return r ? JSON.parse(r) : [];
    }
    catch {
        return [];
    }
}
function saveUserPresets(p) { localStorage.setItem('bhvr_presets', JSON.stringify(p)); }
export default function BehaviorPanel({ onAskChatbot, onStartDrill }) {
    const [values, setValues] = useState(loadValues);
    const [userPresets, setUserPresets] = useState(loadUserPresets);
    const [activePreset, setActivePreset] = useState(null);
    const [savingPreset, setSavingPreset] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [openInfo, setOpenInfo] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const allPresets = [...BUILTIN_PRESETS, ...userPresets];
    const commitEdit = (id) => {
        const n = Math.min(100, Math.max(0, parseInt(editingText, 10)));
        if (!isNaN(n))
            setVal(id, n);
        setEditingId(null);
    };
    const setVal = (id, n) => {
        const next = { ...values, [id]: n };
        setValues(next);
        saveValues(next);
        setActivePreset(null);
    };
    const applyPreset = (p) => {
        setValues({ ...p.values });
        saveValues(p.values);
        setActivePreset(p.name);
    };
    const reset = () => { setValues({ ...DEFAULTS }); saveValues(DEFAULTS); setActivePreset(null); };
    const confirmSave = () => {
        if (!presetName.trim())
            return;
        const p = { name: presetName.trim(), values: { ...values } };
        const updated = [...userPresets.filter(x => x.name !== p.name), p];
        setUserPresets(updated);
        saveUserPresets(updated);
        setActivePreset(p.name);
        setPresetName('');
        setSavingPreset(false);
    };
    const deletePreset = (name) => {
        const updated = userPresets.filter(x => x.name !== name);
        setUserPresets(updated);
        saveUserPresets(updated);
        if (activePreset === name)
            setActivePreset(null);
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d0d', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }, children: [_jsxs("div", { style: { flex: '0 0 300px', overflowX: 'auto', overflowY: 'hidden', display: 'flex', alignItems: 'flex-start', padding: '14px 18px 0', gap: '5px', position: 'relative' }, children: [openInfo && (() => {
                        const ch = CHANNELS.find(c => c.id === openInfo);
                        return (_jsx("div", { style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }, onClick: () => setOpenInfo(null), children: _jsxs("div", { style: { width: 268, background: '#1a1a1a', border: `1px solid ${ch.color}44`, borderTop: `3px solid ${ch.color}`, borderRadius: 10, padding: '1.1rem', position: 'relative', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }, onClick: e => e.stopPropagation(), children: [_jsx("button", { onClick: () => setOpenInfo(null), style: { position: 'absolute', top: 8, right: 9, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '17px', lineHeight: 1, padding: '0 3px' }, onMouseEnter: e => e.currentTarget.style.color = '#aaa', onMouseLeave: e => e.currentTarget.style.color = '#555', children: "\u00D7" }), _jsx("div", { style: { fontSize: '0.68rem', fontWeight: 900, color: ch.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.55rem' }, children: ch.label }), _jsx("p", { style: { margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#bbb', lineHeight: 1.55 }, children: ch.tooltip }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.63rem', color: '#555', padding: '0.4rem 0', borderTop: '1px solid #252525', borderBottom: '1px solid #252525', marginBottom: '0.9rem' }, children: [_jsxs("span", { children: ["\u2B07 Low: ", _jsx("span", { style: { color: '#888' }, children: ch.lowLabel })] }), _jsxs("span", { children: ["High: ", _jsx("span", { style: { color: '#888' }, children: ch.highLabel }), " \u2B06"] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }, children: [_jsx("button", { onClick: () => {
                                                    onStartDrill({ channelLabel: ch.label, lowLabel: ch.lowLabel, highLabel: ch.highLabel, color: ch.color });
                                                    setOpenInfo(null);
                                                }, style: { padding: '0.38rem 0.9rem', background: 'none', border: `1px solid ${ch.color}66`, borderRadius: 6, color: ch.color, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }, onMouseEnter: e => { e.currentTarget.style.background = `${ch.color}18`; }, onMouseLeave: e => { e.currentTarget.style.background = 'none'; }, children: "Example" }), _jsx("button", { onClick: () => {
                                                    onAskChatbot(`Explain the "${ch.label}" behavior setting in detail. What does it control, what are the practical effects at low vs high values, and give me concrete examples of when I'd want to adjust it?`);
                                                    setOpenInfo(null);
                                                }, style: { padding: '0.38rem 0.9rem', background: ch.color, border: 'none', borderRadius: 6, color: '#000', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em' }, onMouseEnter: e => e.currentTarget.style.opacity = '0.85', onMouseLeave: e => e.currentTarget.style.opacity = '1', children: "More \u2192" })] })] }) }));
                    })(), CHANNELS.map(ch => {
                        const val = values[ch.id];
                        return (_jsxs("div", { style: {
                                width: '82px', flexShrink: 0,
                                background: '#181818',
                                border: '1px solid #2a2a2a',
                                borderTop: `3px solid ${ch.color}`,
                                borderRadius: '6px 6px 0 0',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                padding: '10px 5px 10px',
                                position: 'relative',
                                userSelect: 'none',
                            }, children: [_jsx("button", { onClick: e => { e.stopPropagation(); setOpenInfo(openInfo === ch.id ? null : ch.id); }, title: "What does this do?", style: {
                                        position: 'absolute', top: 6, right: 5,
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '11px', color: openInfo === ch.id ? ch.color : '#444',
                                        lineHeight: 1, padding: '2px 3px',
                                        transition: 'color 0.15s',
                                    }, onMouseEnter: e => e.currentTarget.style.color = ch.color, onMouseLeave: e => { if (openInfo !== ch.id)
                                        e.currentTarget.style.color = '#444'; }, children: "\u24D8" }), _jsx("span", { style: { fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.12em', color: ch.color, textTransform: 'uppercase', marginBottom: '7px', textAlign: 'center' }, children: ch.short }), _jsx("span", { style: { fontSize: '0.58rem', color: '#bbb', marginBottom: '4px', textAlign: 'center', lineHeight: 1.2 }, children: ch.highLabel }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', height: '152px' }, children: [_jsx("div", { style: { width: '5px', height: '152px', background: '#222', borderRadius: '3px', position: 'relative', overflow: 'hidden', flexShrink: 0 }, children: _jsx("div", { style: {
                                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                                    height: `${val}%`,
                                                    background: `linear-gradient(to top, ${ch.color}55 0%, ${ch.color} 100%)`,
                                                    transition: 'height 0.05s',
                                                    borderRadius: '3px',
                                                } }) }), _jsx("input", { type: "range", min: 0, max: 100, value: val, onChange: e => setVal(ch.id, Number(e.target.value)), style: {
                                                writingMode: 'vertical-lr',
                                                direction: 'rtl',
                                                width: '30px',
                                                height: '152px',
                                                cursor: 'pointer',
                                                accentColor: ch.color,
                                                background: 'transparent',
                                                margin: 0,
                                                padding: 0,
                                            } })] }), _jsx("span", { style: { fontSize: '0.58rem', color: '#bbb', marginTop: '4px', textAlign: 'center', lineHeight: 1.2 }, children: ch.lowLabel }), editingId === ch.id ? (_jsx("input", { autoFocus: true, type: "number", min: 0, max: 100, value: editingText, onChange: e => setEditingText(e.target.value), onBlur: () => commitEdit(ch.id), onKeyDown: e => { if (e.key === 'Enter')
                                        commitEdit(ch.id); if (e.key === 'Escape')
                                        setEditingId(null); }, style: {
                                        marginTop: '8px',
                                        width: '44px', textAlign: 'center',
                                        background: '#111',
                                        border: `1px solid ${ch.color}88`,
                                        borderRadius: '4px',
                                        padding: '2px 4px',
                                        fontSize: '0.68rem', fontWeight: 800,
                                        color: ch.color,
                                        outline: 'none',
                                        fontVariantNumeric: 'tabular-nums',
                                        MozAppearance: 'textfield',
                                    } })) : (_jsx("div", { onClick: () => { setEditingId(ch.id); setEditingText(String(val)); }, title: "Click to edit", style: {
                                        marginTop: '8px',
                                        background: '#111',
                                        border: `1px solid ${ch.color}33`,
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                        fontSize: '0.68rem', fontWeight: 800,
                                        color: ch.color,
                                        letterSpacing: '0.04em',
                                        fontVariantNumeric: 'tabular-nums',
                                        minWidth: '32px', textAlign: 'center',
                                        cursor: 'text',
                                    }, children: val })), _jsx("div", { style: {
                                        marginTop: '8px',
                                        fontSize: '0.62rem', fontWeight: 600,
                                        color: '#ccc', textTransform: 'uppercase',
                                        letterSpacing: '0.03em', textAlign: 'center',
                                        lineHeight: 1.25, wordBreak: 'break-word',
                                    }, children: ch.label })] }, ch.id));
                    })] }), _jsxs("div", { style: {
                    height: '44px', flexShrink: 0,
                    background: '#141414',
                    borderTop: '1px solid #2a2a2a',
                    borderBottom: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center',
                    padding: '0 18px', gap: '8px', overflowX: 'auto',
                }, children: [_jsx("button", { onClick: reset, style: { padding: '4px 11px', background: 'none', border: '1px solid #3a3a3a', borderRadius: '5px', color: '#777', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }, onMouseEnter: e => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = '#ccc'; }, onMouseLeave: e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#777'; }, children: "Reset" }), _jsx("div", { style: { width: 1, height: 18, background: '#2e2e2e', flexShrink: 0 } }), _jsx("span", { style: { fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#444', flexShrink: 0 }, children: "Presets" }), allPresets.map(p => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }, children: [_jsx("button", { onClick: () => applyPreset(p), style: {
                                    padding: '3px 9px',
                                    background: activePreset === p.name ? `${GOLD}18` : 'none',
                                    border: `1px solid ${activePreset === p.name ? GOLD : '#333'}`,
                                    borderRadius: '5px',
                                    color: activePreset === p.name ? GOLD : '#666',
                                    fontSize: '0.68rem', fontWeight: activePreset === p.name ? 700 : 400,
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                }, onMouseEnter: e => { if (activePreset !== p.name)
                                    e.currentTarget.style.borderColor = '#555'; }, onMouseLeave: e => { if (activePreset !== p.name)
                                    e.currentTarget.style.borderColor = '#333'; }, children: p.name }), !p.builtin && (_jsx("button", { onClick: () => deletePreset(p.name), title: `Delete "${p.name}"`, style: { background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer', fontSize: '12px', padding: '2px 3px', borderRadius: '3px', lineHeight: 1 }, onMouseEnter: e => e.currentTarget.style.color = '#e55', onMouseLeave: e => e.currentTarget.style.color = '#3a3a3a', children: "\u00D7" }))] }, p.name))), _jsx("div", { style: { width: 1, height: 18, background: '#2e2e2e', flexShrink: 0 } }), savingPreset ? (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }, children: [_jsx("input", { autoFocus: true, value: presetName, onChange: e => setPresetName(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    confirmSave(); if (e.key === 'Escape') {
                                    setSavingPreset(false);
                                    setPresetName('');
                                } }, placeholder: "Preset name", style: { padding: '3px 8px', background: '#1a1a1a', border: '1px solid #444', borderRadius: '5px', color: '#ccc', fontSize: '0.7rem', outline: 'none', width: '110px' } }), _jsx("button", { onClick: confirmSave, style: { padding: '3px 9px', background: NAVY, border: 'none', borderRadius: '5px', color: GOLD, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }, children: "Save" }), _jsx("button", { onClick: () => { setSavingPreset(false); setPresetName(''); }, style: { padding: '3px 7px', background: 'none', border: '1px solid #333', borderRadius: '5px', color: '#555', fontSize: '0.7rem', cursor: 'pointer' }, children: "\u00D7" })] })) : (_jsx("button", { onClick: () => setSavingPreset(true), style: { padding: '3px 10px', background: 'none', border: '1px solid #2e2e2e', borderRadius: '5px', color: '#555', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }, onMouseEnter: e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }, onMouseLeave: e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.color = '#555'; }, children: "+ Save Preset" }))] })] }));
}
