import { useState, useEffect } from 'react';
import Chatbox from './Chatbox';
import ApiVault from './ApiVault';
import MasterControls from './MasterControls';
import AgenticMode from './AgenticMode';
import Connections from './Connections';
import WidgetStudio from './WidgetStudio';

type Section = 'chatbox' | 'vault' | 'controls' | 'agentic' | 'connections' | 'widget';

const ACCENT = '#22d3ee';
const SURFACE = '#111111';
const BORDER = '#1e1e1e';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'chatbox', label: 'Chatbox' },
  { id: 'vault', label: 'API Vault' },
  { id: 'controls', label: 'Master Controls' },
  { id: 'agentic', label: 'Agentic Mode' },
  { id: 'connections', label: 'Connections' },
  { id: 'widget', label: 'Widget Studio' },
];

export default function BrainApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>('chatbox');

  useEffect(() => {
    const token = localStorage.getItem('ajr_session_token') ?? '';
    if (!token) { window.location.href = '/operations/raven/login'; return; }
    fetch('/api/auth/session', { headers: { 'x-session-token': token } })
      .then(r => { if (r.ok) setAuthed(true); else window.location.href = '/operations/raven/login'; })
      .catch(() => { window.location.href = '/operations/raven/login'; });
  }, []);

  if (authed === null) {
    return <div style={{ minHeight: '100vh', background: '#0a0a0a' }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f8fafc' }}>
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '0 1.5rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}33`, borderRadius: '4px', padding: '2px 8px' }}>
            <span style={{ color: ACCENT, fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>DAS / BRAIN</span>
          </div>
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>Intelligence Layer</span>
        </div>
        <a href="/operations/raven/hub" style={{ color: 'rgba(248,250,252,0.3)', fontSize: '0.78rem', textDecoration: 'none', transition: 'color 0.15s' }}>← RAVEN Hub</a>
      </div>

      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '0 1.5rem', display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.75rem 1rem', fontSize: '0.82rem',
              fontWeight: section === s.id ? 600 : 400,
              color: section === s.id ? ACCENT : 'rgba(248,250,252,0.4)',
              borderBottom: section === s.id ? `2px solid ${ACCENT}` : '2px solid transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
        {section === 'chatbox' && <Chatbox />}
        {section === 'vault' && <ApiVault />}
        {section === 'controls' && <MasterControls />}
        {section === 'agentic' && <AgenticMode />}
        {section === 'connections' && <Connections />}
        {section === 'widget' && <WidgetStudio />}
      </div>
    </div>
  );
}
