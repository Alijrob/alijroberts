import { useEffect, useState } from 'react';

// Main-panel listing for the shared Projects store. Reads /api/projects
// (same-origin on raven). Each project shows its intake fields plus any
// GitHub artifacts /project-setup has back-filled.

const GOLD = '#c9a840';

type Phase = { n?: number; name?: string; done?: boolean };
type Project = {
  id: number;
  name: string;
  description: string | null;
  goal: string | null;
  stack: string | null;
  target: string | null;
  repo_strategy: string;
  repo_url: string | null;
  tracker_url: string | null;
  phases: Phase[] | null;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#c9a840',
  active: '#4caf50',
  archived: 'rgba(255,255,255,0.4)',
};

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((rows: Project[]) => { setProjects(rows); setLoading(false); })
      .catch(e => { setError(String(e.message || e)); setLoading(false); });
  }, []);

  return (
    <div style={{ padding: '2rem 2.5rem', color: 'rgba(255,255,255,0.85)' }}>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem', color: '#fff' }}>Projects</h1>

      {loading && <p style={{ color: 'rgba(255,255,255,0.45)' }}>Loading...</p>}
      {error && <p style={{ color: '#ff8080' }}>Could not load projects: {error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.45)' }}>No projects yet. Use "+ New Project" in the sidebar to create one.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '1rem 1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>{p.name}</h2>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: STATUS_COLORS[p.status] || GOLD }}>{p.status}</span>
            </div>
            {p.description && <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>{p.description}</p>}
            {p.goal && <p style={{ margin: '0.4rem 0 0', fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)' }}><strong style={{ color: 'rgba(255,255,255,0.65)' }}>Goal:</strong> {p.goal}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1.2rem', margin: '0.6rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
              {p.stack && <span>Stack: {p.stack}</span>}
              {p.target && <span>Target: {p.target}</span>}
              <span>Repo: {p.repo_strategy}</span>
            </div>
            {(p.repo_url || p.tracker_url) && (
              <div style={{ display: 'flex', gap: '1rem', margin: '0.6rem 0 0', fontSize: '0.82rem' }}>
                {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>Repo</a>}
                {p.tracker_url && <a href={p.tracker_url} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>Tracker</a>}
              </div>
            )}
            {Array.isArray(p.phases) && p.phases.length > 0 && (
              <p style={{ margin: '0.55rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                Phases: {p.phases.map(ph => ph.name || `#${ph.n}`).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
