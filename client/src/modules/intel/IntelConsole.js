import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from 'react';
// ─── Constants / Helpers ─────────────────────────────────────────────────────
const SEVERITY_COLORS = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#2563eb',
    none: '#16a34a',
};
const FAILURE_LABELS = {
    none: 'None',
    'instruction-violation': 'Instruction Violation',
    'interruption-ignorance': 'Interruption Ignorance',
    overengineering: 'Overengineering',
    'execution-error': 'Execution Error',
    'intent-misalignment': 'Intent Misalignment',
    'efficiency-violation': 'Efficiency Violation',
};
const SEVERITY_ORDER = ['none', 'low', 'medium', 'high', 'critical'];
const FAILURE_ORDER = ['none', 'instruction-violation', 'interruption-ignorance', 'overengineering', 'execution-error', 'intent-misalignment', 'efficiency-violation'];
function scoreColor(val, invert = false) {
    if (invert) {
        if (val <= 20)
            return '#16a34a';
        if (val <= 40)
            return '#9a7615';
        if (val <= 60)
            return '#ea580c';
        return '#dc2626';
    }
    if (val >= 80)
        return '#16a34a';
    if (val >= 60)
        return '#9a7615';
    if (val >= 40)
        return '#ea580c';
    return '#dc2626';
}
function fmtFlag(f) {
    return f.replace(/_/g, ' ');
}
function fmtScore(n) {
    return n.toFixed(1);
}
// ─── Shared UI Primitives ────────────────────────────────────────────────────
const C = {
    bg: '#eef1f6',
    panel: '#ffffff',
    panel2: '#f7f9fc',
    border: '#dbe1ea',
    accent: '#1c2866',
    onAccent: '#ffffff',
    gold: '#9a7615',
    text: '#1a2233',
    muted: '#5a6678',
    faint: '#8a96a8',
    track: 'rgba(28,40,102,0.10)',
    code: '#f1f4f9',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
function SectionLabel({ text }) {
    return (_jsx("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }, children: text }));
}
function SeverityChip({ val }) {
    return (_jsx("span", { style: {
            background: SEVERITY_COLORS[val] + '22',
            border: `1px solid ${SEVERITY_COLORS[val]}55`,
            color: SEVERITY_COLORS[val],
            borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600, fontFamily: C.mono,
        }, children: val.toUpperCase() }));
}
function FailureChip({ val }) {
    const isNone = val === 'none';
    return (_jsx("span", { style: {
            background: isNone ? '#22c55e22' : '#ef444422',
            border: `1px solid ${isNone ? '#22c55e55' : '#ef444455'}`,
            color: isNone ? '#16a34a' : '#dc2626',
            borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600,
        }, children: FAILURE_LABELS[val] ?? val }));
}
function HBar({ label, value, max, color }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (_jsxs("div", { style: { marginBottom: 6 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 3 }, children: [_jsx("span", { children: label }), _jsx("span", { style: { fontFamily: C.mono, color: C.text }, children: value })] }), _jsx("div", { style: { height: 6, background: C.track, borderRadius: 3, overflow: 'hidden' }, children: _jsx("div", { style: { height: '100%', width: `${pct}%`, background: color ?? C.gold, borderRadius: 3, transition: 'width 0.3s' } }) })] }));
}
function ScoreBar({ label, value, invert = false }) {
    const color = scoreColor(value, invert);
    return (_jsxs("div", { style: { flex: 1, minWidth: 100 }, children: [_jsx("div", { style: { fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }, children: label }), _jsx("div", { style: { height: 4, background: C.track, borderRadius: 2, marginBottom: 4 }, children: _jsx("div", { style: { height: '100%', width: `${value}%`, background: color, borderRadius: 2 } }) }), _jsx("div", { style: { fontFamily: C.mono, fontSize: 13, color }, children: fmtScore(value) })] }));
}
// ─── View: Overview ──────────────────────────────────────────────────────────
function ViewOverview({ metrics, loading }) {
    if (loading)
        return _jsx(CenterMsg, { text: "Loading metrics..." });
    if (!metrics)
        return _jsx(CenterMsg, { text: "No sessions yet \u2014 ingest a transcript to begin." });
    const t = metrics.totals;
    const kpiStyle = {
        background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '16px 20px', flex: 1, minWidth: 120,
    };
    const maxFail = Math.max(...metrics.byFailure.map(x => x.n), 1);
    const maxSev = Math.max(...metrics.bySeverity.map(x => x.n), 1);
    const maxSent = Math.max(...metrics.bySentiment.map(x => x.n), 1);
    const maxFlag = Math.max(...metrics.byFlag.map(x => x.n), 1);
    return (_jsxs("div", { style: { padding: 20, overflowY: 'auto', flex: 1 }, children: [_jsxs("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }, children: [_jsxs("div", { style: kpiStyle, children: [_jsx(SectionLabel, { text: "Total Units" }), _jsx("div", { style: { fontFamily: C.mono, fontSize: 28, color: C.text }, children: t.total })] }), _jsxs("div", { style: kpiStyle, children: [_jsx(SectionLabel, { text: "Failures" }), _jsx("div", { style: { fontFamily: C.mono, fontSize: 28, color: '#dc2626' }, children: t.failures })] }), _jsxs("div", { style: kpiStyle, children: [_jsx(SectionLabel, { text: "High / Critical" }), _jsx("div", { style: { fontFamily: C.mono, fontSize: 28, color: '#ea580c' }, children: t.high_severity })] }), _jsxs("div", { style: { ...kpiStyle, flex: 3, minWidth: 300 }, children: [_jsx(SectionLabel, { text: "Score Averages" }), _jsxs("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap' }, children: [_jsx(ScoreBar, { label: "Compliance", value: t.avg_compliance }), _jsx(ScoreBar, { label: "Efficiency", value: t.avg_efficiency }), _jsx(ScoreBar, { label: "Overeng.", value: t.avg_overengineering, invert: true }), _jsx(ScoreBar, { label: "Autonomy", value: t.avg_autonomy }), _jsx(ScoreBar, { label: "Confidence", value: t.avg_confidence })] })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 12 }, children: [_jsxs("div", { style: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }, children: [_jsx(SectionLabel, { text: "Failure Categories" }), metrics.byFailure.map(r => _jsx(HBar, { label: FAILURE_LABELS[r.k] ?? r.k, value: r.n, max: maxFail, color: "#dc2626" }, r.k))] }), _jsxs("div", { style: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }, children: [_jsx(SectionLabel, { text: "Severity Breakdown" }), metrics.bySeverity.map(r => _jsx(HBar, { label: r.k, value: r.n, max: maxSev, color: SEVERITY_COLORS[r.k] ?? C.gold }, r.k))] }), _jsxs("div", { style: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }, children: [_jsx(SectionLabel, { text: "User Sentiment" }), metrics.bySentiment.map(r => _jsx(HBar, { label: r.k, value: r.n, max: maxSent }, r.k))] }), _jsxs("div", { style: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }, children: [_jsx(SectionLabel, { text: "Top Behavioral Flags" }), metrics.byFlag.length === 0
                                ? _jsx("span", { style: { color: C.faint, fontSize: 13 }, children: "No flags recorded." })
                                : metrics.byFlag.map(r => _jsx(HBar, { label: fmtFlag(r.k), value: r.n, max: maxFlag, color: "#c9a840" }, r.k))] })] })] }));
}
// ─── View: Records ───────────────────────────────────────────────────────────
function RecordListRow({ rec, selected, onClick }) {
    return (_jsxs("div", { onClick: onClick, style: {
            padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
            background: selected ? '#1c286640' : 'transparent',
            borderLeft: selected ? `3px solid ${C.gold}` : '3px solid transparent',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }, children: [_jsx("span", { style: { fontFamily: C.mono, fontSize: 12, color: C.gold }, children: rec.command_id }), _jsx(SeverityChip, { val: rec.severity_rating }), rec.failure_category !== 'none' && _jsx(FailureChip, { val: rec.failure_category }), _jsx("span", { style: { marginLeft: 'auto', fontFamily: C.mono, fontSize: 12, color: scoreColor(rec.compliance_score) }, children: fmtScore(rec.compliance_score) })] }), _jsx("div", { style: { fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: rec.parsed_intent || '—' })] }));
}
function DetailPanel({ rec, onUpdate, onDelete }) {
    const [annotation, setAnnotation] = useState(rec.annotation ?? '');
    const [tagsRaw, setTagsRaw] = useState((rec.tags ?? []).join(', '));
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        setAnnotation(rec.annotation ?? '');
        setTagsRaw((rec.tags ?? []).join(', '));
    }, [rec.id, rec.annotation, rec.tags]);
    async function save() {
        setSaving(true);
        try {
            const res = await fetch(`/api/intel/records/${rec.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ annotation, tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean) }),
            });
            const updated = await res.json();
            onUpdate(updated);
        }
        finally {
            setSaving(false);
        }
    }
    async function doDelete() {
        if (!confirm('Delete this record?'))
            return;
        setDeleting(true);
        try {
            await fetch(`/api/intel/records/${rec.id}`, { method: 'DELETE' });
            onDelete();
        }
        finally {
            setDeleting(false);
        }
    }
    const panelHead = {
        background: C.accent,
        padding: '6px 14px',
        borderRadius: '6px 6px 0 0',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.onAccent,
    };
    const panelBody = {
        background: C.panel2, border: `1px solid ${C.border}`, borderTop: 'none',
        borderRadius: '0 0 6px 6px', padding: '14px 16px', marginBottom: 12,
    };
    const fieldRow = (label, value, mono = false) => (_jsxs("div", { style: { marginBottom: 10 }, children: [_jsx(SectionLabel, { text: label }), _jsx("div", { style: { fontSize: 13, color: C.text, fontFamily: mono ? C.mono : undefined, whiteSpace: mono ? 'pre-wrap' : undefined }, children: value || _jsx("span", { style: { color: C.faint }, children: "\u2014" }) })] }));
    return (_jsxs("div", { style: { padding: '14px 16px', overflowY: 'auto', flex: 1 }, children: [_jsxs("div", { style: { display: 'flex', gap: 14, flexWrap: 'wrap', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14 }, children: [_jsx(ScoreBar, { label: "Compliance", value: rec.compliance_score }), _jsx(ScoreBar, { label: "Efficiency", value: rec.efficiency_score }), _jsx(ScoreBar, { label: "Overeng.", value: rec.overengineering_score, invert: true }), _jsx(ScoreBar, { label: "Autonomy", value: rec.autonomy_score }), _jsx(ScoreBar, { label: "Confidence", value: rec.confidence_score })] }), _jsxs("div", { children: [_jsxs("div", { style: panelHead, children: [_jsx("span", { style: { opacity: 0.5 }, children: "01" }), " USER INTENT"] }), _jsxs("div", { style: panelBody, children: [_jsxs("div", { style: { marginBottom: 10 }, children: [_jsx(SectionLabel, { text: "Literal Instruction" }), _jsx("div", { style: { fontFamily: C.mono, fontSize: 12, background: C.code, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 10px', whiteSpace: 'pre-wrap', color: C.text, maxHeight: 100, overflowY: 'auto' }, children: rec.literal_instruction || '—' })] }), fieldRow('User Intent', rec.user_intent), fieldRow('Parsed Intent', rec.parsed_intent)] })] }), _jsxs("div", { children: [_jsxs("div", { style: panelHead, children: [_jsx("span", { style: { opacity: 0.5 }, children: "02" }), " AGENT INTERPRETATION"] }), _jsxs("div", { style: panelBody, children: [fieldRow('Interpretation', rec.agent_interpretation), _jsxs("div", { style: { marginBottom: 10 }, children: [_jsx(SectionLabel, { text: "Actions Taken" }), rec.actions_taken && rec.actions_taken.length > 0 ? rec.actions_taken.map((a, i) => (_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }, children: [_jsx("span", { style: { background: C.accent, color: C.onAccent, fontFamily: C.mono, fontSize: 10, padding: '1px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1 }, children: a.type }), _jsx("span", { style: { fontSize: 12, color: C.muted }, children: a.detail })] }, i))) : _jsx("span", { style: { color: C.faint, fontSize: 12 }, children: "No actions recorded." })] }), _jsxs("div", { style: { display: 'flex', gap: 20 }, children: [_jsxs("div", { children: [_jsx(SectionLabel, { text: "Tool Calls" }), _jsx("span", { style: { fontFamily: C.mono, color: C.text }, children: rec.tool_usage_count })] }), _jsxs("div", { children: [_jsx(SectionLabel, { text: "Verifications" }), _jsx("span", { style: { fontFamily: C.mono, color: C.text }, children: rec.verification_count })] }), _jsxs("div", { children: [_jsx(SectionLabel, { text: "Redundant" }), _jsx("span", { style: { fontFamily: C.mono, color: rec.redundant_action_count > 0 ? '#ea580c' : C.text }, children: rec.redundant_action_count })] })] })] })] }), _jsxs("div", { children: [_jsxs("div", { style: panelHead, children: [_jsx("span", { style: { opacity: 0.5 }, children: "03" }), " ACTUAL EXECUTION"] }), _jsxs("div", { style: panelBody, children: [_jsxs("div", { style: { display: 'flex', gap: 20, marginBottom: 10 }, children: [_jsxs("div", { children: [_jsx(SectionLabel, { text: "Exec Time" }), _jsx("span", { style: { fontFamily: C.mono, fontSize: 12, color: C.text }, children: rec.execution_time || '—' })] }), _jsxs("div", { children: [_jsx(SectionLabel, { text: "Context State" }), _jsx("span", { style: { fontFamily: C.mono, fontSize: 12, color: C.text }, children: rec.context_window_state || '—' })] }), _jsxs("div", { children: [_jsx(SectionLabel, { text: "Error Type" }), _jsx("span", { style: { fontFamily: C.mono, fontSize: 12, color: rec.error_type ? '#ea580c' : C.faint }, children: rec.error_type || 'none' })] })] }), _jsx(SectionLabel, { text: "Raw Chunk" }), _jsx("div", { style: { fontFamily: C.mono, fontSize: 11, background: C.code, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 10px', whiteSpace: 'pre-wrap', color: C.muted, maxHeight: 120, overflowY: 'auto' }, children: rec.raw_chunk || '—' })] })] }), _jsxs("div", { children: [_jsxs("div", { style: panelHead, children: [_jsx("span", { style: { opacity: 0.5 }, children: "04" }), " DEVIATION FROM INTENT"] }), _jsxs("div", { style: panelBody, children: [fieldRow('Deviation', rec.deviation), _jsxs("div", { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }, children: [_jsx(FailureChip, { val: rec.failure_category }), _jsx(SeverityChip, { val: rec.severity_rating })] }), fieldRow('Root Cause', rec.root_cause), _jsxs("div", { style: { marginBottom: 4 }, children: [_jsx(SectionLabel, { text: "Flags" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 5 }, children: rec.flags && rec.flags.length > 0
                                            ? rec.flags.map(f => (_jsx("span", { style: { background: '#c9a84022', border: '1px solid #c9a84055', color: C.gold, borderRadius: 4, padding: '2px 7px', fontSize: 11 }, children: fmtFlag(f) }, f)))
                                            : _jsx("span", { style: { color: C.faint, fontSize: 12 }, children: "No flags." }) })] })] })] }), _jsxs("div", { children: [_jsxs("div", { style: panelHead, children: [_jsx("span", { style: { opacity: 0.5 }, children: "05" }), " CORRECTIVE IDEAL EXECUTION"] }), _jsxs("div", { style: panelBody, children: [fieldRow('Ideal Execution', rec.ideal_execution), fieldRow('Corrective Action', rec.corrective_action), fieldRow('Preferred Alternative', rec.preferred_alternative_action)] })] }), _jsxs("div", { style: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }, children: [_jsx(SectionLabel, { text: "Annotation" }), _jsx("textarea", { value: annotation, onChange: e => setAnnotation(e.target.value), rows: 3, style: { width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, padding: '8px 10px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' } }), _jsx(SectionLabel, { text: "Tags (comma-separated)" }), _jsx("input", { value: tagsRaw, onChange: e => setTagsRaw(e.target.value), style: { width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, padding: '7px 10px', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' } }), _jsxs("div", { style: { display: 'flex', gap: 10 }, children: [_jsx("button", { onClick: () => { void save(); }, disabled: saving, style: btnStyle(C.gold, saving), children: saving ? 'Saving...' : 'Save Annotation' }), _jsx("button", { onClick: () => { void doDelete(); }, disabled: deleting, style: btnStyle('#dc2626', deleting), children: deleting ? 'Deleting...' : 'Delete Record' })] })] })] }));
}
function btnStyle(color, disabled) {
    return {
        background: disabled ? 'rgba(0,0,0,0.04)' : `${color}1f`,
        border: `1px solid ${disabled ? C.border : color + '66'}`,
        color: disabled ? C.muted : color,
        borderRadius: 5, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    };
}
function ViewRecords({ sessionId }) {
    const [records, setRecords] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [failure, setFailure] = useState('');
    const [severity, setSeverity] = useState('');
    const [sentiment, setSentiment] = useState('');
    const [flag, setFlag] = useState('');
    const [q, setQ] = useState('');
    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (sessionId !== null)
                params.set('session_id', String(sessionId));
            if (failure)
                params.set('failure', failure);
            if (severity)
                params.set('severity', severity);
            if (sentiment)
                params.set('sentiment', sentiment);
            if (flag)
                params.set('flag', flag);
            if (q)
                params.set('q', q);
            const res = await fetch(`/api/intel/records?${params.toString()}`);
            const data = await res.json();
            setRecords(data);
        }
        finally {
            setLoading(false);
        }
    }, [sessionId, failure, severity, sentiment, flag, q]);
    useEffect(() => { void fetchRecords(); }, [fetchRecords]);
    async function loadDetail(id) {
        setSelectedId(id);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/intel/records/${id}`);
            const data = await res.json();
            setDetail(data);
        }
        finally {
            setDetailLoading(false);
        }
    }
    function handleUpdate(updated) {
        setDetail(updated);
        setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, annotation: updated.annotation, tags: updated.tags } : r));
    }
    function handleDelete() {
        setDetail(null);
        setSelectedId(null);
        void fetchRecords();
    }
    const selStyle = {
        background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text,
        padding: '6px 8px', fontSize: 12, width: '100%',
    };
    return (_jsxs("div", { style: { display: 'flex', flex: 1, overflow: 'hidden' }, children: [_jsxs("div", { style: { width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: { padding: '12px 12px 8px', borderBottom: `1px solid ${C.border}` }, children: [_jsx(SectionLabel, { text: "Filters" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [_jsxs("select", { value: failure, onChange: e => setFailure(e.target.value), style: selStyle, children: [_jsx("option", { value: "", children: "All Failures" }), FAILURE_ORDER.map(f => _jsx("option", { value: f, children: FAILURE_LABELS[f] }, f))] }), _jsxs("select", { value: severity, onChange: e => setSeverity(e.target.value), style: selStyle, children: [_jsx("option", { value: "", children: "All Severities" }), SEVERITY_ORDER.map(s => _jsx("option", { value: s, children: s }, s))] }), _jsxs("select", { value: sentiment, onChange: e => setSentiment(e.target.value), style: selStyle, children: [_jsx("option", { value: "", children: "All Sentiments" }), ['positive', 'neutral', 'negative', 'frustrated'].map(s => _jsx("option", { value: s, children: s }, s))] }), _jsx("input", { value: flag, onChange: e => setFlag(e.target.value), placeholder: "Flag (exact)", style: selStyle }), _jsx("input", { value: q, onChange: e => setQ(e.target.value), placeholder: "Search text...", style: selStyle })] })] }), _jsxs("div", { style: { overflowY: 'auto', flex: 1 }, children: [loading && _jsx("div", { style: { padding: 16, color: C.muted, fontSize: 13 }, children: "Loading..." }), !loading && records.length === 0 && _jsx("div", { style: { padding: 16, color: C.faint, fontSize: 13 }, children: "No records match." }), records.map(r => (_jsx(RecordListRow, { rec: r, selected: r.id === selectedId, onClick: () => { void loadDetail(r.id); } }, r.id)))] })] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [detailLoading && _jsx(CenterMsg, { text: "Loading record..." }), !detailLoading && !detail && _jsx(CenterMsg, { text: "Select a record to inspect." }), !detailLoading && detail && (_jsx(DetailPanel, { rec: detail, onUpdate: handleUpdate, onDelete: handleDelete }))] })] }));
}
// ─── View: Heatmap ───────────────────────────────────────────────────────────
function ViewHeatmap({ sessionId }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (sessionId !== null)
            params.set('session_id', String(sessionId));
        fetch(`/api/intel/records?${params.toString()}`)
            .then(r => r.json())
            .then((data) => { setRecords(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [sessionId]);
    const grid = useMemo(() => {
        const map = {};
        for (const f of FAILURE_ORDER) {
            map[f] = {};
            for (const s of SEVERITY_ORDER)
                map[f][s] = 0;
        }
        for (const r of records) {
            const f = r.failure_category;
            const s = r.severity_rating;
            if (map[f] && s in map[f])
                map[f][s]++;
        }
        return map;
    }, [records]);
    const maxVal = useMemo(() => {
        let m = 1;
        for (const f of FAILURE_ORDER)
            for (const s of SEVERITY_ORDER)
                if (grid[f][s] > m)
                    m = grid[f][s];
        return m;
    }, [grid]);
    const rowTotals = useMemo(() => {
        const t = {};
        for (const f of FAILURE_ORDER)
            t[f] = SEVERITY_ORDER.reduce((a, s) => a + (grid[f]?.[s] ?? 0), 0);
        return t;
    }, [grid]);
    const colTotals = useMemo(() => {
        const t = {};
        for (const s of SEVERITY_ORDER)
            t[s] = FAILURE_ORDER.reduce((a, f) => a + (grid[f]?.[s] ?? 0), 0);
        return t;
    }, [grid]);
    if (loading)
        return _jsx(CenterMsg, { text: "Loading..." });
    if (records.length === 0)
        return _jsx(CenterMsg, { text: "No records \u2014 ingest a transcript to begin." });
    const cellSize = 70;
    const labelW = 180;
    return (_jsxs("div", { style: { padding: 24, overflowX: 'auto', overflowY: 'auto', flex: 1 }, children: [_jsx(SectionLabel, { text: "Failure Category vs Severity Heatmap" }), _jsxs("table", { style: { borderCollapse: 'collapse', marginTop: 8 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { width: labelW, textAlign: 'left', padding: '6px 10px', fontSize: 11, color: C.muted } }), SEVERITY_ORDER.map(s => (_jsx("th", { style: { width: cellSize, textAlign: 'center', padding: '6px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: SEVERITY_COLORS[s] }, children: s }, s))), _jsx("th", { style: { width: cellSize, textAlign: 'center', padding: '6px 4px', fontSize: 11, color: C.muted }, children: "TOTAL" })] }) }), _jsxs("tbody", { children: [FAILURE_ORDER.map(f => (_jsxs("tr", { children: [_jsx("td", { style: { padding: '4px 10px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }, children: FAILURE_LABELS[f] }), SEVERITY_ORDER.map(s => {
                                        const count = grid[f]?.[s] ?? 0;
                                        const intensity = maxVal > 0 ? count / maxVal : 0;
                                        const bg = count === 0 ? 'transparent' : `rgba(28,40,102,${0.12 + intensity * 0.78})`;
                                        const textColor = intensity > 0.45 ? '#fff' : count > 0 ? C.accent : C.faint;
                                        return (_jsx("td", { style: { textAlign: 'center', padding: 4 }, children: _jsx("div", { style: { width: cellSize - 8, height: 40, background: bg, borderRadius: 4, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 14, color: textColor }, children: count > 0 ? count : '' }) }, s));
                                    }), _jsx("td", { style: { textAlign: 'center', padding: 4 }, children: _jsx("div", { style: { width: cellSize - 8, height: 40, background: rowTotals[f] > 0 ? '#1c286660' : 'transparent', borderRadius: 4, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 14, color: C.text }, children: rowTotals[f] > 0 ? rowTotals[f] : '' }) })] }, f))), _jsxs("tr", { children: [_jsx("td", { style: { padding: '4px 10px', fontSize: 11, color: C.muted, fontWeight: 700 }, children: "TOTAL" }), SEVERITY_ORDER.map(s => (_jsx("td", { style: { textAlign: 'center', padding: 4 }, children: _jsx("div", { style: { width: cellSize - 8, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 13, color: C.text }, children: colTotals[s] > 0 ? colTotals[s] : '' }) }, s))), _jsx("td", { style: { textAlign: 'center', padding: 4 }, children: _jsx("div", { style: { width: cellSize - 8, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 14, color: C.gold, fontWeight: 700 }, children: records.length }) })] })] })] })] }));
}
const TREND_LINES = [
    { key: 'compliance_score', label: 'Compliance', invert: false },
    { key: 'efficiency_score', label: 'Efficiency', invert: false },
    { key: 'overengineering_score', label: 'Overengineering', invert: true },
    { key: 'autonomy_score', label: 'Autonomy', invert: false },
    { key: 'confidence_score', label: 'Confidence', invert: false },
];
function Sparkline({ data, color, w, h }) {
    if (data.length < 2)
        return _jsx("svg", { width: w, height: h, children: _jsx("text", { x: 4, y: h / 2 + 4, fill: "#8a96a8", fontSize: 11, children: "Not enough data" }) });
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * (w - 20) + 10;
        const y = h - 8 - ((v / 100) * (h - 16));
        return `${x},${y}`;
    }).join(' ');
    return (_jsxs("svg", { width: w, height: h, style: { display: 'block' }, children: [_jsx("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }), (() => {
                const lastV = data[data.length - 1];
                const lastX = w - 10;
                const lastY = h - 8 - ((lastV / 100) * (h - 16));
                return _jsx("circle", { cx: lastX, cy: lastY, r: 3, fill: color });
            })()] }));
}
function ViewTrends({ metrics }) {
    if (!metrics || metrics.trend.length === 0)
        return _jsx(CenterMsg, { text: "No trend data yet." });
    const trend = metrics.trend;
    const svgW = Math.max(400, trend.length * 14);
    const svgH = 80;
    return (_jsxs("div", { style: { padding: 20, overflowY: 'auto', flex: 1 }, children: [_jsx(SectionLabel, { text: "Score Trends Across Command Sequence" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }, children: TREND_LINES.map(line => {
                    const vals = trend.map(p => p[line.key]);
                    const latest = vals[vals.length - 1] ?? 0;
                    const color = scoreColor(latest, line.invert);
                    return (_jsxs("div", { style: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }, children: [_jsx("span", { style: { fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, minWidth: 130 }, children: line.label }), _jsx("span", { style: { fontFamily: C.mono, fontSize: 16, color }, children: fmtScore(latest) }), line.invert && _jsx("span", { style: { fontSize: 10, color: C.faint }, children: "(higher = worse)" })] }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsx(Sparkline, { data: vals, color: color, w: svgW, h: svgH }) }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.faint, marginTop: 4, fontFamily: C.mono }, children: [_jsx("span", { children: trend[0]?.command_id ?? '' }), _jsx("span", { children: trend[trend.length - 1]?.command_id ?? '' })] })] }, line.key));
                }) })] }));
}
// ─── View: Ingest ─────────────────────────────────────────────────────────────
function ViewIngest({ onIngested }) {
    const [label, setLabel] = useState('');
    const [source, setSource] = useState('paste');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    async function ingest() {
        if (!label.trim() || !transcript.trim()) {
            setError('Label and transcript are required.');
            return;
        }
        setLoading(true);
        setError('');
        setResult('');
        try {
            const res = await fetch('/api/intel/ingest', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: label.trim(), source, transcript }),
            });
            const data = await res.json();
            setResult(`Parsed ${data.count} execution units into session "${data.session.label}" (ID ${data.session.id}).`);
            setTranscript('');
            onIngested();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Ingest failed.');
        }
        finally {
            setLoading(false);
        }
    }
    const inputStyle = {
        width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4,
        color: C.text, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box',
    };
    return (_jsxs("div", { style: { padding: 24, maxWidth: 720, overflowY: 'auto', flex: 1 }, children: [_jsx(SectionLabel, { text: "Ingest Transcript" }), _jsx("p", { style: { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }, children: "Parse a conversation transcript into forensic execution units. Each exchange is analyzed for intent, deviation, and behavioral patterns." }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(SectionLabel, { text: "Session Label" }), _jsx("input", { value: label, onChange: e => setLabel(e.target.value), placeholder: "e.g. Claude Code Session 2026-06-03", style: inputStyle })] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(SectionLabel, { text: "Source" }), _jsxs("select", { value: source, onChange: e => setSource(e.target.value), style: inputStyle, children: [_jsx("option", { value: "paste", children: "Paste" }), _jsx("option", { value: "claude-code", children: "Claude Code" }), _jsx("option", { value: "chatgpt", children: "ChatGPT" }), _jsx("option", { value: "api-log", children: "API Log" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsx(SectionLabel, { text: "Transcript" }), _jsx("textarea", { value: transcript, onChange: e => setTranscript(e.target.value), rows: 14, placeholder: "Paste transcript here...", style: { ...inputStyle, resize: 'vertical', fontFamily: C.mono, fontSize: 12 } })] }), _jsx("div", { style: { fontSize: 11, color: C.faint, marginBottom: 16, lineHeight: 1.6 }, children: "Accepted formats: Mark speaker turns with \"User:\" / \"Assistant:\" (also Human:/Claude:/Jay:/Agent:, or markdown ## User / **User**). Unmarked transcripts are stored as a single unit." }), error && _jsx("div", { style: { color: '#dc2626', fontSize: 13, marginBottom: 10 }, children: error }), result && _jsx("div", { style: { color: '#16a34a', fontSize: 13, marginBottom: 10, background: '#16a34a14', border: '1px solid #16a34a44', borderRadius: 4, padding: '8px 12px' }, children: result }), _jsx("button", { onClick: () => { void ingest(); }, disabled: loading, style: btnStyle(C.gold, loading), children: loading ? 'Analyzing...' : 'Ingest & Analyze' })] }));
}
// ─── View: Export ─────────────────────────────────────────────────────────────
function ViewExport({ sessionId, sessions }) {
    const session = sessions.find(s => s.id === sessionId);
    function download(withSession) {
        const url = withSession && sessionId !== null ? `/api/intel/export?session_id=${sessionId}` : '/api/intel/export';
        const a = document.createElement('a');
        a.href = url;
        a.download = withSession && session ? `intel-${session.label.replace(/\s+/g, '_')}.jsonl` : 'intel-all.jsonl';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    return (_jsxs("div", { style: { padding: 24, overflowY: 'auto', flex: 1 }, children: [_jsx(SectionLabel, { text: "Export Training Dataset" }), _jsx("p", { style: { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }, children: "Export forensic records as JSONL \u2014 one record per line, suitable for fine-tuning LLMs on behavioral correction, instruction-following, and execution quality. Each line contains the full record including literal instruction, ideal execution, deviation analysis, and corrective actions." }), _jsxs("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap' }, children: [_jsxs("button", { onClick: () => download(true), disabled: sessionId === null, style: btnStyle(C.gold, sessionId === null), title: sessionId === null ? 'Select a session first' : `Export session: ${session?.label ?? ''}`, children: ["Export Current Session", session ? ` — ${session.label}` : ''] }), _jsx("button", { onClick: () => download(false), style: btnStyle('#16a34a', false), children: "Export All Sessions" })] }), sessionId === null && (_jsx("p", { style: { fontSize: 12, color: C.faint, marginTop: 12 }, children: "Select a session from the top bar to enable per-session export." }))] }));
}
// ─── Shared Utilities ─────────────────────────────────────────────────────────
function CenterMsg({ text }) {
    return (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.faint, fontSize: 14 }, children: text }));
}
// ─── Root Component ───────────────────────────────────────────────────────────
export default function IntelConsole() {
    const [view, setView] = useState('overview');
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const fetchSessions = useCallback(async () => {
        const res = await fetch('/api/intel/sessions');
        const data = await res.json();
        setSessions(data);
    }, []);
    const fetchMetrics = useCallback(async () => {
        setMetricsLoading(true);
        try {
            const params = sessionId !== null ? `?session_id=${sessionId}` : '';
            const res = await fetch(`/api/intel/metrics${params}`);
            const data = await res.json();
            setMetrics(data);
        }
        finally {
            setMetricsLoading(false);
        }
    }, [sessionId]);
    useEffect(() => { void fetchSessions(); }, [fetchSessions]);
    useEffect(() => {
        if (view === 'overview' || view === 'trends')
            void fetchMetrics();
    }, [view, fetchMetrics]);
    const TABS = [
        { key: 'overview', label: 'Overview' },
        { key: 'records', label: 'Records' },
        { key: 'heatmap', label: 'Heatmap' },
        { key: 'trends', label: 'Trends' },
        { key: 'ingest', label: 'Ingest' },
        { key: 'export', label: 'Export' },
    ];
    const tabBtn = (tab, label) => {
        const active = view === tab;
        return (_jsx("button", { onClick: () => setView(tab), style: {
                background: active ? C.gold + '22' : 'transparent',
                border: `1px solid ${active ? C.gold + '66' : 'transparent'}`,
                borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                color: active ? C.gold : C.muted,
                padding: '6px 14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer',
                borderRadius: '4px 4px 0 0', textTransform: 'uppercase',
            }, children: label }, tab));
    };
    return (_jsxs("div", { style: { height: '100%', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }, children: [_jsxs("div", { style: { background: C.panel, borderBottom: `1px solid ${C.border}`, padding: '12px 20px 0', flexShrink: 0, boxShadow: '0 1px 3px rgba(28,40,102,0.06)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 15, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text }, children: "Operational Intelligence" }), _jsx("div", { style: { fontSize: 11, color: C.muted, letterSpacing: '0.05em' }, children: "interaction forensics \u00B7 behavioral analytics \u00B7 execution audit" })] }), _jsxs("div", { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(SectionLabel, { text: "Session" }), _jsxs("select", { value: sessionId ?? '', onChange: e => setSessionId(e.target.value === '' ? null : Number(e.target.value)), style: { background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, padding: '5px 10px', fontSize: 13, minWidth: 180 }, children: [_jsx("option", { value: "", children: "All Sessions" }), sessions.map(s => (_jsx("option", { value: s.id, children: s.label }, s.id)))] })] })] }), _jsx("div", { style: { display: 'flex', gap: 2 }, children: TABS.map(t => tabBtn(t.key, t.label)) })] }), _jsxs("div", { style: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }, children: [view === 'overview' && _jsx(ViewOverview, { metrics: metrics, loading: metricsLoading }), view === 'records' && _jsx(ViewRecords, { sessionId: sessionId }), view === 'heatmap' && _jsx(ViewHeatmap, { sessionId: sessionId }), view === 'trends' && _jsx(ViewTrends, { metrics: metrics, loading: metricsLoading }), view === 'ingest' && _jsx(ViewIngest, { onIngested: () => { void fetchSessions(); } }), view === 'export' && _jsx(ViewExport, { sessionId: sessionId, sessions: sessions })] })] }));
}
