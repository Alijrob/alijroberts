interface DASStubProps {
  pack: string;
  phase: string;
  description: string;
  accent?: string;
}

export default function DASStub({ pack, phase, description, accent = '#7c3aed' }: DASStubProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
        <div style={{
          display: 'inline-block',
          background: `${accent}22`,
          border: `1px solid ${accent}44`,
          borderRadius: 6,
          padding: '4px 12px',
          marginBottom: '1.5rem',
        }}>
          <span style={{
            color: accent,
            fontSize: '0.68rem',
            fontFamily: 'monospace',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            DAS / {pack}
          </span>
        </div>

        <h1 style={{
          color: '#ffffff',
          fontSize: '2rem',
          fontWeight: 700,
          margin: '0 0 0.5rem',
          letterSpacing: '-0.02em',
        }}>
          {pack}
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem',
          margin: '0 0 2rem',
          lineHeight: 1.6,
        }}>
          {description}
        </p>

        <div style={{
          background: '#141414',
          border: '1px solid #222',
          borderRadius: 8,
          padding: '0.75rem 1.25rem',
          display: 'inline-block',
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.25)',
            fontSize: '0.78rem',
            fontFamily: 'monospace',
          }}>
            scaffold ready · migration in {phase}
          </span>
        </div>
      </div>
    </div>
  );
}
