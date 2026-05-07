import { useState, useEffect } from 'react';

const ACCENT = '#22d3ee';

interface WidgetStatus {
  version: string;
  deployedAt: string;
  activeClients: number;
}

export default function WidgetStudio() {
  const [status, setStatus] = useState<WidgetStatus | null>(null);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ version: string } | null>(null);

  const load = () => {
    fetch('/api/brain/widget-status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const pushUpdate = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/brain/widget-push', { method: 'POST' });
      const data = await res.json() as { version: string; deployedAt: string; activeClients?: number };
      setPushResult({ version: data.version });
      setStatus(s => s ? { ...s, version: data.version, deployedAt: data.deployedAt } : null);
      setTimeout(() => setPushResult(null), 4000);
    } finally {
      setPushing(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Widget Studio</h2>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(248,250,252,0.4)' }}>
          Manage the DAEDALUS embed widget — push version updates to all deployed clients.
        </p>
      </div>

      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.3)', marginBottom: '1.25rem' }}>Current State</div>

        {!status ? (
          <div style={{ color: 'rgba(248,250,252,0.3)', fontSize: '0.85rem' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.35)', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Version</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: ACCENT, fontFamily: 'monospace' }}>v{status.version}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.35)', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Clients</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>{status.activeClients}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.35)', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Last Deployed</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(248,250,252,0.55)' }}>{formatDate(status.deployedAt)}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.78rem', color: 'rgba(248,250,252,0.5)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          Pushing an update bumps the patch version. All deployed embed widgets will load the new version on their next page load — no client action required.
        </div>
        <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(248,250,252,0.2)' }}>
          Snippet URL: <span style={{ color: ACCENT }}>ajrcentralcommand.com/operations/daedalus/embed.js</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={pushUpdate}
          disabled={pushing || !status}
          style={{ background: pushing ? '#1a2a2a' : ACCENT, border: 'none', borderRadius: '8px', color: pushing ? 'rgba(248,250,252,0.3)' : '#0a0a0a', cursor: pushing || !status ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: '0.65rem 1.75rem', transition: 'all 0.15s', letterSpacing: '0.03em' }}>
          {pushing ? 'Pushing…' : 'Push Update to All Clients'}
        </button>
        {pushResult && (
          <span style={{ color: '#22c55e', fontSize: '0.78rem' }}>✓ Updated to v{pushResult.version}</span>
        )}
      </div>
    </div>
  );
}
