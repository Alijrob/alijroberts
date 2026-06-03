import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
// Main-panel listing for the shared Projects store. Reads /api/projects
// (same-origin on raven). Each project shows its intake fields plus any
// GitHub artifacts /project-setup has back-filled.
const GOLD = '#c9a840';
const STATUS_COLORS = {
    pending: '#c9a840',
    active: '#4caf50',
    archived: 'rgba(255,255,255,0.4)',
};
export default function ProjectsView() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetch('/api/projects')
            .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
            .then((rows) => { setProjects(rows); setLoading(false); })
            .catch(e => { setError(String(e.message || e)); setLoading(false); });
    }, []);
    return (_jsxs("div", { style: { padding: '2rem 2.5rem', color: 'rgba(255,255,255,0.85)' }, children: [_jsx("h1", { style: { margin: '0 0 1.25rem', fontSize: '1.4rem', color: '#fff' }, children: "Projects" }), loading && _jsx("p", { style: { color: 'rgba(255,255,255,0.45)' }, children: "Loading..." }), error && _jsxs("p", { style: { color: '#ff8080' }, children: ["Could not load projects: ", error] }), !loading && !error && projects.length === 0 && (_jsx("p", { style: { color: 'rgba(255,255,255,0.45)' }, children: "No projects yet. Use \"+ New Project\" in the sidebar to create one." })), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.9rem' }, children: projects.map(p => (_jsxs("div", { style: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '1rem 1.15rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }, children: [_jsx("h2", { style: { margin: 0, fontSize: '1.05rem', color: '#fff' }, children: p.name }), _jsx("span", { style: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: STATUS_COLORS[p.status] || GOLD }, children: p.status })] }), p.description && _jsx("p", { style: { margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }, children: p.description }), p.goal && _jsxs("p", { style: { margin: '0.4rem 0 0', fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)' }, children: [_jsx("strong", { style: { color: 'rgba(255,255,255,0.65)' }, children: "Goal:" }), " ", p.goal] }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1.2rem', margin: '0.6rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }, children: [p.stack && _jsxs("span", { children: ["Stack: ", p.stack] }), p.target && _jsxs("span", { children: ["Target: ", p.target] }), _jsxs("span", { children: ["Repo: ", p.repo_strategy] })] }), (p.repo_url || p.tracker_url) && (_jsxs("div", { style: { display: 'flex', gap: '1rem', margin: '0.6rem 0 0', fontSize: '0.82rem' }, children: [p.repo_url && _jsx("a", { href: p.repo_url, target: "_blank", rel: "noopener noreferrer", style: { color: GOLD }, children: "Repo" }), p.tracker_url && _jsx("a", { href: p.tracker_url, target: "_blank", rel: "noopener noreferrer", style: { color: GOLD }, children: "Tracker" })] })), Array.isArray(p.phases) && p.phases.length > 0 && (_jsxs("p", { style: { margin: '0.55rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }, children: ["Phases: ", p.phases.map(ph => ph.name || `#${ph.n}`).join(', ')] }))] }, p.id))) })] }));
}
