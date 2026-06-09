import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const GOLD = '#c9a840';
// Knowledge graphs available to view. Each is a self-contained graphify
// graph.html served as a static asset from server/public/graphify/.
const GRAPHS = [
    { id: 'claude-bridge', label: 'claude-bridge', src: '/graphify/claude-bridge.html', nodes: 106, edges: 276 },
];
import { useState } from 'react';
export default function GraphifyModule() {
    const [active, setActive] = useState(GRAPHS[0].id);
    const graph = GRAPHS.find(g => g.id === active) ?? GRAPHS[0];
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: '1.25rem 1.5rem 1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }, children: [_jsx("h2", { style: { margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#111' }, children: "Graphify" }), _jsxs("span", { style: { fontSize: '0.85rem', color: '#777' }, children: ["Knowledge graph \u2014 ", graph.label, " \u00B7 ", graph.nodes, " nodes \u00B7 ", graph.edges, " edges"] }), _jsx("a", { href: graph.src, target: "_blank", rel: "noopener noreferrer", style: { marginLeft: 'auto', fontSize: '0.82rem', color: GOLD, textDecoration: 'none', fontWeight: 600 }, children: "Open full screen \u2197" })] }), GRAPHS.length > 1 && (_jsx("div", { style: { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }, children: GRAPHS.map(g => (_jsx("button", { onClick: () => setActive(g.id), style: {
                        padding: '0.35rem 0.8rem', borderRadius: 6, cursor: 'pointer',
                        fontSize: '0.82rem', fontWeight: g.id === active ? 700 : 400,
                        border: `1px solid ${g.id === active ? GOLD : '#ddd'}`,
                        background: g.id === active ? 'rgba(201,168,64,0.12)' : '#fff',
                        color: g.id === active ? '#7a6312' : '#555',
                    }, children: g.label }, g.id))) })), _jsx("div", { style: { flex: 1, minHeight: 0, border: `1px solid ${GOLD}55`, borderRadius: 8, overflow: 'hidden', background: '#fff' }, children: _jsx("iframe", { title: `Graphify knowledge graph — ${graph.label}`, src: graph.src, style: { width: '100%', height: '100%', border: 'none', display: 'block' } }, graph.id) })] }));
}
