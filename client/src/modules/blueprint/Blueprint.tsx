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

function buildBlueprint(answers: Record<string, string>, date: string): string {
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

function today(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

type Stage = 'interview' | 'review' | 'saved';

export default function Blueprint() {
  const [stage, setStage] = useState<Stage>('interview');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState('');
  const [blueprintText, setBlueprintText] = useState('');
  const [blueprintName, setBlueprintName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<{ id: number; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    } else {
      const text = buildBlueprint(updated, today());
      setBlueprintText(text);
      setBlueprintName(`Blueprint — ${today()}`);
      setStage('review');
    }
  }

  function handleBack() {
    if (step === 0) return;
    const layer = LAYERS[step - 1];
    setCurrent(answers[layer.id] ?? '');
    setStep(s => s - 1);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const listRes = await fetch('/api/files/nodes');
      const nodes: { id: number; parent_id: number | null; name: string; type: string }[] = await listRes.json();
      let folderId: number | null = null;
      const existing = nodes.find(n => n.type === 'folder' && n.parent_id == null && n.name.toLowerCase() === 'blueprint');
      if (existing) {
        folderId = existing.id;
      } else {
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
    } catch {
      alert('Save failed — check console.');
    } finally {
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
    return (
      <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: TEXT, margin: 0 }}>Blueprint saved</p>
        <p style={{ fontSize: '0.875rem', color: MUTED, margin: 0 }}>
          Saved as <strong style={{ color: TEXT }}>{savedNote?.name}</strong> in Files › blueprint
        </p>
        <button onClick={handleReset} style={btnStyle('secondary')}>New Blueprint</button>
      </div>
    );
  }

  if (stage === 'review') {
    return (
      <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 760 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Blueprint Name</p>
          <input
            value={blueprintName}
            onChange={e => setBlueprintName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Blueprint Content</p>
          <textarea
            value={blueprintText}
            onChange={e => setBlueprintText(e.target.value)}
            rows={28}
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', lineHeight: 1.65 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setStage('interview')} style={btnStyle('secondary')}>← Back</button>
          <button onClick={handleSave} disabled={saving} style={btnStyle('primary')}>
            {saving ? 'Saving…' : 'Save to Files'}
          </button>
        </div>
      </div>
    );
  }

  const layer = LAYERS[step];
  const progress = ((step) / LAYERS.length) * 100;

  return (
    <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 680 }}>
      {/* Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{layer.label}</span>
          <span style={{ fontSize: '0.75rem', color: MUTED }}>{step + 1} / {LAYERS.length}</span>
        </div>
        <div style={{ height: 3, background: BORDER, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: GOLD, borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Question */}
      <p style={{ fontSize: '1rem', color: TEXT, lineHeight: 1.65, margin: 0, fontWeight: 400 }}>
        {layer.question}
      </p>

      {/* Answer */}
      <textarea
        ref={textareaRef}
        value={current}
        onChange={e => setCurrent(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && current.trim()) handleNext(); }}
        rows={6}
        placeholder="Type your answer…"
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
      />

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {step > 0 && (
          <button onClick={handleBack} style={btnStyle('secondary')}>← Back</button>
        )}
        <button onClick={handleNext} disabled={!current.trim()} style={btnStyle('primary')}>
          {step < LAYERS.length - 1 ? 'Next →' : 'Review Blueprint'}
        </button>
        <span style={{ fontSize: '0.72rem', color: MUTED, marginLeft: 'auto' }}>⌘↵ to continue</span>
      </div>

      {/* Completed layers summary */}
      {step > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: `1px solid ${BORDER}`, paddingTop: '1.25rem' }}>
          {LAYERS.slice(0, step).map(l => (
            <div key={l.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.72rem', color: GOLD, fontWeight: 600, whiteSpace: 'nowrap', paddingTop: 2 }}>{l.label.split('—')[1]?.trim()}</span>
              <span style={{ fontSize: '0.78rem', color: MUTED, lineHeight: 1.5 }}>{answers[l.id]?.slice(0, 120)}{(answers[l.id]?.length ?? 0) > 120 ? '…' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
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

function btnStyle(variant: 'primary' | 'secondary'): React.CSSProperties {
  return variant === 'primary'
    ? { background: GOLD, color: DARK, border: 'none', borderRadius: 6, padding: '0.55rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }
    : { background: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '0.55rem 1.25rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' };
}
