import { useState } from 'react';
import HubLayout, { type HubModule } from '../layouts/HubLayout';
import Dashboard from '../modules/dashboard/Dashboard';
import ApiAssist from '../modules/apiassist/ApiAssist';
import Files from '../modules/files/Files';
import AgentBridges from '../modules/bridges/AgentBridges';
import EmailModule from '../modules/email/EmailModule';
import CalendarModule from '../modules/calendar/CalendarModule';
import TasksModule from '../modules/tasks/TasksModule';
import Canvas from '../modules/canvas/Canvas';
import Blueprint from '../modules/blueprint/Blueprint';

interface BrandData {
  displayName: string | null;
  spaceName: string | null;
  logoPath: string | null;
  brandLogoPath: string | null;
}

interface Props {
  brand: BrandData | null;
  onBrandRefresh: () => void;
  onLogout: () => void;
}

function ComingSoon({ module }: { module: HubModule }) {
  const labels: Record<HubModule, string> = {
    dashboard: 'Dashboard',
    agenda: 'The Daily Agenda',
    crm: 'Contacts',
    todo: 'Tasks',
    calendar: 'Calendar',
    email: 'Email',
    files: 'Files',
    canvas: 'Canvas',
    settings: 'Settings',
    apiassist: 'API Assist',
    'agent-bridges': 'Agent Bridges',
    operations: 'Operations',
    raven: 'Raven',
    daedalus: 'Daedalus',
    blueprint: 'Blueprint',
    newspaper: 'Newspaper',
  };
  return (
    <div style={{ padding: '4rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#888' }}>
      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111', margin: 0 }}>{labels[module]}</p>
      <p style={{ fontSize: '0.875rem', margin: 0 }}>This module is coming soon.</p>
    </div>
  );
}

export default function Hub({ brand, onBrandRefresh, onLogout }: Props) {
  const [activeModule, setActiveModule] = useState<HubModule>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <HubLayout
      activeModule={activeModule}
      onNavigate={(m) => setActiveModule(m)}
      collapsed={collapsed}
      onToggle={() => setCollapsed(c => !c)}
      brand={brand}
      onProfileSaved={onBrandRefresh}
      onLogout={onLogout}
      onOpenApiAssist={() => setActiveModule('apiassist')}
    >
      {activeModule === 'dashboard'      && <Dashboard brand={brand} />}
      {activeModule === 'apiassist'      && <ApiAssist />}
      {activeModule === 'files'          && <Files />}
      {activeModule === 'agent-bridges'  && <AgentBridges />}
      {activeModule === 'email'          && <EmailModule />}
      {activeModule === 'calendar'       && <CalendarModule />}
      {activeModule === 'todo'           && <TasksModule />}
      {activeModule === 'canvas'         && <Canvas />}
      {activeModule === 'blueprint'      && <Blueprint />}
      {activeModule !== 'dashboard' && activeModule !== 'apiassist' &&
       activeModule !== 'files' && activeModule !== 'agent-bridges' && activeModule !== 'email' &&
       activeModule !== 'calendar' && activeModule !== 'todo' && activeModule !== 'canvas' &&
       activeModule !== 'blueprint' &&
       <ComingSoon module={activeModule} />}
    </HubLayout>
  );
}
