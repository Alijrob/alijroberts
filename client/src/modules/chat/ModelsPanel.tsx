import { useState, useEffect } from 'react';

const NAVY = '#1c2866';

type Provider = 'claude' | 'gpt' | 'gemini' | 'grok';

const PROVIDER_KEY = 'chat_provider';

export function getStoredProvider(): Provider {
  return (localStorage.getItem(PROVIDER_KEY) as Provider) || 'claude';
}

export function setStoredProvider(p: Provider) {
  localStorage.setItem(PROVIDER_KEY, p);
  window.dispatchEvent(new CustomEvent('chat-provider-change', { detail: p }));
}

interface ProviderDef {
  id: Provider;
  label: string;
  vendor: string;
  model: string;
  modelFull: string;
  color: string;
  description: string;
  logo: React.ReactNode;
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'claude',
    label: 'Claude',
    vendor: 'Anthropic',
    model: 'Haiku 4.5',
    modelFull: 'claude-haiku-4-5-20251001',
    color: '#D97706',
    description: 'Fast and efficient. Great for everyday tasks, writing, and nuanced instruction following.',
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#D97706" opacity="0.15"/>
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#D97706">C</text>
      </svg>
    ),
  },
  {
    id: 'gpt',
    label: 'GPT',
    vendor: 'OpenAI',
    model: 'GPT-4o mini',
    modelFull: 'gpt-4o-mini',
    color: '#16A34A',
    description: 'OpenAI\'s lightweight model. Strong reasoning, broad knowledge, reliable instruction following.',
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#16A34A" opacity="0.15"/>
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#16A34A">G</text>
      </svg>
    ),
  },
  {
    id: 'gemini',
    label: 'Gemini',
    vendor: 'Google',
    model: '2.0 Flash',
    modelFull: 'gemini-2.0-flash',
    color: '#2563EB',
    description: 'Google\'s multimodal model. Handles text and images with low latency and strong reasoning.',
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#2563EB" opacity="0.15"/>
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#2563EB">G</text>
      </svg>
    ),
  },
  {
    id: 'grok',
    label: 'Grok',
    vendor: 'xAI',
    model: 'Grok-3 Mini',
    modelFull: 'grok-3-mini',
    color: '#7C3AED',
    description: 'xAI\'s fast reasoning model. Direct, efficient responses with strong logical depth.',
    logo: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#7C3AED" opacity="0.15"/>
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#7C3AED">X</text>
      </svg>
    ),
  },
];

export default function ModelsPanel() {
  const [selected, setSelected] = useState<Provider>(getStoredProvider);
  const [keys, setKeys] = useState<Record<Provider, boolean>>({ claude: false, gpt: false, gemini: false, grok: false });
  const [keysLoaded, setKeysLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/apikeys')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setKeys({ claude: !!d.anthropic, gpt: !!d.openai, gemini: !!d.gemini, grok: !!d.grok });
      })
      .finally(() => setKeysLoaded(true));
  }, []);

  // Stay in sync if chat panel changes the provider
  useEffect(() => {
    const handler = (e: Event) => {
      setSelected((e as CustomEvent<Provider>).detail);
    };
    window.addEventListener('chat-provider-change', handler);
    return () => window.removeEventListener('chat-provider-change', handler);
  }, []);

  const select = (p: Provider) => {
    setSelected(p);
    setStoredProvider(p);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>Models</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
          Select the AI model used in the chat panel. Add API keys in <strong>API Assist</strong> to activate a provider.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {PROVIDERS.map(p => {
          const active = selected === p.id;
          const hasKey = keys[p.id];
          return (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                padding: '1.1rem 1.1rem 1rem',
                background: active ? `${NAVY}06` : '#fff',
                border: `2px solid ${active ? NAVY : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; }}
            >
              {/* Selected checkmark */}
              {active && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 20, height: 20, borderRadius: '50%',
                  background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${p.color}18`,
                  border: `1px solid ${p.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: p.color }}>{p.label[0]}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: active ? NAVY : '#111', lineHeight: 1.2 }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.2 }}>{p.vendor}</div>
                </div>
              </div>

              {/* Model name badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '2px 8px',
                  background: `${p.color}14`,
                  border: `1px solid ${p.color}28`,
                  borderRadius: 20,
                  fontSize: '0.68rem', fontWeight: 700,
                  color: p.color, letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}>
                  {p.model}
                </span>
                {keysLoaded && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    color: hasKey ? '#16a34a' : '#9ca3af',
                    display: 'flex', alignItems: 'center', gap: '3px',
                  }}>
                    {hasKey
                      ? <><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" fill="#16a34a" opacity="0.2"/><polyline points="2.5,6 5,8.5 9.5,3.5" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> Key set</>
                      : <><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#9ca3af" strokeWidth="1.2"/></svg> No key</>
                    }
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>
                {p.description}
              </p>

              {/* Full model ID */}
              <div style={{ fontSize: '0.62rem', color: '#d1d5db', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                {p.modelFull}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        padding: '0.85rem 1rem',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5,
      }}>
        <strong style={{ color: '#374151' }}>Active model:</strong>{' '}
        {PROVIDERS.find(p => p.id === selected)?.label} — {PROVIDERS.find(p => p.id === selected)?.modelFull}
        {!keys[selected] && keysLoaded && (
          <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
            · No API key — add one in API Assist to use this model.
          </span>
        )}
      </div>
    </div>
  );
}
