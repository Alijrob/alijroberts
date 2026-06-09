import { useState } from 'react';
import HubLayout, { type HubModule } from '../layouts/HubLayout';
import Dashboard from '../modules/dashboard/Dashboard';
import ApiAssist from '../modules/apiassist/ApiAssist';
import MediaFiles from '../modules/files/MediaFiles';
import AgentBridges from '../modules/bridges/AgentBridges';
import EmailModule from '../modules/email/EmailModule';
import CalendarModule from '../modules/calendar/CalendarModule';
import TasksModule from '../modules/tasks/TasksModule';
import Blueprint from '../modules/blueprint/Blueprint';
import Systems from '../modules/systems/Systems';
import SkillsModule from '../modules/skills/SkillsModule';
import ProjectsView from '../modules/projects/ProjectsView';
import PromptCenter from '../modules/prompts/PromptCenter';
import IntelConsole from '../modules/intel/IntelConsole';
import GraphifyModule from '../modules/memory/GraphifyModule';

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
    settings: 'Settings',
    apiassist: 'API Assist',
    'agent-bridges': 'Agent Bridges',
    operations: 'Operations',
    raven: 'Raven',
    daedalus: 'Daedalus',
    blueprint: 'Blueprint',
    systems: 'Systems',
    newspaper: 'Newspaper',
    projects: 'Projects',
    'project-new': 'New Project',
    skills: 'Skills',
    'prompt-library': 'Prompt Library',
    'prompt-lab': 'Prompt Lab',
    'prompt-fixes': 'Prompt Fixes',
    'prompt-intel': 'Operational Intelligence',
    'memory-obsidian': 'Obsidian',
    'memory-graphify': 'Graphify',
    'memory-moneta': 'MONETA',
  };
  return (
    <div style={{ padding: '4rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#888' }}>
      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111', margin: 0 }}>{labels[module]}</p>
      <p style={{ fontSize: '0.875rem', margin: 0 }}>This module is coming soon.</p>
    </div>
  );
}

export default function Hub({ brand, onBrandRefresh, onLogout }: Props) {
  const [activeModule, setActiveModule] = useState<HubModule>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const hash = window.location.hash.replace(/^#/, '');
    const valid: ReadonlyArray<HubModule> = ['dashboard','agenda','crm','todo','calendar','email','files','operations','raven','daedalus','blueprint','newspaper','settings','apiassist','agent-bridges','systems','projects','project-new','skills','prompt-library','prompt-lab','prompt-fixes','prompt-intel','memory-obsidian','memory-graphify','memory-moneta'];
    return (valid as readonly string[]).includes(hash) ? (hash as HubModule) : 'dashboard';
  });
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
      {activeModule === 'files'          && <MediaFiles />}
      {activeModule === 'agent-bridges'  && <AgentBridges />}
      {activeModule === 'email'          && <EmailModule />}
      {activeModule === 'calendar'       && <CalendarModule />}
      {activeModule === 'todo'           && <TasksModule />}
      {activeModule === 'blueprint'      && <Blueprint />}
      {activeModule === 'systems'        && <Systems />}
      {activeModule === 'skills'         && <SkillsModule />}
      {(activeModule === 'projects' || activeModule === 'project-new') && <ProjectsView />}
      {activeModule === 'prompt-library' && <PromptCenter bucket="library" />}
      {activeModule === 'prompt-lab'     && <PromptCenter bucket="lab" />}
      {activeModule === 'prompt-fixes'   && <PromptCenter bucket="fixes" />}
      {activeModule === 'prompt-intel'   && <IntelConsole />}
      {activeModule === 'memory-graphify' && <GraphifyModule />}
      {activeModule !== 'dashboard' && activeModule !== 'apiassist' &&
       activeModule !== 'files' && activeModule !== 'agent-bridges' && activeModule !== 'email' &&
       activeModule !== 'calendar' && activeModule !== 'todo' &&
       activeModule !== 'blueprint' && activeModule !== 'systems' && activeModule !== 'skills' &&
       activeModule !== 'projects' && activeModule !== 'project-new' &&
       activeModule !== 'prompt-library' && activeModule !== 'prompt-lab' && activeModule !== 'prompt-fixes' &&
       activeModule !== 'prompt-intel' && activeModule !== 'memory-graphify' &&
       <ComingSoon module={activeModule} />}
    </HubLayout>
  );
}
