import { useEffect, useState } from 'react';
import { renderSidebarIcon } from '../modules/systems/sidebarIcons';
import ProfilePanel from '../components/hub/ProfilePanel';
import Chat from '../modules/chat/Chat';
import SettingsWindow, { type SettingsSection } from '../modules/settings/SettingsWindow';

export type HubModule = 'dashboard' | 'agenda' | 'crm' | 'todo' | 'calendar' | 'email' | 'files' | 'operations' | 'raven' | 'daedalus' | 'blueprint' | 'newspaper' | 'settings' | 'apiassist' | 'agent-bridges' | 'systems';

interface BrandData {
  displayName: string | null;
  spaceName: string | null;
  logoPath: string | null;
  brandLogoPath: string | null;
}

interface Props {
  activeModule: HubModule;
  onNavigate: (m: HubModule) => void;
  collapsed: boolean;
  onToggle: () => void;
  brand: BrandData | null;
  onProfileSaved: () => void;
  onLogout: () => void;
  onOpenApiAssist: () => void;
  children: React.ReactNode;
  hideDashboard?: boolean;
}

const GOLD = '#c9a840';
const METALLIC_GOLD = 'linear-gradient(90deg, #5c3d08 0%, #b8860b 20%, #f0d060 45%, #fffacd 55%, #f0d060 70%, #b8860b 85%, #5c3d08 100%)';
const METALLIC_GOLD_V = 'linear-gradient(180deg, #5c3d08 0%, #b8860b 20%, #f0d060 45%, #fffacd 55%, #f0d060 70%, #b8860b 85%, #5c3d08 100%)';
const SIDEBAR_W = 240;
const COLLAPSED_W = 66;
const TOPBAR_H = 96;
const CHAT_PANEL_H = 420;
const CHAT_INPUT_H = 90;

const DASHBOARD_CHILDREN: { id: HubModule; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'todo',
    label: 'Tasks',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'crm',
    label: 'Contacts',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

const DASHBOARD_IDS: HubModule[] = ['dashboard', 'todo', 'calendar', 'crm', 'email'];

const OPERATIONS_CHILDREN: { id: string; label: string; icon: React.ReactNode; href?: string }[] = [
  {
    id: 'raven',
    label: 'Raven',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
        <line x1="16" y1="8" x2="2" y2="22" />
        <line x1="17.5" y1="15" x2="9" y2="15" />
      </svg>
    ),
  },
  {
    id: 'newspaper',
    label: 'Newspaper',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <line x1="10" y1="7" x2="18" y2="7" />
        <line x1="10" y1="11" x2="18" y2="11" />
        <line x1="10" y1="15" x2="14" y2="15" />
      </svg>
    ),
  },
];

const OPERATIONS_IDS: HubModule[] = ['raven', 'newspaper'];

const SETTINGS_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

interface WeatherData { temp: number; label: string; }

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorm';
}

function useWeather(): WeatherData | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`
          );
          const data = await res.json();
          const cw = data.current_weather;
          if (cw) setWeather({ temp: Math.round(cw.temperature), label: weatherLabel(cw.weathercode) });
        } catch { /* silently fail */ }
      },
      () => { /* denied */ }
    );
  }, []);
  return weather;
}

export default function HubLayout({ activeModule, onNavigate, collapsed, onToggle, brand, onProfileSaved, onLogout, onOpenApiAssist, children, hideDashboard = false }: Props) {
  const [hubMenuOpen, setHubMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('security');
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [userLinks, setUserLinks] = useState<Array<{ id: number; label: string; url: string; icon_key: string }>>([]);
  useEffect(() => {
    fetch('/api/sidebar-links').then(r => r.ok ? r.json() : []).then(setUserLinks).catch(() => setUserLinks([]));
  }, []);
  const openSettings = (section: SettingsSection) => {
    setSettingsSection(section);
    setSettingsOpen(true);
  };

  const now = useClock();
  const windowWidth = useWindowWidth();
  const weather = useWeather();
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const sidebarWidth = collapsed ? COLLAPSED_W : SIDEBAR_W;
  const chatPanelHeight = chatOpen ? CHAT_PANEL_H : CHAT_INPUT_H;
  const logoUrl = brand?.brandLogoPath ? `/uploads/${brand.brandLogoPath}` : '/uploads/raven.png';
  const profileUrl = brand?.logoPath ? `/uploads/${brand.logoPath}` : null;
  const userName = brand?.displayName || '';
  const siteName = 'Command Center';

  const timeStr = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const isDashboardActive = DASHBOARD_IDS.includes(activeModule);
  const isOperationsActive = OPERATIONS_IDS.includes(activeModule);

  const textureLayers = (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/uploads/raven.png')", backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,12,35,0.96)', zIndex: 1 }} />
    </>
  );

  const navItemStyle = (id: string): React.CSSProperties => {
    const isActive = activeModule === id;
    const isHovered = hoveredItem === id;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      padding: collapsed ? '0.8rem 0' : '0.8rem 1.1rem',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: isActive ? 'rgba(201,168,64,0.16)' : isHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
      border: 'none',
      borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
      color: isActive ? GOLD : 'rgba(255,255,255,0.82)',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: isActive ? 700 : 400,
      width: '100%',
      textAlign: 'left' as const,
      transition: 'background 0.15s, color 0.15s',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      letterSpacing: '0.01em',
    };
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* TOP BAR */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: `${TOPBAR_H}px`,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        paddingLeft: 0,
        paddingRight: '1.75rem',
        zIndex: 200,
        overflow: 'hidden',
      }}>
        {textureLayers}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '5px', background: METALLIC_GOLD, zIndex: 3 }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'stretch', height: '100%' }}>
          <img src={logoUrl} alt="logo" style={{
            height: `${TOPBAR_H}px`, width: `${sidebarWidth}px`, objectFit: 'cover', display: 'block',
            filter: 'drop-shadow(0 0 12px rgba(201,168,64,0.7)) drop-shadow(0 0 24px rgba(201,168,64,0.35))',
            borderWidth: '0 5px 0 0', borderStyle: 'solid',
            borderImage: 'linear-gradient(180deg, #5c3d08 0%, #b8860b 20%, #f0d060 45%, #fffacd 55%, #f0d060 70%, #b8860b 85%, #5c3d08 100%) 1',
          }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <span style={{
            background: 'linear-gradient(180deg, #fff5a8 0%, #f0d060 28%, #c9a840 52%, #8b6008 72%, #c9a840 88%, #fff5a8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 8px rgba(201,168,64,0.85)) drop-shadow(0 0 18px rgba(201,168,64,0.45))',
            fontWeight: 800, fontStyle: 'italic',
            fontSize: isMobile ? '0.82rem' : isTablet ? '1.15rem' : '1.6rem',
            letterSpacing: isMobile ? '0.03em' : '0.06em',
            textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'inline-block',
          }}>{siteName}</span>
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: isMobile ? '0.82rem' : '1.05rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: isMobile ? '0.68rem' : '0.82rem' }}>{dateStr}</span>
          {weather && (
            <span style={{ color: 'rgba(201,168,64,0.85)', fontSize: isMobile ? '0.68rem' : '0.78rem', fontWeight: 500 }}>
              {weather.temp}°F · {weather.label}
            </span>
          )}
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{
        position: 'fixed', top: `${TOPBAR_H}px`, left: 0, bottom: 0,
        width: `${sidebarWidth}px`,
        display: 'flex', flexDirection: 'column',
        zIndex: 100, transition: 'width 0.22s ease', overflow: 'hidden',
      }}>
        {textureLayers}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '5px', background: METALLIC_GOLD_V, zIndex: 3 }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'flex-end', padding: '0.6rem 0.6rem 0' }}>
          <button onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'} style={{
            background: `rgba(201,168,64,0.14)`, border: `1px solid ${GOLD}44`, borderRadius: '50%',
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: GOLD, fontSize: '1rem', lineHeight: 1, flexShrink: 0, transition: 'background 0.15s',
          }}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem 0 0.5rem', gap: '0.4rem' }}>
          <button onClick={() => setProfileOpen(true)} title="View profile" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            {profileUrl ? (
              <img src={profileUrl} alt="profile" style={{
                width: collapsed ? '50px' : '76px', height: collapsed ? '50px' : '76px',
                borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}88`,
                boxShadow: `0 0 14px rgba(201,168,64,0.35)`, transition: 'width 0.22s, height 0.22s',
              }} />
            ) : (
              <div style={{
                width: collapsed ? '50px' : '76px', height: collapsed ? '50px' : '76px',
                borderRadius: '50%', background: `${GOLD}22`, border: `2px solid ${GOLD}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.22s, height 0.22s',
              }}>
                <span style={{ color: GOLD, fontSize: collapsed ? '1.1rem' : '1.6rem', fontWeight: 700 }}>
                  {userName.charAt(0).toUpperCase() || 'J'}
                </span>
              </div>
            )}
            {!collapsed && userName && (
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.08rem', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </span>
            )}
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 2, height: '1px', background: `${GOLD}22`, margin: '0 0.75rem 0.25rem' }} />

        <nav style={{ position: 'relative', zIndex: 2, flex: 1, padding: '0.25rem 0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {!hideDashboard && (
            <>
              {/* The Daily Agenda */}
              <button
                onClick={() => onNavigate('agenda')}
                onMouseEnter={() => setHoveredItem('agenda')}
                onMouseLeave={() => setHoveredItem(null)}
                title={collapsed ? 'The Daily Agenda' : undefined}
                style={navItemStyle('agenda')}
              >
                <span style={{ flexShrink: 0, display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="8" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="13" y2="18" />
                  </svg>
                </span>
                {!collapsed && <span>The Daily Agenda</span>}
              </button>

              {/* Dashboard group (dropdown) */}
              <button
                onClick={() => collapsed ? onNavigate('dashboard') : setDashboardOpen(o => !o)}
                onMouseEnter={() => setHoveredItem('dashboard-group')}
                onMouseLeave={() => setHoveredItem(null)}
                title={collapsed ? 'Dashboard' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: collapsed ? '0.8rem 0' : '0.8rem 1.1rem',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  background: isDashboardActive ? 'rgba(201,168,64,0.16)' : hoveredItem === 'dashboard-group' ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: 'none',
                  borderLeft: isDashboardActive ? `3px solid ${GOLD}` : '3px solid transparent',
                  color: isDashboardActive ? GOLD : 'rgba(255,255,255,0.82)',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: isDashboardActive ? 700 : 400,
                  width: '100%', textAlign: 'left', transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ flexShrink: 0, display: 'flex' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </span>
                  {!collapsed && <span>Dashboard</span>}
                </div>
                {!collapsed && <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{dashboardOpen ? '▲' : '▼'}</span>}
              </button>

              {dashboardOpen && !collapsed && (
                <>
                  {DASHBOARD_CHILDREN.map(item => {
                    const isActive = activeModule === item.id;
                    const isHov = hoveredItem === `dash-${item.id}`;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        onMouseEnter={() => setHoveredItem(`dash-${item.id}`)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.65rem 1.1rem 0.65rem 2.2rem',
                          background: isActive ? 'rgba(201,168,64,0.14)' : isHov ? 'rgba(255,255,255,0.05)' : 'transparent',
                          border: 'none',
                          borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                          color: isActive ? GOLD : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer', fontSize: '0.92rem', fontWeight: isActive ? 700 : 400,
                          width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}


          {/* Operations group (dropdown) */}
          <button
            onClick={() => collapsed ? onNavigate('operations') : setOperationsOpen(o => !o)}
            onMouseEnter={() => setHoveredItem('operations-group')}
            onMouseLeave={() => setHoveredItem(null)}
            title={collapsed ? 'Operations' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: collapsed ? '0.8rem 0' : '0.8rem 1.1rem',
              justifyContent: collapsed ? 'center' : 'space-between',
              background: isOperationsActive ? 'rgba(201,168,64,0.16)' : hoveredItem === 'operations-group' ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: 'none',
              borderLeft: isOperationsActive ? `3px solid ${GOLD}` : '3px solid transparent',
              color: isOperationsActive ? GOLD : 'rgba(255,255,255,0.82)',
              cursor: 'pointer', fontSize: '1rem', fontWeight: isOperationsActive ? 700 : 400,
              width: '100%', textAlign: 'left', transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span style={{ flexShrink: 0, display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </span>
              {!collapsed && <span>Operations</span>}
            </div>
            {!collapsed && <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{operationsOpen ? '▲' : '▼'}</span>}
          </button>

          {operationsOpen && !collapsed && (
            <>
              {OPERATIONS_CHILDREN.map(item => {
                const isActive = activeModule === item.id;
                const isHov = hoveredItem === `ops-${item.id}`;
                const baseStyle: React.CSSProperties = {
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.65rem 1.1rem 0.65rem 2.2rem',
                  background: isActive ? 'rgba(201,168,64,0.14)' : isHov ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                  color: isActive ? GOLD : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer', fontSize: '0.92rem', fontWeight: isActive ? 700 : 400,
                  width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s',
                  textDecoration: 'none',
                };
                if (item.href) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHoveredItem(`ops-${item.id}`)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={baseStyle}
                    >
                      <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  );
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => window.location.href = '/' + item.id}
                    onMouseEnter={() => setHoveredItem(`ops-${item.id}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={baseStyle}
                  >
                    <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {userLinks.map(link => {
                const isHov = hoveredItem === `ops-user-${link.id}`;
                return (
                  <a
                    key={`user-${link.id}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHoveredItem(`ops-user-${link.id}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.65rem 1.1rem 0.65rem 2.2rem',
                      background: isHov ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: 'none', borderLeft: '3px solid transparent',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer', fontSize: '0.92rem', fontWeight: 400,
                      width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
                      transition: 'background 0.15s, color 0.15s',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ flexShrink: 0, display: 'flex' }}>{renderSidebarIcon(link.icon_key)}</span>
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </>
          )}

          {/* Files */}
          <button
            onClick={() => onNavigate('files')}
            onMouseEnter={() => setHoveredItem('files')}
            onMouseLeave={() => setHoveredItem(null)}
            title={collapsed ? 'Files' : undefined}
            style={navItemStyle('files')}
          >
            <span style={{ flexShrink: 0, display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            {!collapsed && <span>Files</span>}
          </button>

        </nav>

        {/* Menu (bottom) */}
        <div style={{ position: 'relative', zIndex: 2, borderTop: `1px solid ${GOLD}33` }}>
          {hubMenuOpen && !collapsed && (
            <div style={{ background: 'rgba(0,0,0,0.28)', borderBottom: `1px solid ${GOLD}22` }}>
              <button
                onClick={() => { openSettings('security'); setHubMenuOpen(false); }}
                onMouseEnter={() => setHoveredItem('settings-sub')}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.75rem 1.1rem 0.75rem 1.6rem',
                  background: hoveredItem === 'settings-sub' ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderLeft: '3px solid transparent',
                  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '1rem', fontWeight: 400,
                  width: '100%', textAlign: 'left', whiteSpace: 'nowrap', transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex' }}>{SETTINGS_ICON}</span>
                <span>Settings</span>
              </button>
              <button
                onClick={() => { openSettings('chat'); setHubMenuOpen(false); }}
                onMouseEnter={() => setHoveredItem('chatbot-settings-sub')}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.75rem 1.1rem 0.75rem 1.6rem',
                  background: hoveredItem === 'chatbot-settings-sub' ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderLeft: '3px solid transparent',
                  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '1rem', fontWeight: 400,
                  width: '100%', textAlign: 'left', whiteSpace: 'nowrap', transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </span>
                <span>Chatbot Settings</span>
              </button>
              <button
                onClick={() => { onNavigate('apiassist'); setHubMenuOpen(false); }}
                onMouseEnter={() => setHoveredItem('apiassist-sub')}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.75rem 1.1rem 0.75rem 1.6rem',
                  background: activeModule === 'apiassist' ? 'rgba(201,168,64,0.14)' : hoveredItem === 'apiassist-sub' ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderLeft: activeModule === 'apiassist' ? `3px solid ${GOLD}` : '3px solid transparent',
                  color: activeModule === 'apiassist' ? GOLD : 'rgba(255,255,255,0.75)',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: activeModule === 'apiassist' ? 700 : 400,
                  width: '100%', textAlign: 'left', whiteSpace: 'nowrap', transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </span>
                <span>API Assist</span>
              </button>
              <button
                onClick={() => { onNavigate('systems'); setHubMenuOpen(false); }}
                onMouseEnter={() => setHoveredItem('systems-sub')}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.75rem 1.1rem 0.75rem 1.6rem',
                  background: activeModule === 'systems' ? 'rgba(201,168,64,0.14)' : hoveredItem === 'systems-sub' ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderLeft: activeModule === 'systems' ? `3px solid ${GOLD}` : '3px solid transparent',
                  color: activeModule === 'systems' ? GOLD : 'rgba(255,255,255,0.75)',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: activeModule === 'systems' ? 700 : 400,
                  width: '100%', textAlign: 'left', whiteSpace: 'nowrap', transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="6" rx="1"/>
                    <rect x="2" y="15" width="20" height="6" rx="1"/>
                    <line x1="6" y1="6" x2="6.01" y2="6"/>
                    <line x1="6" y1="18" x2="6.01" y2="18"/>
                  </svg>
                </span>
                <span>Systems</span>
              </button>
              <button
                onClick={() => { setHubMenuOpen(false); onLogout(); }}
                onMouseEnter={() => setHoveredItem('logout-sub')}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.75rem 1.1rem 0.75rem 1.6rem',
                  background: hoveredItem === 'logout-sub' ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderLeft: '3px solid transparent',
                  color: 'rgba(255,100,100,0.8)', cursor: 'pointer', fontSize: '1rem', fontWeight: 400,
                  width: '100%', textAlign: 'left', whiteSpace: 'nowrap', transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                <span>Logout</span>
              </button>
            </div>
          )}

          <button
            onClick={() => !collapsed && setHubMenuOpen(o => !o)}
            title={collapsed ? 'Menu' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: collapsed ? '0.9rem 0' : '0.9rem 1.1rem',
              justifyContent: collapsed ? 'center' : 'space-between',
              background: hubMenuOpen && !collapsed ? 'rgba(201,168,64,0.1)' : 'transparent',
              border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              fontSize: '0.88rem', fontWeight: 600, width: '100%', textAlign: 'left',
              letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              {!collapsed && <span>Menu</span>}
            </div>
            {!collapsed && <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>{hubMenuOpen ? '▲' : '▼'}</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{
        position: 'fixed', top: `${TOPBAR_H}px`, left: `${sidebarWidth}px`,
        right: 0, bottom: `${chatPanelHeight}px`, background: '#ffffff', overflowY: 'auto',
        transition: 'left 0.22s ease, bottom 0.22s ease',
      }}>
        {children}
      </div>

      {/* CHAT PANEL */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: `${sidebarWidth}px`,
        right: 0,
        height: `${chatPanelHeight}px`,
        background: '#fff',
        borderTop: '3px solid transparent',
        borderImage: METALLIC_GOLD + ' 1',
        zIndex: 50,
        overflow: 'hidden',
        transition: 'left 0.22s ease, height 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Chat
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen(o => !o)}
          historyOpen={chatHistoryOpen}
          onToggleHistory={() => setChatHistoryOpen(o => !o)}
          onOpenApiAssist={onOpenApiAssist}
          onOpenChatSettings={() => openSettings('chat')}
        />
      </div>

      {profileOpen && (
        <ProfilePanel onClose={() => setProfileOpen(false)} onSaved={() => { onProfileSaved(); setProfileOpen(false); }} />
      )}

      {settingsOpen && (
        <SettingsWindow section={settingsSection} onChangeSection={setSettingsSection} onClose={() => setSettingsOpen(false)} onLogout={onLogout} />
      )}

    </div>
  );
}
