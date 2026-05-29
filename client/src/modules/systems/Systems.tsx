import { useState } from 'react';
import AgentBridges from '../bridges/AgentBridges';
import ApiAssist from '../apiassist/ApiAssist';
import SidebarLinks from './SidebarLinks';

type Section = 'services' | 'bridges' | 'apikeys' | 'links';
type HostId = 'thoth' | 'zeus' | 'hostinger';

const GOLD = '#c9a840';
const BORDER = 'rgba(0,0,0,0.08)';
const TEXT = '#0d0d0d';
const TEXT_S = '#666';

type Service = {
  name: string;
  url?: string;
  port?: number | string;
  kind: 'web' | 'daemon' | 'db' | 'agent';
  blurb: string;
};

const HOSTS: { id: HostId; name: string; role: string; ip: string }[] = [
  { id: 'thoth',     name: 'THOTH',     role: 'Business assistant / PAGIOS ops',         ip: '148.230.93.77' },
  { id: 'zeus',      name: 'ZEUS',      role: 'Personal assistant / AJR Central Command', ip: '72.61.2.245' },
  { id: 'hostinger', name: 'Hostinger', role: 'PAGIOS client builds',                     ip: '147.93.119.147' },
];

const SERVICES: Record<HostId, Service[]> = {
  thoth: [
    { name: 'n8n (PAGIOS)',    url: 'https://n8n.pagios.org',     port: 5678,    kind: 'web',    blurb: 'Workflow automation for PAGIOS pipelines (Docker, nginx-proxied).' },
    { name: 'n8n (NB Roofs)',  url: 'https://n8n.nbroofscrm.com', port: 5688,    kind: 'web',    blurb: 'Workflow automation for NB Roofs (Docker, nginx-proxied).' },
    { name: 'Ollama',          port: '100.121.100.90:11434',                      kind: 'daemon', blurb: 'Local LLM server. THOTH-central per topology — ZEUS clients reach over Tailscale.' },
    { name: 'OpenClaw Gateway',port: 18793,                                       kind: 'agent',  blurb: 'Telegram-bridged OpenClaw assistant gateway (systemd).' },
    { name: 'PostgreSQL (pagios-db)', port: 5432,                                 kind: 'db',     blurb: 'pgvector/pg17 in Docker. Hosts pagios_crm and friends.' },
    { name: 'MariaDB',         port: 3306,                                        kind: 'db',     blurb: 'MariaDB instance on THOTH (loopback only).' },
    { name: 'PM2',                                                                kind: 'daemon', blurb: 'Hosts: raven-api, ibis-api, licencee-finder, intake-pipeline, daily-agenda-agent, daily-assistant-agent.' },
  ],
  zeus: [
    { name: 'n8n (AJR Central)',url: 'https://n8n.ajrcentralcommand.com', port: 5678,kind: 'web',  blurb: 'Workflow automation for AJR Central pipelines.' },
    { name: 'OpenClaw Gateway', port: 18793,                                       kind: 'agent', blurb: 'Telegram-bridged OpenClaw assistant gateway (systemd).' },
    { name: 'PostgreSQL',       port: 5432,                                        kind: 'db',    blurb: 'Primary Postgres. Hosts ajr_central, blueprint, daedalus, etc.' },
    { name: 'PM2',                                                                 kind: 'daemon',blurb: 'Hosts: alijroberts, ajr-central, dashboard-agent, alij-blueprint, das-daedalus, peer-relay, licencee-finder.' },
  ],
  hostinger: [
    { name: 'nbroofscrm.com',                url: 'https://nbroofscrm.com',                kind: 'web', blurb: 'NB Roofs realtor outreach CRM.' },
    { name: '4mybabyxo.com',                 url: 'https://4mybabyxo.com',                 kind: 'web', blurb: 'Daily Agenda Editor / hub-dashboard first deploy.' },
    { name: 'crm.privateicontractorvetting.com', url: 'https://crm.privateicontractorvetting.com', kind: 'web', blurb: 'Private-i contractor vetting CRM (Jay as first customer).' },
    { name: 'ibis.privateicontractorvetting.com', url: 'https://ibis.privateicontractorvetting.com', kind: 'web', blurb: 'IBIS for the Private-i brand.' },
    { name: 'ibis.researchyourdoctor.com',   url: 'https://ibis.researchyourdoctor.com',   kind: 'web', blurb: 'OPIMS / Research-Your-Doctor IBIS instance.' },
    { name: 'ibis.nbroofscrm.com',           url: 'https://ibis.nbroofscrm.com',           kind: 'web', blurb: 'NB Roofs IBIS instance.' },
    { name: 'ibis.ocalaperiocrm.com',        url: 'https://ibis.ocalaperiocrm.com',        kind: 'web', blurb: 'Ocala Perio IBIS (OPIMS-backed; ibis_ocala DB dropped 2026-05-27).' },
    { name: 'n8n', port: 5678, kind: 'web', blurb: 'n8n PM2 process. Loopback only — no public nginx route yet.' },
    { name: 'PostgreSQL',  port: 5432, kind: 'db',    blurb: 'Primary Postgres. Hosts client DBs.' },
    { name: 'PM2',                       kind: 'daemon',blurb: 'Hosts: nbroofs-crm, 4mybabyxo-api, alijroberts, das-platform, private-i, opims-api, ibis-privatei-api, ibis-ryd-api, ibis-themis-api, n8n, nbroofs-watchdog.' },
  ],
};

function kindColor(kind: Service['kind']) {
  switch (kind) {
    case 'web': return '#3b82f6';
    case 'agent': return '#8b5cf6';
    case 'db': return '#10b981';
    case 'daemon': return '#f59e0b';
  }
}

function ServiceCard({ svc }: { svc: Service }) {
  return (
    <div style={{
      border: `1px solid ${BORDER}`, borderRadius: 10, padding: '1rem 1.1rem',
      background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.55rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: kindColor(svc.kind) }} />
          <span style={{ fontWeight: 700, fontSize: '0.98rem', color: TEXT }}>{svc.name}</span>
        </div>
        <span style={{ fontSize: '0.66rem', color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{svc.kind}</span>
      </div>
      <div style={{ fontSize: '0.8rem', color: TEXT_S, lineHeight: 1.45 }}>{svc.blurb}</div>
      {svc.port != null && (
        <div style={{ fontSize: '0.76rem', color: TEXT_S }}>
          <strong style={{ color: TEXT }}>Port:</strong> {svc.port}
        </div>
      )}
      {svc.url && (
        <a href={svc.url} target="_blank" rel="noopener noreferrer" style={{
          marginTop: '0.3rem', alignSelf: 'flex-start', textDecoration: 'none',
          padding: '0.36rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
          background: GOLD, color: '#0d0d0d',
        }}>Open →</a>
      )}
    </div>
  );
}

function ServicesPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {HOSTS.map(host => (
        <section key={host.id}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: TEXT, letterSpacing: '0.02em' }}>{host.name}</h2>
            <span style={{ fontSize: '0.78rem', color: TEXT_S }}>{host.role}</span>
            <span style={{ fontSize: '0.74rem', color: TEXT_S, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{host.ip}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {SERVICES[host.id].map(svc => <ServiceCard key={svc.name} svc={svc} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Systems() {
  const [section, setSection] = useState<Section>('services');

  const tabs: { id: Section; label: string }[] = [
    { id: 'services', label: 'Services' },
    { id: 'bridges',  label: 'Bridges' },
    { id: 'apikeys',  label: 'API Keys' },
    { id: 'links',    label: 'Sidebar Links' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      <div style={{
        padding: '1.25rem 1.75rem 0', borderBottom: `1px solid ${BORDER}`,
        background: '#fff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.9rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: TEXT }}>Systems</h1>
          <span style={{ color: TEXT_S, fontSize: '0.85rem' }}>System info, integrations, and VPS-side tools.</span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {tabs.map(t => {
            const active = section === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSection(t.id)}
                style={{
                  padding: '0.55rem 1.1rem', fontSize: '0.92rem', fontWeight: active ? 700 : 500,
                  background: 'transparent', border: 'none',
                  borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
                  color: active ? TEXT : TEXT_S, cursor: 'pointer', transition: 'color 0.15s',
                }}
              >{t.label}</button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
        {section === 'services' && <ServicesPanel />}
        {section === 'bridges'  && <AgentBridges />}
        {section === 'apikeys'  && <ApiAssist />}
        {section === 'links'    && <SidebarLinks />}
      </div>
    </div>
  );
}
