import { useState, useEffect } from 'react';

const ACCENT = '#22d3ee';

interface Settings {
  system_prompt: string;
  persona_name: string;
  agentic_mode: string;
}

export default function MasterControls() {
  const [settings, setSettings] = useState<Settings>({ system_prompt: '', persona_name: 'Assistant', agentic_mode: 'manual' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/brain/settings')
      .then(r => r.json())
      .then((data: Settings) => { setSettings(data); setLoaded(true); })
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
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div style={{ color: 'rgba(248,250,252,0.3)', fontSize: '0.85rem' }}>Loading…</div>;

  const field = { label: { fontSize: '0.68rem', fontFamily: 'monospace' as const, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(248,250,252,0.4)', display: 'block', marginBottom: '0.5rem' } };
  const inputBase = { background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f8fafc', fontSize: '0.875rem', padding: '0.65rem 0.875rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Master Controls</h2>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)' }}>Set the global system prompt and persona for all BRAIN interactions.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={field.label}>Persona Name</label>
          <input
            type="text"
            value={settings.persona_name}
            onChange={e => setSettings(s => ({ ...s, persona_name: e.target.value }))}
            placeholder="e.g. Assistant, BRAIN, Jay's AI"
            style={inputBase}
          />
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'rgba(248,250,252,0.25)' }}>How the AI refers to itself in conversations.</p>
        </div>

        <div>
          <label style={field.label}>System Prompt</label>
          <textarea
            value={settings.system_prompt}
            onChange={e => setSettings(s => ({ ...s, system_prompt: e.target.value }))}
            placeholder="You are a helpful assistant. You are direct, concise, and technically precise..."
            rows={10}
            style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6, minHeight: '180px' }}
          />
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'rgba(248,250,252,0.25)' }}>
            Applied as the system context for all BRAIN chatbox conversations.
            {settings.system_prompt.length > 0 && ` ${settings.system_prompt.length} characters.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ background: saving ? '#1a2a2a' : ACCENT, border: 'none', borderRadius: '8px', color: saving ? 'rgba(248,250,252,0.3)' : '#0a0a0a', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: '0.6rem 1.75rem', transition: 'all 0.15s', letterSpacing: '0.03em' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && (
            <span style={{ color: '#22c55e', fontSize: '0.78rem' }}>✓ Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
