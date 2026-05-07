import { useState } from 'react';

const BG = '#080a12';
const SURFACE = '#0d0f1a';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#f0f2ff';
const TEXT_S = 'rgba(240,242,255,0.45)';

interface Module {
  key: string;
  label: string;
  sub: string;
  desc: string;
  accent: string;
  href: string;
  status: 'live' | 'coming';
}

const MODULES: Module[] = [
  {
    key: 'raven',
    label: 'RAVEN',
    sub: 'Operations Hub',
    desc: 'Hub, calendar, contacts, files, CRM core, todo',
    accent: '#c9a840',
    href: '/operations/raven/hub',
    status: 'live',
  },
  {
    key: 'brain',
    label: 'BRAIN',
    sub: 'Intelligence Layer',
    desc: 'Chatbot, LLM selection, API vault, agentic controls',
    accent: '#22d3ee',
    href: '/brain',
    status: 'live',
  },
  {
    key: 'daedalus',
    label: 'DAEDALUS',
    sub: 'AI Tools',
    desc: 'Embed system, terminal, notes, file storage',
    accent: '#a78bfa',
    href: '/operations/daedalus',
    status: 'live',
  },
  {
    key: 'platform',
    label: 'PLATFORM',
    sub: 'Avatar Factory',
    desc: 'Build, configure, and deploy client avatar sites',
    accent: '#7c3aed',
    href: '/platform',
    status: 'live',
  },
  {
    key: 'ibis',
    label: 'IBIS',
    sub: 'Business CRM',
    desc: 'Leads, pipeline, financials, client management',
    accent: '#34d399',
    href: '#',
    status: 'coming',
  },
];

interface Props {
  onLogout: () => void;
}

export default function FactoryPage({ onLogout }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui,-apple-system,sans-serif', color: TEXT }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 2.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,168,64,0.55)', fontWeight: 700 }}>
          AJR Central Command
        </div>
        <button
          onClick={onLogout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_S, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' }}
        >
          Sign Out
        </button>
      </div>

      {/* Module grid */}
      <div style={{ padding: 'clamp(2rem,5vw,4rem) clamp(1.5rem,5vw,3rem)', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT }}>
            Command Center
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: TEXT_S, fontSize: '0.9rem' }}>Select an operations pack to launch.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {MODULES.map(m => {
            const isHovered = hovered === m.key;
            const isComingSoon = m.status === 'coming';
            return (
              <a
                key={m.key}
                href={isComingSoon ? undefined : m.href}
                onMouseEnter={() => !isComingSoon && setHovered(m.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'block', textDecoration: 'none',
                  background: isHovered ? `${m.accent}0a` : SURFACE,
                  border: `1px solid ${isHovered ? m.accent + '33' : BORDER}`,
                  borderRadius: '10px', padding: '1.5rem',
                  cursor: isComingSoon ? 'default' : 'pointer',
                  transition: 'all 0.18s',
                  opacity: isComingSoon ? 0.45 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: m.accent, fontWeight: 700, marginBottom: '0.25rem' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.01em' }}>
                      {m.sub}
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isComingSoon ? BORDER : m.accent, marginTop: '0.25rem', flexShrink: 0, boxShadow: isComingSoon ? 'none' : `0 0 8px ${m.accent}66` }} />
                </div>
                <div style={{ fontSize: '0.82rem', color: TEXT_S, lineHeight: 1.6 }}>
                  {m.desc}
                </div>
                {isComingSoon && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_S }}>
                    Coming Soon
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
