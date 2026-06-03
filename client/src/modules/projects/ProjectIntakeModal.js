import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
// New-project intake modal for the raven hub. Posts to the shared /api/projects
// store (same-origin on raven). The created record starts as status "pending";
// /project-setup later scaffolds GitHub and flips it to "active".
const GOLD = '#c9a840';
const REPO_STRATEGIES = [
    { value: 'new', label: 'New dedicated repo' },
    { value: 'pagios-ops', label: 'Into pagios-ops (tracker + docs only)' },
    { value: 'existing', label: 'Existing repo' },
];
export default function ProjectIntakeModal({ onClose, onCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState('');
    const [stack, setStack] = useState('');
    const [target, setTarget] = useState('');
    const [repoStrategy, setRepoStrategy] = useState('new');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const submit = async () => {
        if (!name.trim()) {
            setError('Project name is required.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const r = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    goal: goal.trim(),
                    stack: stack.trim(),
                    target: target.trim(),
                    repo_strategy: repoStrategy,
                    notes: notes.trim(),
                    created_by: 'raven',
                }),
            });
            if (!r.ok) {
                setError(`Create failed (HTTP ${r.status}).`);
                setSaving(false);
                return;
            }
            const p = await r.json();
            onCreated(p);
        }
        catch {
            setError('Network error creating project.');
            setSaving(false);
        }
    };
    const labelStyle = { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' };
    const inputStyle = {
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
        color: '#fff', padding: '0.5rem 0.65rem', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box',
    };
    return (_jsx("div", { onClick: onClose, style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }, children: _jsxs("div", { onClick: e => e.stopPropagation(), style: { background: '#0c1023', border: `1px solid ${GOLD}55`, borderRadius: 12, width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem 1.6rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }, children: [_jsx("h2", { style: { margin: 0, fontSize: '1.15rem', color: '#fff' }, children: "New Project" }), _jsx("button", { onClick: onClose, style: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }, children: "\u00D7" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.85rem' }, children: [_jsxs("label", { style: labelStyle, children: ["Project name *", _jsx("input", { style: inputStyle, value: name, onChange: e => setName(e.target.value), placeholder: "e.g. Customer Portal Revamp", autoFocus: true })] }), _jsxs("label", { style: labelStyle, children: ["Description", _jsx("textarea", { style: { ...inputStyle, minHeight: 64, resize: 'vertical' }, value: description, onChange: e => setDescription(e.target.value), placeholder: "What is this project, in plain terms?" })] }), _jsxs("label", { style: labelStyle, children: ["Goal / scope", _jsx("textarea", { style: { ...inputStyle, minHeight: 56, resize: 'vertical' }, value: goal, onChange: e => setGoal(e.target.value), placeholder: "What should exist when it is done? (feeds phase planning)" })] }), _jsxs("label", { style: labelStyle, children: ["Stack / platform", _jsx("input", { style: inputStyle, value: stack, onChange: e => setStack(e.target.value), placeholder: "e.g. Vite + React + Fastify + Postgres" })] }), _jsxs("label", { style: labelStyle, children: ["Target domain or deployment", _jsx("input", { style: inputStyle, value: target, onChange: e => setTarget(e.target.value), placeholder: "e.g. example.alijroberts.com on ZEUS" })] }), _jsxs("label", { style: labelStyle, children: ["Repo strategy", _jsx("select", { style: inputStyle, value: repoStrategy, onChange: e => setRepoStrategy(e.target.value), children: REPO_STRATEGIES.map(o => _jsx("option", { value: o.value, style: { background: '#0c1023' }, children: o.label }, o.value)) })] }), _jsxs("label", { style: labelStyle, children: ["Notes / constraints", _jsx("textarea", { style: { ...inputStyle, minHeight: 48, resize: 'vertical' }, value: notes, onChange: e => setNotes(e.target.value), placeholder: "Anything the build must respect." })] }), error && _jsx("p", { style: { color: '#ff8080', fontSize: '0.85rem', margin: 0 }, children: error }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.4rem' }, children: [_jsx("button", { onClick: onClose, style: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem' }, children: "Cancel" }), _jsx("button", { onClick: submit, disabled: saving || !name.trim(), style: { background: GOLD, border: 'none', color: '#1a1400', borderRadius: 6, padding: '0.5rem 1.1rem', cursor: saving || !name.trim() ? 'not-allowed' : 'pointer', opacity: saving || !name.trim() ? 0.5 : 1, fontSize: '0.9rem', fontWeight: 700 }, children: saving ? 'Creating...' : 'Create project' })] })] })] }) }));
}
