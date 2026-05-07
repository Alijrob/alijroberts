import { useState, useEffect } from 'react';



interface ConnectionDef {
  id: string;
  label: string;
  description: string;
  checkUrl?: string;
  color: string;
  status: 'checking' | 'online' | 'offline' | 'pending';
}

export default function Connections() {
  const [openclawStatus, setOpenclawStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? setOpenclawStatus('online') : setOpenclawStatus('offline'))
      .catch(() => setOpenclawStatus('offline'));
  }, []);

  const connections: ConnectionDef[] = [
    {
      id: 'openclaw',
      label: 'OpenClaw Gateway',
      description: 'Local agent runtime — enables terminal commands, file operations, and autonomous task execution via the openclaw-gateway service on this server.',
      color: openclawStatus === 'online' ? '#22c55e' : '#ef4444',
      status: openclawStatus,
    },
    {
      id: 'manus',
      label: 'Manus',
      description: 'Cloud-based autonomous agent. Executes long-running tasks, web research, and multi-step workflows independently.',
      color: '#555',
      status: 'pending',
    },
    {
      id: 'n8n',
      label: 'n8n Automation',
      description: 'Workflow automation engine. Exposes configured workflows as callable tools for Claude.',
      color: '#555',
      status: 'pending',
    },
    {
      id: 'postgres',
      label: 'PostgreSQL MCP',
      description: 'Direct database access via Model Context Protocol. Allows Claude to query and write to ajr_central DB.',
      color: '#555',
      status: 'pending',
    },
  ];

  const statusLabel = (s: ConnectionDef['status']) => {
    if (s === 'checking') return 'CHECKING';
    if (s === 'online') return 'CONNECTED';
    if (s === 'offline') return 'OFFLINE';
    return 'NOT CONFIGURED';
  };

  const statusColor = (s: ConnectionDef['status'], color: string) => {
    if (s === 'online') return color;
    if (s === 'offline') return '#ef4444';
    if (s === 'checking') return '#888';
    return 'rgba(248,250,252,0.2)';
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Connections</h2>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)' }}>Agent and automation integrations available to the Intelligence Layer.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {connections.map(c => (
          <div key={c.id} style={{ background: '#111', border: `1px solid ${c.status === 'online' ? c.color + '33' : '#1e1e1e'}`, borderRadius: '8px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <div style={{
                  marginTop: '4px', width: '8px', height: '8px', borderRadius: '50%',
                  background: c.status === 'checking' ? '#888' : c.status === 'online' ? c.color : c.status === 'offline' ? '#ef4444' : '#333',
                  boxShadow: c.status === 'online' ? `0 0 8px ${c.color}` : 'none',
                  flexShrink: 0,
                  animation: c.status === 'checking' ? 'pulse 1s ease-in-out infinite' : 'none',
                }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{c.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.4)', marginTop: '0.25rem', lineHeight: 1.5 }}>{c.description}</div>
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.08em', color: statusColor(c.status, c.color), flexShrink: 0 }}>
                {statusLabel(c.status)}
              </span>
            </div>
            {c.status === 'pending' && (
              <div style={{ marginTop: '0.75rem', padding: '0.4rem 0.75rem', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '4px', fontSize: '0.7rem', color: 'rgba(248,250,252,0.2)', fontFamily: 'monospace' }}>
                Configuration required — see PAGIOS reference docs
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.25)', marginBottom: '0.5rem' }}>Note</div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(248,250,252,0.35)', lineHeight: 1.6 }}>
          OpenClaw gateway runs as a systemd service on port 18793. Full wiring of agentic execution through BRAIN is scheduled for Phase C-4.
        </p>
      </div>
    </div>
  );
}
