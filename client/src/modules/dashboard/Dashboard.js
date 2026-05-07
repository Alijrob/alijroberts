import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MODULES = [
    {
        id: 'crm',
        label: 'CRM',
        description: 'Contacts, companies, activity log, and tags.',
        status: 'soon',
        icon: (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "9", cy: "7", r: "4" }), _jsx("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }), _jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })] })),
    },
    {
        id: 'todo',
        label: 'Todo',
        description: 'Tasks with due dates, linked to contacts.',
        status: 'soon',
        icon: (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "9 11 12 14 22 4" }), _jsx("path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" })] })),
    },
    {
        id: 'calendar',
        label: 'Calendar',
        description: 'Events, appointments, and schedule.',
        status: 'soon',
        icon: (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), _jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })] })),
    },
    {
        id: 'email',
        label: 'Email',
        description: 'Compose, receive, and thread management.',
        status: 'soon',
        icon: (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }), _jsx("polyline", { points: "22,6 12,13 2,6" })] })),
    },
    {
        id: 'openclaw',
        label: 'OpenClaw Bridge',
        description: 'Toggle-gated agent API bridge.',
        status: 'soon',
        icon: (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "16 18 22 12 16 6" }), _jsx("polyline", { points: "8 6 2 12 8 18" })] })),
    },
];
function greeting() {
    const h = new Date().getHours();
    if (h < 12)
        return 'Good morning';
    if (h < 17)
        return 'Good afternoon';
    return 'Good evening';
}
export default function Dashboard({ brand }) {
    const name = brand?.spaceName || brand?.displayName || '';
    return (_jsxs("div", { style: { padding: '2rem 2.5rem', maxWidth: '960px' }, children: [_jsxs("div", { style: { marginBottom: '2.5rem' }, children: [_jsxs("h1", { style: { fontSize: '1.65rem', fontWeight: 700, color: '#111', margin: 0, letterSpacing: '-0.02em' }, children: [greeting(), name ? `, ${name}` : '', "."] }), _jsx("p", { style: { fontSize: '0.875rem', color: '#888', margin: '0.35rem 0 0' }, children: "RAVEN command center \u2014 build in progress." })] }), _jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.75rem 1rem',
                    background: '#f9f6ee',
                    border: '1px solid #e8d98a',
                    borderRadius: '8px',
                    marginBottom: '2rem',
                }, children: [_jsx("div", { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 } }), _jsx("span", { style: { fontSize: '0.82rem', color: '#6b5b00', fontWeight: 500 }, children: "Hub shell live \u2014 Dashboard active. Additional modules building now." })] }), _jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '1rem',
                }, children: MODULES.map(mod => (_jsxs("div", { style: {
                        padding: '1.25rem',
                        background: '#fafafa',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("div", { style: { color: '#1c2866', display: 'flex' }, children: mod.icon }), _jsx("span", { style: {
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        padding: '2px 8px',
                                        borderRadius: '20px',
                                        background: '#f3f4f6',
                                        color: '#9ca3af',
                                        border: '1px solid #e5e7eb',
                                    }, children: "Coming soon" })] }), _jsxs("div", { children: [_jsx("p", { style: { fontSize: '0.95rem', fontWeight: 600, color: '#111', margin: 0 }, children: mod.label }), _jsx("p", { style: { fontSize: '0.8rem', color: '#888', margin: '0.2rem 0 0', lineHeight: 1.5 }, children: mod.description })] })] }, mod.id))) })] }));
}
