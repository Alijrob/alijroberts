import { useState, useEffect } from 'react';

const ACCENT = '#22d3ee';

type Mode = 'manual' | 'orchestrated' | 'autonomous';

interface ModeOption {
  id: Mode;
  label: string;
  description: string;
  warning?: string;
  color: string;
}

const MODES: ModeOption[] = [
  {
    id: 'manual',
    label: 'Manual',
    description: 'Claude responds to your prompts. No autonomous actions. You execute everything yourself.',
    color: '#22c55e',
  },
  {
    id: 'orchestrated',
    label: 'Orchestrated',
    description: 'Claude plans multi-step tasks and presents each step for your approval before executing.',
    color: ACCENT,
  },
  {
    id: 'autonomous',
    label: 'Autonomous',
    description: 'Agents execute tasks without approval gates. Claude Code and OpenClaw act on your behalf.',
    warning: 'High-impact actions may execute automatically. Use with caution.',
    color: '#f97316',
  },
];

export default function AgenticMode() {
  const [mode, setMode] = useState<Mode>('manual');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/brain/settings')
      .then(r => r.json())
      .then((data: { agentic_mode: string }) => {
        if (['manual', 'orchestrated', 'autonomous'].includes(data.agentic_mode)) {
          setMode(data.agentic_mode as Mode);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/brain/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentic_mode: mode }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div style={{ color: 'rgba(248,250,252,0.3)', fontSize: '0.85rem' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Agentic Mode</h2>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)' }}>Control how much autonomy agents have when executing tasks.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {MODES.map(m => (
          <div
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              background: mode === m.id ? `${m.color}10` : '#111',
              border: `1px solid ${mode === m.id ? m.color + '44' : '#1e1e1e'}`,
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
            <div style={{ marginTop: '2px', width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${mode === m.id ? m.color : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {mode === m.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: mode === m.id ? m.color : '#f8fafc', marginBottom: '0.3rem' }}>{m.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', lineHeight: 1.5 }}>{m.description}</div>
              {m.warning && mode === m.id && (
                <div style={{ marginTop: '0.5rem', background: '#2a1a0a', border: '1px solid #f9731633', borderRadius: '4px', padding: '0.4rem 0.75rem', fontSize: '0.72rem', color: '#f97316' }}>
                  ⚠ {m.warning}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.3)', marginBottom: '0.75rem' }}>Activity Log</div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(248,250,252,0.2)', textAlign: 'center', padding: '1.5rem 0' }}>
          No agentic activity recorded. Activity will appear here when agents are active.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={save} disabled={saving} style={{ background: saving ? '#1a2a2a' : ACCENT, border: 'none', borderRadius: '8px', color: saving ? 'rgba(248,250,252,0.3)' : '#0a0a0a', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: '0.6rem 1.75rem', transition: 'all 0.15s' }}>
          {saving ? 'Saving…' : 'Save Mode'}
        </button>
        {saved && <span style={{ color: '#22c55e', fontSize: '0.78rem' }}>✓ Saved</span>}
      </div>
    </div>
  );
}
