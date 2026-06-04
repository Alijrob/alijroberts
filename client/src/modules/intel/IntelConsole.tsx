import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewTab = 'overview' | 'records' | 'heatmap' | 'trends' | 'ingest' | 'export';
type FailureCategory = 'none' | 'instruction-violation' | 'interruption-ignorance' | 'overengineering' | 'execution-error' | 'intent-misalignment' | 'efficiency-violation';
type Severity = 'none' | 'low' | 'medium' | 'high' | 'critical';
type OutcomeQuality = 'good' | 'mixed' | 'poor';
type UserSentiment = 'positive' | 'neutral' | 'negative' | 'frustrated';

interface SessionSummary {
  id: number;
  label: string;
  source: string;
  created_at: string;
  record_count: number;
  avg_compliance: number;
  failure_count: number;
}

interface ActionTaken {
  type: string;
  detail: string;
}

interface RecordSummary {
  id: number;
  session_id: number;
  seq: number;
  command_id: string;
  parsed_intent: string;
  agent_interpretation: string;
  failure_category: FailureCategory;
  severity_rating: Severity;
  outcome_quality: OutcomeQuality;
  user_sentiment: UserSentiment;
  error_type: string;
  tool_usage_count: number;
  verification_count: number;
  redundant_action_count: number;
  compliance_score: number;
  efficiency_score: number;
  overengineering_score: number;
  autonomy_score: number;
  confidence_score: number;
  categories: string[];
  flags: string[];
  annotation: string;
  tags: string[];
  source: string;
  created_at: string;
}

interface RecordFull extends RecordSummary {
  literal_instruction: string;
  user_intent: string;
  root_cause: string;
  corrective_action: string;
  preferred_alternative_action: string;
  deviation: string;
  ideal_execution: string;
  actions_taken: ActionTaken[];
  execution_time: string;
  context_window_state: string;
  raw_chunk: string;
}

interface MetricsTotals {
  total: number;
  failures: number;
  high_severity: number;
  avg_compliance: number;
  avg_efficiency: number;
  avg_overengineering: number;
  avg_autonomy: number;
  avg_confidence: number;
}

interface MetricsKV {
  k: string;
  n: number;
}

interface TrendPoint {
  command_id: string;
  seq: number;
  session_id: number;
  compliance_score: number;
  efficiency_score: number;
  overengineering_score: number;
  autonomy_score: number;
  confidence_score: number;
}

interface Metrics {
  totals: MetricsTotals;
  byFailure: MetricsKV[];
  bySeverity: MetricsKV[];
  bySentiment: MetricsKV[];
  byOutcome: MetricsKV[];
  byFlag: MetricsKV[];
  trend: TrendPoint[];
}

// ─── Constants / Helpers ─────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#2563eb',
  none: '#16a34a',
};

const FAILURE_LABELS: Record<string, string> = {
  none: 'None',
  'instruction-violation': 'Instruction Violation',
  'interruption-ignorance': 'Interruption Ignorance',
  overengineering: 'Overengineering',
  'execution-error': 'Execution Error',
  'intent-misalignment': 'Intent Misalignment',
  'efficiency-violation': 'Efficiency Violation',
};

const SEVERITY_ORDER: Severity[] = ['none', 'low', 'medium', 'high', 'critical'];
const FAILURE_ORDER: FailureCategory[] = ['none', 'instruction-violation', 'interruption-ignorance', 'overengineering', 'execution-error', 'intent-misalignment', 'efficiency-violation'];

function scoreColor(val: number, invert = false): string {
  if (invert) {
    if (val <= 20) return '#16a34a';
    if (val <= 40) return '#9a7615';
    if (val <= 60) return '#ea580c';
    return '#dc2626';
  }
  if (val >= 80) return '#16a34a';
  if (val >= 60) return '#9a7615';
  if (val >= 40) return '#ea580c';
  return '#dc2626';
}

function fmtFlag(f: string): string {
  return f.replace(/_/g, ' ');
}

function fmtScore(n: number): string {
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
  shadow: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.07)',
  shadowLg: '0 4px 12px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.05)',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

const CARD: React.CSSProperties = {
  background: C.panel,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  boxShadow: C.shadow,
};

function SectionLabel({ text }: { text: string }): React.JSX.Element {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
      {text}
    </div>
  );
}

function SeverityChip({ val }: { val: Severity }): React.JSX.Element {
  return (
    <span style={{
      background: SEVERITY_COLORS[val] + '22',
      border: `1px solid ${SEVERITY_COLORS[val]}55`,
      color: SEVERITY_COLORS[val],
      borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600, fontFamily: C.mono,
    }}>
      {val.toUpperCase()}
    </span>
  );
}

function FailureChip({ val }: { val: string }): React.JSX.Element {
  const isNone = val === 'none';
  return (
    <span style={{
      background: isNone ? '#22c55e22' : '#ef444422',
      border: `1px solid ${isNone ? '#22c55e55' : '#ef444455'}`,
      color: isNone ? '#16a34a' : '#dc2626',
      borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600,
    }}>
      {FAILURE_LABELS[val] ?? val}
    </span>
  );
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color?: string }): React.JSX.Element {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontFamily: C.mono, color: C.text }}>{value}</span>
      </div>
      <div style={{ height: 6, background: C.track, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color ?? C.gold, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }): React.JSX.Element {
  const color = scoreColor(value, invert);
  return (
    <div style={{ flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ height: 4, background: C.track, borderRadius: 2, marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 2 }} />
      </div>
      <div style={{ fontFamily: C.mono, fontSize: 13, color }}>{fmtScore(value)}</div>
    </div>
  );
}

// ─── View: Overview ──────────────────────────────────────────────────────────

function ViewOverview({ metrics, loading }: { metrics: Metrics | null; loading: boolean }): React.JSX.Element {
  if (loading) return <CenterMsg text="Loading metrics..." />;
  if (!metrics) return <CenterMsg text="No sessions yet — ingest a transcript to begin." />;
  const t = metrics.totals;
  const kpiStyle: React.CSSProperties = {
    ...CARD, padding: '16px 20px', flex: 1, minWidth: 120,
  };
  const maxFail = Math.max(...metrics.byFailure.map(x => x.n), 1);
  const maxSev = Math.max(...metrics.bySeverity.map(x => x.n), 1);
  const maxSent = Math.max(...metrics.bySentiment.map(x => x.n), 1);
  const maxFlag = Math.max(...metrics.byFlag.map(x => x.n), 1);
  return (
    <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={kpiStyle}>
          <SectionLabel text="Total Units" />
          <div style={{ fontFamily: C.mono, fontSize: 28, color: C.text }}>{t.total}</div>
        </div>
        <div style={kpiStyle}>
          <SectionLabel text="Failures" />
          <div style={{ fontFamily: C.mono, fontSize: 28, color: '#dc2626' }}>{t.failures}</div>
        </div>
        <div style={kpiStyle}>
          <SectionLabel text="High / Critical" />
          <div style={{ fontFamily: C.mono, fontSize: 28, color: '#ea580c' }}>{t.high_severity}</div>
        </div>
        <div style={{ ...kpiStyle, flex: 3, minWidth: 300 }}>
          <SectionLabel text="Score Averages" />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <ScoreBar label="Compliance" value={t.avg_compliance} />
            <ScoreBar label="Efficiency" value={t.avg_efficiency} />
            <ScoreBar label="Overeng." value={t.avg_overengineering} invert />
            <ScoreBar label="Autonomy" value={t.avg_autonomy} />
            <ScoreBar label="Confidence" value={t.avg_confidence} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
        <div style={{ ...CARD, padding: 18 }}>
          <SectionLabel text="Failure Categories" />
          {metrics.byFailure.map(r => <HBar key={r.k} label={FAILURE_LABELS[r.k] ?? r.k} value={r.n} max={maxFail} color="#dc2626" />)}
        </div>
        <div style={{ ...CARD, padding: 18 }}>
          <SectionLabel text="Severity Breakdown" />
          {metrics.bySeverity.map(r => <HBar key={r.k} label={r.k} value={r.n} max={maxSev} color={SEVERITY_COLORS[r.k as Severity] ?? C.gold} />)}
        </div>
        <div style={{ ...CARD, padding: 18 }}>
          <SectionLabel text="User Sentiment" />
          {metrics.bySentiment.map(r => <HBar key={r.k} label={r.k} value={r.n} max={maxSent} />)}
        </div>
        <div style={{ ...CARD, padding: 18 }}>
          <SectionLabel text="Top Behavioral Flags" />
          {metrics.byFlag.length === 0
            ? <span style={{ color: C.faint, fontSize: 13 }}>No flags recorded.</span>
            : metrics.byFlag.map(r => <HBar key={r.k} label={fmtFlag(r.k)} value={r.n} max={maxFlag} color="#c9a840" />)}
        </div>
      </div>
    </div>
  );
}

// ─── View: Records ───────────────────────────────────────────────────────────

function RecordListRow({ rec, selected, onClick }: { rec: RecordSummary; selected: boolean; onClick: () => void }): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
        background: selected ? '#1c286640' : 'transparent',
        borderLeft: selected ? `3px solid ${C.gold}` : '3px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: C.mono, fontSize: 12, color: C.gold }}>{rec.command_id}</span>
        <SeverityChip val={rec.severity_rating} />
        {rec.source === 'wtf' && (
          <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: C.onAccent, background: '#7c3aed', borderRadius: 3, padding: '1px 5px', letterSpacing: 0.5 }}>WTF</span>
        )}
        {rec.failure_category !== 'none' && <FailureChip val={rec.failure_category} />}
        <span style={{ marginLeft: 'auto', fontFamily: C.mono, fontSize: 12, color: scoreColor(rec.compliance_score) }}>{fmtScore(rec.compliance_score)}</span>
      </div>
      <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {rec.parsed_intent || '—'}
      </div>
    </div>
  );
}

function DetailPanel({ rec, onUpdate, onDelete }: {
  rec: RecordFull;
  onUpdate: (updated: RecordFull) => void;
  onDelete: () => void;
}): React.JSX.Element {
  const [annotation, setAnnotation] = useState(rec.annotation ?? '');
  const [tagsRaw, setTagsRaw] = useState((rec.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setAnnotation(rec.annotation ?? '');
    setTagsRaw((rec.tags ?? []).join(', '));
  }, [rec.id, rec.annotation, rec.tags]);

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/intel/records/${rec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotation, tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      const updated: RecordFull = await res.json() as RecordFull;
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  async function doDelete(): Promise<void> {
    if (!confirm('Delete this record?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/intel/records/${rec.id}`, { method: 'DELETE' });
      onDelete();
    } finally {
      setDeleting(false);
    }
  }

  const panelHead: React.CSSProperties = {
    background: C.accent,
    padding: '8px 14px',
    borderRadius: '8px 8px 0 0',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.onAccent,
  };

  const panelBody: React.CSSProperties = {
    background: C.panel, border: `1px solid ${C.border}`, borderTop: 'none',
    borderRadius: '0 0 8px 8px', padding: '14px 16px', marginBottom: 14, boxShadow: C.shadow,
  };

  const fieldRow = (label: string, value: string, mono = false): React.JSX.Element => (
    <div style={{ marginBottom: 10 }}>
      <SectionLabel text={label} />
      <div style={{ fontSize: 13, color: C.text, fontFamily: mono ? C.mono : undefined, whiteSpace: mono ? 'pre-wrap' as const : undefined }}>
        {value || <span style={{ color: C.faint }}>—</span>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
      {/* Score strip */}
      <div style={{ ...CARD, display: 'flex', gap: 14, flexWrap: 'wrap', padding: '14px 16px', marginBottom: 16 }}>
        <ScoreBar label="Compliance" value={rec.compliance_score} />
        <ScoreBar label="Efficiency" value={rec.efficiency_score} />
        <ScoreBar label="Overeng." value={rec.overengineering_score} invert />
        <ScoreBar label="Autonomy" value={rec.autonomy_score} />
        <ScoreBar label="Confidence" value={rec.confidence_score} />
      </div>

      {/* Panel 1: User Intent */}
      <div>
        <div style={panelHead}>
          <span style={{ opacity: 0.5 }}>01</span> USER INTENT
        </div>
        <div style={panelBody}>
          <div style={{ marginBottom: 10 }}>
            <SectionLabel text="Literal Instruction" />
            <div style={{ fontFamily: C.mono, fontSize: 12, background: C.code, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 10px', whiteSpace: 'pre-wrap', color: C.text, maxHeight: 100, overflowY: 'auto' }}>
              {rec.literal_instruction || '—'}
            </div>
          </div>
          {fieldRow('User Intent', rec.user_intent)}
          {fieldRow('Parsed Intent', rec.parsed_intent)}
        </div>
      </div>

      {/* Panel 2: Agent Interpretation */}
      <div>
        <div style={panelHead}>
          <span style={{ opacity: 0.5 }}>02</span> AGENT INTERPRETATION
        </div>
        <div style={panelBody}>
          {fieldRow('Interpretation', rec.agent_interpretation)}
          <div style={{ marginBottom: 10 }}>
            <SectionLabel text="Actions Taken" />
            {rec.actions_taken && rec.actions_taken.length > 0 ? rec.actions_taken.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                <span style={{ background: C.accent, color: C.onAccent, fontFamily: C.mono, fontSize: 10, padding: '1px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1 }}>{a.type}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{a.detail}</span>
              </div>
            )) : <span style={{ color: C.faint, fontSize: 12 }}>No actions recorded.</span>}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div><SectionLabel text="Tool Calls" /><span style={{ fontFamily: C.mono, color: C.text }}>{rec.tool_usage_count}</span></div>
            <div><SectionLabel text="Verifications" /><span style={{ fontFamily: C.mono, color: C.text }}>{rec.verification_count}</span></div>
            <div><SectionLabel text="Redundant" /><span style={{ fontFamily: C.mono, color: rec.redundant_action_count > 0 ? '#ea580c' : C.text }}>{rec.redundant_action_count}</span></div>
          </div>
        </div>
      </div>

      {/* Panel 3: Actual Execution */}
      <div>
        <div style={panelHead}>
          <span style={{ opacity: 0.5 }}>03</span> ACTUAL EXECUTION
        </div>
        <div style={panelBody}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
            <div><SectionLabel text="Exec Time" /><span style={{ fontFamily: C.mono, fontSize: 12, color: C.text }}>{rec.execution_time || '—'}</span></div>
            <div><SectionLabel text="Context State" /><span style={{ fontFamily: C.mono, fontSize: 12, color: C.text }}>{rec.context_window_state || '—'}</span></div>
            <div><SectionLabel text="Error Type" /><span style={{ fontFamily: C.mono, fontSize: 12, color: rec.error_type ? '#ea580c' : C.faint }}>{rec.error_type || 'none'}</span></div>
          </div>
          <SectionLabel text="Raw Chunk" />
          <div style={{ fontFamily: C.mono, fontSize: 11, background: C.code, border: `1px solid ${C.border}`, borderRadius: 4, padding: '8px 10px', whiteSpace: 'pre-wrap', color: C.muted, maxHeight: 120, overflowY: 'auto' }}>
            {rec.raw_chunk || '—'}
          </div>
        </div>
      </div>

      {/* Panel 4: Deviation From Intent */}
      <div>
        <div style={panelHead}>
          <span style={{ opacity: 0.5 }}>04</span> DEVIATION FROM INTENT
        </div>
        <div style={panelBody}>
          {fieldRow('Deviation', rec.deviation)}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <FailureChip val={rec.failure_category} />
            <SeverityChip val={rec.severity_rating} />
          </div>
          {fieldRow('Root Cause', rec.root_cause)}
          <div style={{ marginBottom: 4 }}>
            <SectionLabel text="Flags" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {rec.flags && rec.flags.length > 0
                ? rec.flags.map(f => (
                  <span key={f} style={{ background: '#c9a84022', border: '1px solid #c9a84055', color: C.gold, borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{fmtFlag(f)}</span>
                ))
                : <span style={{ color: C.faint, fontSize: 12 }}>No flags.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Panel 5: Corrective Ideal Execution */}
      <div>
        <div style={panelHead}>
          <span style={{ opacity: 0.5 }}>05</span> CORRECTIVE IDEAL EXECUTION
        </div>
        <div style={panelBody}>
          {fieldRow('Ideal Execution', rec.ideal_execution)}
          {fieldRow('Corrective Action', rec.corrective_action)}
          {fieldRow('Preferred Alternative', rec.preferred_alternative_action)}
        </div>
      </div>

      {/* Annotation + Tags + Actions */}
      <div style={{ ...CARD, padding: 16 }}>
        <SectionLabel text="Annotation" />
        <textarea
          value={annotation}
          onChange={e => setAnnotation(e.target.value)}
          rows={3}
          style={{ width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, padding: '8px 10px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
        />
        <SectionLabel text="Tags (comma-separated)" />
        <input
          value={tagsRaw}
          onChange={e => setTagsRaw(e.target.value)}
          style={{ width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, padding: '7px 10px', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { void save(); }} disabled={saving} style={btnStyle(C.gold, saving)}>
            {saving ? 'Saving...' : 'Save Annotation'}
          </button>
          <button onClick={() => { void doDelete(); }} disabled={deleting} style={btnStyle('#dc2626', deleting)}>
            {deleting ? 'Deleting...' : 'Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'rgba(0,0,0,0.04)' : `${color}1f`,
    border: `1px solid ${disabled ? C.border : color + '66'}`,
    color: disabled ? C.muted : color,
    borderRadius: 5, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function ViewRecords({ sessionId }: { sessionId: number | null }): React.JSX.Element {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RecordFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [failure, setFailure] = useState('');
  const [severity, setSeverity] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [source, setSource] = useState('');
  const [flag, setFlag] = useState('');
  const [q, setQ] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sessionId !== null) params.set('session_id', String(sessionId));
      if (failure) params.set('failure', failure);
      if (severity) params.set('severity', severity);
      if (sentiment) params.set('sentiment', sentiment);
      if (source) params.set('source', source);
      if (flag) params.set('flag', flag);
      if (q) params.set('q', q);
      const res = await fetch(`/api/intel/records?${params.toString()}`);
      const data = await res.json() as RecordSummary[];
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }, [sessionId, failure, severity, sentiment, source, flag, q]);

  useEffect(() => { void fetchRecords(); }, [fetchRecords]);

  async function loadDetail(id: number): Promise<void> {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/intel/records/${id}`);
      const data = await res.json() as RecordFull;
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleUpdate(updated: RecordFull): void {
    setDetail(updated);
    setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, annotation: updated.annotation, tags: updated.tags } : r));
  }

  function handleDelete(): void {
    setDetail(null);
    setSelectedId(null);
    void fetchRecords();
  }

  const selStyle: React.CSSProperties = {
    background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text,
    padding: '6px 8px', fontSize: 12, width: '100%',
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left: filters + list */}
      <div style={{ width: 300, flexShrink: 0, background: C.panel, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${C.border}` }}>
          <SectionLabel text="Filters" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select value={failure} onChange={e => setFailure(e.target.value)} style={selStyle}>
              <option value="">All Failures</option>
              {FAILURE_ORDER.map(f => <option key={f} value={f}>{FAILURE_LABELS[f]}</option>)}
            </select>
            <select value={severity} onChange={e => setSeverity(e.target.value)} style={selStyle}>
              <option value="">All Severities</option>
              {SEVERITY_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sentiment} onChange={e => setSentiment(e.target.value)} style={selStyle}>
              <option value="">All Sentiments</option>
              {['positive','neutral','negative','frustrated'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={source} onChange={e => setSource(e.target.value)} style={selStyle}>
              <option value="">All Sources</option>
              <option value="wtf">/wtf corrections</option>
              <option value="paste">Pasted</option>
              <option value="upload">Uploaded</option>
            </select>
            <input value={flag} onChange={e => setFlag(e.target.value)} placeholder="Flag (exact)" style={selStyle} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search text..." style={selStyle} />
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <div style={{ padding: 16, color: C.muted, fontSize: 13 }}>Loading...</div>}
          {!loading && records.length === 0 && <div style={{ padding: 16, color: C.faint, fontSize: 13 }}>No records match.</div>}
          {records.map(r => (
            <RecordListRow key={r.id} rec={r} selected={r.id === selectedId} onClick={() => { void loadDetail(r.id); }} />
          ))}
        </div>
      </div>
      {/* Right: detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {detailLoading && <CenterMsg text="Loading record..." />}
        {!detailLoading && !detail && <CenterMsg text="Select a record to inspect." />}
        {!detailLoading && detail && (
          <DetailPanel rec={detail} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

// ─── View: Heatmap ───────────────────────────────────────────────────────────

function ViewHeatmap({ sessionId }: { sessionId: number | null }): React.JSX.Element {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sessionId !== null) params.set('session_id', String(sessionId));
    fetch(`/api/intel/records?${params.toString()}`)
      .then(r => r.json())
      .then((data: RecordSummary[]) => { setRecords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const grid = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const f of FAILURE_ORDER) {
      map[f] = {};
      for (const s of SEVERITY_ORDER) map[f][s] = 0;
    }
    for (const r of records) {
      const f = r.failure_category as FailureCategory;
      const s = r.severity_rating as Severity;
      if (map[f] && s in map[f]) map[f][s]++;
    }
    return map;
  }, [records]);

  const maxVal = useMemo(() => {
    let m = 1;
    for (const f of FAILURE_ORDER) for (const s of SEVERITY_ORDER) if (grid[f][s] > m) m = grid[f][s];
    return m;
  }, [grid]);

  const rowTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const f of FAILURE_ORDER) t[f] = SEVERITY_ORDER.reduce((a, s) => a + (grid[f]?.[s] ?? 0), 0);
    return t;
  }, [grid]);

  const colTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const s of SEVERITY_ORDER) t[s] = FAILURE_ORDER.reduce((a, f) => a + (grid[f]?.[s] ?? 0), 0);
    return t;
  }, [grid]);

  if (loading) return <CenterMsg text="Loading..." />;
  if (records.length === 0) return <CenterMsg text="No records — ingest a transcript to begin." />;

  const cellSize = 70;
  const labelW = 180;

  return (
    <div style={{ padding: 24, overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      <SectionLabel text="Failure Category vs Severity Heatmap" />
      <table style={{ borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr>
            <th style={{ width: labelW, textAlign: 'left', padding: '6px 10px', fontSize: 11, color: C.muted }}></th>
            {SEVERITY_ORDER.map(s => (
              <th key={s} style={{ width: cellSize, textAlign: 'center', padding: '6px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: SEVERITY_COLORS[s] }}>{s}</th>
            ))}
            <th style={{ width: cellSize, textAlign: 'center', padding: '6px 4px', fontSize: 11, color: C.muted }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {FAILURE_ORDER.map(f => (
            <tr key={f}>
              <td style={{ padding: '4px 10px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{FAILURE_LABELS[f]}</td>
              {SEVERITY_ORDER.map(s => {
                const count = grid[f]?.[s] ?? 0;
                const intensity = maxVal > 0 ? count / maxVal : 0;
                const bg = count === 0 ? 'transparent' : `rgba(28,40,102,${0.12 + intensity * 0.78})`;
                const textColor = intensity > 0.45 ? '#fff' : count > 0 ? C.accent : C.faint;
                return (
                  <td key={s} style={{ textAlign: 'center', padding: 4 }}>
                    <div style={{ width: cellSize - 8, height: 40, background: bg, borderRadius: 4, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 14, color: textColor }}>
                      {count > 0 ? count : ''}
                    </div>
                  </td>
                );
              })}
              <td style={{ textAlign: 'center', padding: 4 }}>
                <div style={{ width: cellSize - 8, height: 40, background: rowTotals[f] > 0 ? '#1c286660' : 'transparent', borderRadius: 4, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 14, color: C.text }}>
                  {rowTotals[f] > 0 ? rowTotals[f] : ''}
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: '4px 10px', fontSize: 11, color: C.muted, fontWeight: 700 }}>TOTAL</td>
            {SEVERITY_ORDER.map(s => (
              <td key={s} style={{ textAlign: 'center', padding: 4 }}>
                <div style={{ width: cellSize - 8, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 13, color: C.text }}>{colTotals[s] > 0 ? colTotals[s] : ''}</div>
              </td>
            ))}
            <td style={{ textAlign: 'center', padding: 4 }}>
              <div style={{ width: cellSize - 8, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 14, color: C.gold, fontWeight: 700 }}>{records.length}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── View: Trends ─────────────────────────────────────────────────────────────

type TrendKey = 'compliance_score' | 'efficiency_score' | 'overengineering_score' | 'autonomy_score' | 'confidence_score';

interface TrendLine {
  key: TrendKey;
  label: string;
  invert: boolean;
}

const TREND_LINES: TrendLine[] = [
  { key: 'compliance_score', label: 'Compliance', invert: false },
  { key: 'efficiency_score', label: 'Efficiency', invert: false },
  { key: 'overengineering_score', label: 'Overengineering', invert: true },
  { key: 'autonomy_score', label: 'Autonomy', invert: false },
  { key: 'confidence_score', label: 'Confidence', invert: false },
];

function Sparkline({ data, color, w, h }: { data: number[]; color: string; w: number; h: number }): React.JSX.Element {
  if (data.length < 2) return <svg width={w} height={h}><text x={4} y={h / 2 + 4} fill="#8a96a8" fontSize={11}>Not enough data</text></svg>;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 20) + 10;
    const y = h - 8 - ((v / 100) * (h - 16));
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* last point dot */}
      {(() => {
        const lastV = data[data.length - 1];
        const lastX = w - 10;
        const lastY = h - 8 - ((lastV / 100) * (h - 16));
        return <circle cx={lastX} cy={lastY} r={3} fill={color} />;
      })()}
    </svg>
  );
}

function ViewTrends({ metrics }: { metrics: Metrics | null; loading: boolean }): React.JSX.Element {
  if (!metrics || metrics.trend.length === 0) return <CenterMsg text="No trend data yet." />;
  const trend = metrics.trend;
  const svgW = Math.max(400, trend.length * 14);
  const svgH = 80;
  return (
    <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
      <SectionLabel text="Score Trends Across Command Sequence" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        {TREND_LINES.map(line => {
          const vals = trend.map(p => p[line.key]);
          const latest = vals[vals.length - 1] ?? 0;
          const color = scoreColor(latest, line.invert);
          return (
            <div key={line.key} style={{ ...CARD, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, minWidth: 130 }}>{line.label}</span>
                <span style={{ fontFamily: C.mono, fontSize: 16, color }}>{fmtScore(latest)}</span>
                {line.invert && <span style={{ fontSize: 10, color: C.faint }}>(higher = worse)</span>}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <Sparkline data={vals} color={color} w={svgW} h={svgH} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.faint, marginTop: 4, fontFamily: C.mono }}>
                <span>{trend[0]?.command_id ?? ''}</span>
                <span>{trend[trend.length - 1]?.command_id ?? ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── View: Ingest ─────────────────────────────────────────────────────────────

function ViewIngest({ onIngested }: { onIngested: () => void }): React.JSX.Element {
  const [label, setLabel] = useState('');
  const [source, setSource] = useState('paste');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function ingest(): Promise<void> {
    if (!label.trim() || !transcript.trim()) { setError('Label and transcript are required.'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/intel/ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), source, transcript }),
      });
      const data = await res.json() as { session: { id: number; label: string }; count: number };
      setResult(`Parsed ${data.count} execution units into session "${data.session.label}" (ID ${data.session.id}).`);
      setTranscript('');
      onIngested();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ingest failed.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4,
    color: C.text, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, overflowY: 'auto', flex: 1 }}>
      <SectionLabel text="Ingest Transcript" />
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
        Parse a conversation transcript into forensic execution units. Each exchange is analyzed for intent, deviation, and behavioral patterns.
      </p>
      <div style={{ marginBottom: 12 }}>
        <SectionLabel text="Session Label" />
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Claude Code Session 2026-06-03" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <SectionLabel text="Source" />
        <select value={source} onChange={e => setSource(e.target.value)} style={inputStyle}>
          <option value="paste">Paste</option>
          <option value="claude-code">Claude Code</option>
          <option value="chatgpt">ChatGPT</option>
          <option value="api-log">API Log</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <SectionLabel text="Transcript" />
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          rows={14}
          placeholder="Paste transcript here..."
          style={{ ...inputStyle, resize: 'vertical', fontFamily: C.mono, fontSize: 12 }}
        />
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 16, lineHeight: 1.6 }}>
        Accepted formats: Mark speaker turns with "User:" / "Assistant:" (also Human:/Claude:/Jay:/Agent:, or markdown ## User / **User**). Unmarked transcripts are stored as a single unit.
      </div>
      {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{error}</div>}
      {result && <div style={{ color: '#16a34a', fontSize: 13, marginBottom: 10, background: '#16a34a14', border: '1px solid #16a34a44', borderRadius: 4, padding: '8px 12px' }}>{result}</div>}
      <button onClick={() => { void ingest(); }} disabled={loading} style={btnStyle(C.gold, loading)}>
        {loading ? 'Analyzing...' : 'Ingest & Analyze'}
      </button>
    </div>
  );
}

// ─── View: Export ─────────────────────────────────────────────────────────────

function ViewExport({ sessionId, sessions }: { sessionId: number | null; sessions: SessionSummary[] }): React.JSX.Element {
  const session = sessions.find(s => s.id === sessionId);
  function download(withSession: boolean): void {
    const url = withSession && sessionId !== null ? `/api/intel/export?session_id=${sessionId}` : '/api/intel/export';
    const a = document.createElement('a');
    a.href = url;
    a.download = withSession && session ? `intel-${session.label.replace(/\s+/g, '_')}.jsonl` : 'intel-all.jsonl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <SectionLabel text="Export Training Dataset" />
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
        Export forensic records as JSONL — one record per line, suitable for fine-tuning LLMs on behavioral correction, instruction-following, and execution quality.
        Each line contains the full record including literal instruction, ideal execution, deviation analysis, and corrective actions.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => download(true)}
          disabled={sessionId === null}
          style={btnStyle(C.gold, sessionId === null)}
          title={sessionId === null ? 'Select a session first' : `Export session: ${session?.label ?? ''}`}
        >
          Export Current Session
          {session ? ` — ${session.label}` : ''}
        </button>
        <button onClick={() => download(false)} style={btnStyle('#16a34a', false)}>
          Export All Sessions
        </button>
      </div>
      {sessionId === null && (
        <p style={{ fontSize: 12, color: C.faint, marginTop: 12 }}>Select a session from the top bar to enable per-session export.</p>
      )}
    </div>
  );
}

// ─── Shared Utilities ─────────────────────────────────────────────────────────

function CenterMsg({ text }: { text: string }): React.JSX.Element {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.faint, fontSize: 14 }}>
      {text}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function IntelConsole(): React.JSX.Element {
  const [view, setView] = useState<ViewTab>('overview');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const fetchSessions = useCallback(async (): Promise<void> => {
    const res = await fetch('/api/intel/sessions');
    const data = await res.json() as SessionSummary[];
    setSessions(data);
  }, []);

  const fetchMetrics = useCallback(async (): Promise<void> => {
    setMetricsLoading(true);
    try {
      const params = sessionId !== null ? `?session_id=${sessionId}` : '';
      const res = await fetch(`/api/intel/metrics${params}`);
      const data = await res.json() as Metrics;
      setMetrics(data);
    } finally {
      setMetricsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    if (view === 'overview' || view === 'trends') void fetchMetrics();
  }, [view, fetchMetrics]);

  const TABS: { key: ViewTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'records', label: 'Records' },
    { key: 'heatmap', label: 'Heatmap' },
    { key: 'trends', label: 'Trends' },
    { key: 'ingest', label: 'Ingest' },
    { key: 'export', label: 'Export' },
  ];

  const tabBtn = (tab: ViewTab, label: string): React.JSX.Element => {
    const active = view === tab;
    return (
      <button
        key={tab}
        onClick={() => setView(tab)}
        style={{
          background: active ? C.gold + '22' : 'transparent',
          border: `1px solid ${active ? C.gold + '66' : 'transparent'}`,
          borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
          color: active ? C.gold : C.muted,
          padding: '6px 14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer',
          borderRadius: '4px 4px 0 0', textTransform: 'uppercase',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ height: '100%', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Bar */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: '12px 20px 0', flexShrink: 0, boxShadow: '0 1px 3px rgba(28,40,102,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text }}>
              Operational Intelligence
            </div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>
              interaction forensics · behavioral analytics · execution audit
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SectionLabel text="Session" />
            <select
              value={sessionId ?? ''}
              onChange={e => setSessionId(e.target.value === '' ? null : Number(e.target.value))}
              style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, padding: '5px 10px', fontSize: 13, minWidth: 180 }}
            >
              <option value="">All Sessions</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => tabBtn(t.key, t.label))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'overview' && <ViewOverview metrics={metrics} loading={metricsLoading} />}
        {view === 'records' && <ViewRecords sessionId={sessionId} />}
        {view === 'heatmap' && <ViewHeatmap sessionId={sessionId} />}
        {view === 'trends' && <ViewTrends metrics={metrics} loading={metricsLoading} />}
        {view === 'ingest' && <ViewIngest onIngested={() => { void fetchSessions(); }} />}
        {view === 'export' && <ViewExport sessionId={sessionId} sessions={sessions} />}
      </div>
    </div>
  );
}
