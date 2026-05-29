import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import HubLayout from '../layouts/HubLayout';
import Dashboard from '../modules/dashboard/Dashboard';
import ApiAssist from '../modules/apiassist/ApiAssist';
import MediaFiles from '../modules/files/MediaFiles';
import AgentBridges from '../modules/bridges/AgentBridges';
import EmailModule from '../modules/email/EmailModule';
import CalendarModule from '../modules/calendar/CalendarModule';
import TasksModule from '../modules/tasks/TasksModule';
import Blueprint from '../modules/blueprint/Blueprint';
import Systems from '../modules/systems/Systems';
function ComingSoon({ module }) {
    const labels = {
        dashboard: 'Dashboard',
        agenda: 'The Daily Agenda',
        crm: 'Contacts',
        todo: 'Tasks',
        calendar: 'Calendar',
        email: 'Email',
        files: 'Files',
        settings: 'Settings',
        apiassist: 'API Assist',
        'agent-bridges': 'Agent Bridges',
        operations: 'Operations',
        raven: 'Raven',
        daedalus: 'Daedalus',
        blueprint: 'Blueprint',
        systems: 'Systems',
        newspaper: 'Newspaper',
    };
    return (_jsxs("div", { style: { padding: '4rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#888' }, children: [_jsx("p", { style: { fontSize: '1.1rem', fontWeight: 600, color: '#111', margin: 0 }, children: labels[module] }), _jsx("p", { style: { fontSize: '0.875rem', margin: 0 }, children: "This module is coming soon." })] }));
}
export default function Hub({ brand, onBrandRefresh, onLogout }) {
    const [activeModule, setActiveModule] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);
    return (_jsxs(HubLayout, { activeModule: activeModule, onNavigate: (m) => setActiveModule(m), collapsed: collapsed, onToggle: () => setCollapsed(c => !c), brand: brand, onProfileSaved: onBrandRefresh, onLogout: onLogout, onOpenApiAssist: () => setActiveModule('apiassist'), children: [activeModule === 'dashboard' && _jsx(Dashboard, { brand: brand }), activeModule === 'apiassist' && _jsx(ApiAssist, {}), activeModule === 'files' && _jsx(MediaFiles, {}), activeModule === 'agent-bridges' && _jsx(AgentBridges, {}), activeModule === 'email' && _jsx(EmailModule, {}), activeModule === 'calendar' && _jsx(CalendarModule, {}), activeModule === 'todo' && _jsx(TasksModule, {}), activeModule === 'blueprint' && _jsx(Blueprint, {}), activeModule === 'systems' && _jsx(Systems, {}), activeModule !== 'dashboard' && activeModule !== 'apiassist' &&
                activeModule !== 'files' && activeModule !== 'agent-bridges' && activeModule !== 'email' &&
                activeModule !== 'calendar' && activeModule !== 'todo' &&
                activeModule !== 'blueprint' && activeModule !== 'systems' &&
                _jsx(ComingSoon, { module: activeModule })] }));
}
