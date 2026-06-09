const GOLD = '#c9a840';

// Knowledge graphs available to view. Each is a self-contained graphify
// graph.html served as a static asset from server/public/graphify/.
const GRAPHS: { id: string; label: string; src: string; nodes: number; edges: number }[] = [
  { id: 'claude-bridge', label: 'claude-bridge', src: '/graphify/claude-bridge.html', nodes: 106, edges: 276 },
];

import { useState } from 'react';

export default function GraphifyModule() {
  const [active, setActive] = useState(GRAPHS[0].id);
  const graph = GRAPHS.find(g => g.id === active) ?? GRAPHS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: '1.25rem 1.5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#111' }}>Graphify</h2>
        <span style={{ fontSize: '0.85rem', color: '#777' }}>
          Knowledge graph — {graph.label} · {graph.nodes} nodes · {graph.edges} edges
        </span>
        <a
          href={graph.src}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 'auto', fontSize: '0.82rem', color: GOLD, textDecoration: 'none', fontWeight: 600 }}
        >
          Open full screen ↗
        </a>
      </div>

      {GRAPHS.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {GRAPHS.map(g => (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              style={{
                padding: '0.35rem 0.8rem', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: g.id === active ? 700 : 400,
                border: `1px solid ${g.id === active ? GOLD : '#ddd'}`,
                background: g.id === active ? 'rgba(201,168,64,0.12)' : '#fff',
                color: g.id === active ? '#7a6312' : '#555',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, border: `1px solid ${GOLD}55`, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        <iframe
          key={graph.id}
          title={`Graphify knowledge graph — ${graph.label}`}
          src={graph.src}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    </div>
  );
}
