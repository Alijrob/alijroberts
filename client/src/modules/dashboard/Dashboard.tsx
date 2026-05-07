interface BrandData {
  displayName: string | null;
  spaceName: string | null;
  logoPath: string | null;
}

interface Props {
  brand: BrandData | null;
}

const MODULES = [
  {
    id: 'crm',
    label: 'CRM',
    description: 'Contacts, companies, activity log, and tags.',
    status: 'soon' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'todo',
    label: 'Todo',
    description: 'Tasks with due dates, linked to contacts.',
    status: 'soon' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Events, appointments, and schedule.',
    status: 'soon' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Compose, receive, and thread management.',
    status: 'soon' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    id: 'openclaw',
    label: 'OpenClaw Bridge',
    description: 'Toggle-gated agent API bridge.',
    status: 'soon' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard({ brand }: Props) {
  const name = brand?.spaceName || brand?.displayName || '';

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: '960px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
          {greeting()}{name ? `, ${name}` : ''}.
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#888', margin: '0.35rem 0 0' }}>
          RAVEN command center — build in progress.
        </p>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.75rem 1rem',
        background: '#f9f6ee',
        border: '1px solid #e8d98a',
        borderRadius: '8px',
        marginBottom: '2rem',
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: '#6b5b00', fontWeight: 500 }}>
          Hub shell live — Dashboard active. Additional modules building now.
        </span>
      </div>

      {/* Module cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem',
      }}>
        {MODULES.map(mod => (
          <div
            key={mod.id}
            style={{
              padding: '1.25rem',
              background: '#fafafa',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#1c2866', display: 'flex' }}>{mod.icon}</div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '20px',
                background: '#f3f4f6',
                color: '#9ca3af',
                border: '1px solid #e5e7eb',
              }}>
                Coming soon
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111', margin: 0 }}>{mod.label}</p>
              <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.2rem 0 0', lineHeight: 1.5 }}>{mod.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
