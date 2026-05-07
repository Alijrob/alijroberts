import { useState, useEffect } from 'react';

const NAVY = '#1c2866';

interface ProviderConfig {
  label: string;
  color: string;
  model: string;
  docsUrl: string;
  keyUrl: string;
  keyHint: string;
  keyPrefix: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  anthropic: {
    label: 'Anthropic (Claude)',
    color: '#D97706',
    model: 'claude-haiku-4-5-20251001',
    docsUrl: 'https://docs.anthropic.com',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHint: 'Get your key at console.anthropic.com → Settings → API Keys',
    keyPrefix: 'sk-ant-',
  },
  openai: {
    label: 'OpenAI (GPT)',
    color: '#16A34A',
    model: 'gpt-4o-mini',
    docsUrl: 'https://platform.openai.com/docs',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'Get your key at platform.openai.com → API Keys',
    keyPrefix: 'sk-',
  },
  gemini: {
    label: 'Google (Gemini)',
    color: '#2563EB',
    model: 'gemini-2.0-flash',
    docsUrl: 'https://ai.google.dev/docs',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHint: 'Get your key at aistudio.google.com → Get API Key',
    keyPrefix: 'AIza',
  },
  grok: {
    label: 'xAI (Grok)',
    color: '#7C3AED',
    model: 'grok-3-mini',
    docsUrl: 'https://docs.x.ai',
    keyUrl: 'https://console.x.ai',
    keyHint: 'Get your key at console.x.ai → API Keys',
    keyPrefix: 'xai-',
  },
};

export default function ApiAssist() {
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [removing, setRemoving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/apikeys');
      if (res.ok) setConfigured(await res.json());
    } catch {}
  };

  const save = async (provider: string) => {
    const key = inputs[provider]?.trim();
    if (!key) { setErrors(e => ({ ...e, [provider]: 'Paste your API key above.' })); return; }
    setSaving(s => ({ ...s, [provider]: true }));
    setErrors(e => ({ ...e, [provider]: '' }));
    try {
      const res = await fetch(`/api/apikeys/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) { const d = await res.json(); setErrors(e => ({ ...e, [provider]: d.error || 'Save failed' })); return; }
      setConfigured(c => ({ ...c, [provider]: true }));
      setInputs(i => ({ ...i, [provider]: '' }));
      setSaved(s => ({ ...s, [provider]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [provider]: false })), 2000);
    } catch { setErrors(e => ({ ...e, [provider]: 'Connection error' })); }
    finally { setSaving(s => ({ ...s, [provider]: false })); }
  };

  const remove = async (provider: string) => {
    if (!confirm(`Remove the ${PROVIDERS[provider].label} API key?`)) return;
    setRemoving(r => ({ ...r, [provider]: true }));
    try {
      await fetch(`/api/apikeys/${provider}`, { method: 'DELETE' });
      setConfigured(c => ({ ...c, [provider]: false }));
    } catch {}
    finally { setRemoving(r => ({ ...r, [provider]: false })); }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 680, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', margin: '0 0 0.25rem' }}>API Assist</h2>
      <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 2rem' }}>
        Add your API keys for each AI provider. Keys are stored securely on your server and never exposed to the browser.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {Object.entries(PROVIDERS).map(([id, cfg]) => {
          const isConfigured = configured[id];
          return (
            <div key={id} style={{
              border: `1px solid ${isConfigured ? '#d1fae5' : '#e5e7eb'}`,
              borderRadius: 12,
              background: isConfigured ? '#f0fdf4' : '#fff',
              padding: '1.25rem',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{cfg.label}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Default model: {cfg.model}</p>
                </div>
                <div style={{
                  padding: '0.25rem 0.65rem', borderRadius: 20,
                  background: isConfigured ? '#dcfce7' : '#f3f4f6',
                  color: isConfigured ? '#16a34a' : '#9ca3af',
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                }}>
                  {isConfigured ? '✓ Connected' : 'Not configured'}
                </div>
              </div>

              {/* Key input */}
              {!isConfigured ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>{cfg.keyHint}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="password"
                      placeholder={`${cfg.keyPrefix}…`}
                      value={inputs[id] || ''}
                      onChange={e => setInputs(i => ({ ...i, [id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && save(id)}
                      style={{
                        flex: 1, padding: '0.55rem 0.85rem',
                        border: '1px solid #e0e0e0', borderRadius: 8,
                        fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace',
                        background: '#fafafa',
                      }}
                    />
                    <button
                      onClick={() => window.open(cfg.keyUrl, '_blank')}
                      style={{ padding: '0.55rem 0.85rem', background: '#f3f4f6', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}
                    >
                      Get key ↗
                    </button>
                    <button
                      onClick={() => save(id)}
                      disabled={saving[id]}
                      style={{
                        padding: '0.55rem 1rem', background: NAVY, color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: '0.85rem',
                        fontWeight: 600, cursor: saving[id] ? 'wait' : 'pointer',
                        opacity: saving[id] ? 0.7 : 1, whiteSpace: 'nowrap',
                      }}
                    >
                      {saving[id] ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  {errors[id] && <p style={{ margin: 0, fontSize: '0.78rem', color: '#dc2626' }}>{errors[id]}</p>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {saved[id] ? (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#16a34a', fontWeight: 600 }}>Key saved successfully.</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563' }}>API key is active. This provider is ready to use in Chat.</p>
                  )}
                  <button
                    onClick={() => remove(id)}
                    disabled={removing[id]}
                    style={{ padding: '0.35rem 0.75rem', background: 'none', border: '1px solid #fca5a5', borderRadius: 6, fontSize: '0.75rem', color: '#dc2626', cursor: 'pointer' }}
                  >
                    {removing[id] ? 'Removing…' : 'Remove key'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f8f8', borderRadius: 10, border: '1px solid #e8e8e8' }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#888', lineHeight: 1.6 }}>
          <strong style={{ color: '#555' }}>Security note:</strong> Keys are stored in your private database on ZEUS and are never sent to the browser. They are only used server-side when making LLM requests.
        </p>
      </div>
    </div>
  );
}
