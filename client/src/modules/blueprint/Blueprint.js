import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
const GOLD = '#c9a840';
const DARK = '#0d0d0d';
const SURFACE = '#141414';
const BORDER = '#2a2a2a';
const TEXT = '#e8e8e8';
const MUTED = '#888';
const LAYERS = [
    {
        id: 'problem',
        label: 'Layer 1 — Problem',
        question: 'What problem does this solve, and for who? What does success look like — what\'s the measurable outcome?',
    },
    {
        id: 'trigger',
        label: 'Layer 2 — Trigger',
        question: 'What starts it — a user message, a scheduled time, an event, an API call, or is it always-on? How often does it run?',
    },
    {
        id: 'io',
        label: 'Layer 3 — I/O',
        question: 'What data does it consume — databases, APIs, files, messages, user input? What does it produce or do — send a message, write to DB, generate a file, call an API?',
    },
    {
        id: 'behavior',
        label: 'Layer 4 — Behavior',
        question: 'Does it make decisions or just execute steps? Does it need memory between runs? Does anything require human approval before it acts?',
    },
    {
        id: 'infrastructure',
        label: 'Layer 5 — Infrastructure',
        question: 'Which server does this live on — THOTH, ZEUS, or Hostinger? What existing services can it hook into — PM2, Postgres, Telegram, etc.? Any hard constraints on latency, cost, or security?',
    },
];
function buildBlueprint(answers, date) {
    return `BLUEPRINT: [Unnamed — edit name above]
Date: ${date}
Status: Draft

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${answers.problem ?? ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRIGGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${answers.trigger ?? ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUTS / OUTPUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${answers.io ?? ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${answers.behavior ?? ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFRASTRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${answers.infrastructure ?? ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPOSED STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[To be determined]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPEN QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
None.`;
}
function today() {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
export default function Blueprint() {
    const [stage, setStage] = useState('interview');
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [current, setCurrent] = useState('');
    const [blueprintText, setBlueprintText] = useState('');
    const [blueprintName, setBlueprintName] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedNote, setSavedNote] = useState(null);
    const textareaRef = useRef(null);
    useEffect(() => {
        textareaRef.current?.focus();
    }, [step]);
    function handleNext() {
        const layer = LAYERS[step];
        const updated = { ...answers, [layer.id]: current.trim() };
        setAnswers(updated);
        setCurrent('');
        if (step < LAYERS.length - 1) {
            setStep(s => s + 1);
        }
        else {
            const text = buildBlueprint(updated, today());
            setBlueprintText(text);
            setBlueprintName(`Blueprint — ${today()}`);
            setStage('review');
        }
    }
    function handleBack() {
        if (step === 0)
            return;
        const layer = LAYERS[step - 1];
        setCurrent(answers[layer.id] ?? '');
        setStep(s => s - 1);
    }
    async function handleSave() {
        setSaving(true);
        try {
            const listRes = await fetch('/api/files/nodes');
            const nodes = await listRes.json();
            let folderId = null;
            const existing = nodes.find(n => n.type === 'folder' && n.parent_id == null && n.name.toLowerCase() === 'blueprint');
            if (existing) {
                folderId = existing.id;
            }
            else {
                const createRes = await fetch('/api/files/nodes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'blueprint', type: 'folder' }),
                });
                const folder = await createRes.json();
                folderId = folder.id;
            }
            const noteRes = await fetch('/api/files/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parent_id: folderId, name: blueprintName, type: 'note', content: blueprintText }),
            });
            const note = await noteRes.json();
            setSavedNote({ id: note.id, name: note.name });
            setStage('saved');
        }
        catch {
            alert('Save failed — check console.');
        }
        finally {
            setSaving(false);
        }
    }
    function handleReset() {
        setStage('interview');
        setStep(0);
        setAnswers({});
        setCurrent('');
        setBlueprintText('');
        setBlueprintName('');
        setSavedNote(null);
    }
    if (stage === 'saved') {
        return (_jsxs("div", { style: { padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }, children: [_jsx("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: GOLD, strokeWidth: "1.5", children: _jsx("polyline", { points: "20 6 9 17 4 12" }) }), _jsx("p", { style: { fontSize: '1.1rem', fontWeight: 600, color: TEXT, margin: 0 }, children: "Blueprint saved" }), _jsxs("p", { style: { fontSize: '0.875rem', color: MUTED, margin: 0 }, children: ["Saved as ", _jsx("strong", { style: { color: TEXT }, children: savedNote?.name }), " in Files \u203A blueprint"] }), _jsx("button", { onClick: handleReset, style: btnStyle('secondary'), children: "New Blueprint" })] }));
    }
    if (stage === 'review') {
        return (_jsxs("div", { style: { padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 760 }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.4rem' }, children: [_jsx("p", { style: { fontSize: '0.75rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }, children: "Blueprint Name" }), _jsx("input", { value: blueprintName, onChange: e => setBlueprintName(e.target.value), style: inputStyle })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.4rem' }, children: [_jsx("p", { style: { fontSize: '0.75rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }, children: "Blueprint Content" }), _jsx("textarea", { value: blueprintText, onChange: e => setBlueprintText(e.target.value), rows: 28, style: { ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', lineHeight: 1.65 } })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: () => setStage('interview'), style: btnStyle('secondary'), children: "\u2190 Back" }), _jsx("button", { onClick: handleSave, disabled: saving, style: btnStyle('primary'), children: saving ? 'Saving…' : 'Save to Files' })] })] }));
    }
    const layer = LAYERS[step];
    const progress = ((step) / LAYERS.length) * 100;
    return (_jsxs("div", { style: { padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 680 }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.6rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: '0.75rem', fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }, children: layer.label }), _jsxs("span", { style: { fontSize: '0.75rem', color: MUTED }, children: [step + 1, " / ", LAYERS.length] })] }), _jsx("div", { style: { height: 3, background: BORDER, borderRadius: 2 }, children: _jsx("div", { style: { height: '100%', width: `${progress}%`, background: GOLD, borderRadius: 2, transition: 'width 0.3s ease' } }) })] }), _jsx("p", { style: { fontSize: '1rem', color: TEXT, lineHeight: 1.65, margin: 0, fontWeight: 400 }, children: layer.question }), _jsx("textarea", { ref: textareaRef, value: current, onChange: e => setCurrent(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && current.trim())
                    handleNext(); }, rows: 6, placeholder: "Type your answer\u2026", style: { ...inputStyle, resize: 'vertical', lineHeight: 1.6 } }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem', alignItems: 'center' }, children: [step > 0 && (_jsx("button", { onClick: handleBack, style: btnStyle('secondary'), children: "\u2190 Back" })), _jsx("button", { onClick: handleNext, disabled: !current.trim(), style: btnStyle('primary'), children: step < LAYERS.length - 1 ? 'Next →' : 'Review Blueprint' }), _jsx("span", { style: { fontSize: '0.72rem', color: MUTED, marginLeft: 'auto' }, children: "\u2318\u21B5 to continue" })] }), step > 0 && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: `1px solid ${BORDER}`, paddingTop: '1.25rem' }, children: LAYERS.slice(0, step).map(l => (_jsxs("div", { style: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }, children: [_jsx("span", { style: { fontSize: '0.72rem', color: GOLD, fontWeight: 600, whiteSpace: 'nowrap', paddingTop: 2 }, children: l.label.split('—')[1]?.trim() }), _jsxs("span", { style: { fontSize: '0.78rem', color: MUTED, lineHeight: 1.5 }, children: [answers[l.id]?.slice(0, 120), (answers[l.id]?.length ?? 0) > 120 ? '…' : ''] })] }, l.id))) }))] }));
}
const inputStyle = {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    color: TEXT,
    fontSize: '0.875rem',
    padding: '0.65rem 0.85rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
};
function btnStyle(variant) {
    return variant === 'primary'
        ? { background: GOLD, color: DARK, border: 'none', borderRadius: 6, padding: '0.55rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }
        : { background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '0.55rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' };
}
