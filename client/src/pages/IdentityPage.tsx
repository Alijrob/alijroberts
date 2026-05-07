import { useState, useEffect, useRef } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = '#080a12';
const BG2       = '#0c0e1a';
const SURFACE   = 'rgba(255,255,255,0.04)';
const BORDER    = 'rgba(201,168,64,0.14)';
const BORDER_HV = 'rgba(201,168,64,0.38)';
const GOLD      = '#c9a840';
const GOLD_BR   = '#f0d060';
const TEXT      = '#ffffff';
const TEXT_S    = 'rgba(255,255,255,0.65)';
const TEXT_M    = 'rgba(255,255,255,0.38)';
const GOLD_GRAD = 'linear-gradient(90deg,#5c3d08 0%,#b8860b 20%,#f0d060 45%,#fffacd 55%,#f0d060 70%,#b8860b 85%,#5c3d08 100%)';
const GOLD_TEXT = 'linear-gradient(180deg,#fff5a8 0%,#f0d060 28%,#c9a840 52%,#8b6008 72%,#c9a840 88%,#fff5a8 100%)';

// ── Types ─────────────────────────────────────────────────────────────────────
interface IdentityProfile {
  tagline?: string;
  headline?: string;
  bio?: string;
  banner_path?: string;
  website_url?: string;
  social_links?: Record<string, string>;
  section_visibility?: Record<string, boolean>;
}
interface OnboardingData {
  display_name?: string;
  space_name?: string;
  logo_path?: string;
}
interface Service  { id: number; title: string; description?: string; price_range?: string; icon?: string; }
interface ExpEntry { id: number; title: string; company: string; start_date?: string; end_date?: string; is_current?: boolean; description?: string; }
interface Project  { id: number; title: string; description?: string; url?: string; image_path?: string; tags?: string[]; }
interface Credential { id: number; title: string; issuer?: string; issued_date?: string; credential_url?: string; }
interface Skill    { id: number; name: string; category?: string; }

interface FullData {
  profile: IdentityProfile;
  onboarding: OnboardingData;
  services: Service[];
  experience: ExpEntry[];
  projects: Project[];
  credentials: Credential[];
  skills: Skill[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function GoldLine() {
  return <div style={{ width: '48px', height: '3px', background: GOLD_GRAD, borderRadius: '2px', margin: '0.85rem 0 1.5rem' }} />;
}

function SectionWrap({ id, alt, children }: { id: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} style={{ background: alt ? BG2 : BG, padding: 'clamp(60px,8vw,100px) clamp(1.5rem,6vw,5rem)' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        margin: 0, fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 700,
        color: TEXT, letterSpacing: '-0.01em', lineHeight: 1.15,
      }}>
        {children}
      </h2>
      <GoldLine />
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id: 'about',       label: 'About'      },
  { id: 'services',    label: 'Services'   },
  { id: 'experience',  label: 'Experience' },
  { id: 'projects',    label: 'Portfolio'  },
  { id: 'contact',     label: 'Contact'    },
];

function SiteNav({ brand, isAuthed }: { brand: OnboardingData; isAuthed: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const name = brand.space_name || brand.display_name || 'PAGIOSystems';
  const logoUrl = brand.logo_path ? `/uploads/${brand.logo_path}` : null;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(1.5rem,5vw,3.5rem)',
      background: scrolled ? 'rgba(8,10,18,0.97)' : 'rgba(8,10,18,0.75)',
      backdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid rgba(201,168,64,0.1)' : '1px solid transparent',
      transition: 'all 0.25s',
    }}>
      {/* Brand */}
      <button
        onClick={() => scrollTo('hero')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.65rem', padding: 0,
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="logo" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: GOLD_GRAD, flexShrink: 0 }} />
        )}
        <span style={{
          background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {name}
        </span>
      </button>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="identity-nav-desktop">
        {NAV_LINKS.map(l => (
          <button
            key={l.id}
            onClick={() => scrollTo(l.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: TEXT_S, fontSize: '0.82rem', fontWeight: 600,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '0.4rem 0.85rem', borderRadius: '5px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD_BR)}
            onMouseLeave={e => (e.currentTarget.style.color = TEXT_S)}
          >
            {l.label}
          </button>
        ))}
        {isAuthed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', marginLeft: '0.5rem', padding: '0.2rem 0.5rem', border: `1px solid ${BORDER}`, borderRadius: '6px', background: 'rgba(201,168,64,0.04)' }}>
            {[
              { href: '/operations/raven/hub', label: 'RAVEN' },
              { href: '/brain', label: 'BRAIN' },
              { href: '/platform', label: 'PLATFORM' },
              { href: '/identity/edit', label: 'EDIT' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                style={{
                  fontSize: '0.68rem', color: TEXT_M,
                  textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '4px',
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(201,168,64,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = TEXT_M; e.currentTarget.style.background = 'transparent'; }}
              >
                {label}
              </a>
            ))}
          </div>
        )}
        <button
          onClick={() => scrollTo('contact')}
          style={{
            marginLeft: '0.5rem',
            background: GOLD_GRAD, border: 'none', cursor: 'pointer',
            color: '#1a0e00', fontWeight: 700, fontSize: '0.78rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '0.5rem 1.25rem', borderRadius: '5px',
          }}
        >
          Get In Touch
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="identity-nav-mobile"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: TEXT_S, fontSize: '1.4rem', padding: '0.25rem',
        }}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="identity-nav-mobile"
          style={{
            position: 'absolute', top: '64px', left: 0, right: 0,
            background: 'rgba(8,10,18,0.98)', borderBottom: `1px solid ${BORDER}`,
            backdropFilter: 'blur(12px)', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
          }}
        >
          {NAV_LINKS.map(l => (
            <button
              key={l.id}
              onClick={() => { scrollTo(l.id); setMenuOpen(false); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: TEXT_S, fontSize: '0.9rem', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '0.75rem 0.5rem', textAlign: 'left',
              }}
            >
              {l.label}
            </button>
          ))}
          {isAuthed && (
            <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column' }}>
              {[
                { href: '/operations/raven/hub', label: 'RAVEN Hub' },
                { href: '/brain', label: 'Brain' },
                { href: '/platform', label: 'Platform' },
                { href: '/identity/edit', label: 'Edit Profile' },
              ].map(({ href, label }) => (
                <a key={href} href={href} style={{ color: GOLD, fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.6rem 0.5rem', textDecoration: 'none' }}>
                  {label} →
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ profile, brand }: { profile: IdentityProfile; brand: OnboardingData }) {
  const displayName = brand.display_name || 'Jay Rodriguez';
  const brandName = brand.space_name || 'PAGIOSystems';
  const tagline = profile.tagline || 'Strategy. Systems. Execution.';
  const headline = profile.headline || 'Founder & Systems Architect';
  const bannerUrl = profile.banner_path ? `/uploads/${profile.banner_path}` : null;

  const socials = profile.social_links ?? {};

  const bgStyle: React.CSSProperties = bannerUrl
    ? {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }
    : {
        background: `radial-gradient(ellipse at 20% 50%, rgba(201,168,64,0.07) 0%, transparent 60%), linear-gradient(135deg, #0a0c18 0%, #080a12 50%, #0d0a18 100%)`,
      };

  return (
    <section id="hero" style={{
      ...bgStyle,
      minHeight: '100vh', position: 'relative',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: bannerUrl
          ? 'linear-gradient(100deg, rgba(8,10,18,0.92) 0%, rgba(8,10,18,0.75) 50%, rgba(8,10,18,0.45) 100%)'
          : 'transparent',
      }} />

      {/* Gold accent line left edge */}
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%',
        width: '3px', background: GOLD_GRAD,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(100px,12vw,140px) clamp(2rem,8vw,6rem) clamp(60px,8vw,100px)',
        maxWidth: '900px',
      }}>
        {/* Brand label */}
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: GOLD, marginBottom: '1.5rem',
        }}>
          {brandName}
        </div>

        {/* Name */}
        <h1 style={{
          margin: '0 0 0.5rem',
          fontSize: 'clamp(3rem,7vw,5.5rem)',
          fontWeight: 800, lineHeight: 1.05,
          letterSpacing: '-0.02em', color: TEXT,
        }}>
          {displayName}
        </h1>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(1rem,2.5vw,1.35rem)', fontWeight: 400,
          color: GOLD_BR, marginBottom: '1.25rem', letterSpacing: '0.02em',
        }}>
          {headline}
        </div>

        {/* Divider */}
        <div style={{ width: '60px', height: '2px', background: GOLD_GRAD, marginBottom: '1.5rem' }} />

        {/* Tagline */}
        <p style={{
          margin: '0 0 2.5rem', fontSize: 'clamp(0.95rem,1.8vw,1.15rem)',
          color: TEXT_S, lineHeight: 1.65, maxWidth: '520px',
        }}>
          {tagline}
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <button
            onClick={() => scrollTo('contact')}
            style={{
              background: GOLD_GRAD, border: 'none', cursor: 'pointer',
              color: '#1a0e00', fontWeight: 800, fontSize: '0.88rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '0.85rem 2.25rem', borderRadius: '6px',
            }}
          >
            Get In Touch
          </button>
          <button
            onClick={() => scrollTo('projects')}
            style={{
              background: 'transparent',
              border: `1px solid rgba(201,168,64,0.45)`,
              cursor: 'pointer', color: GOLD_BR,
              fontWeight: 700, fontSize: '0.85rem',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '0.85rem 2.25rem', borderRadius: '6px',
            }}
          >
            View Work
          </button>
        </div>

        {/* Social links */}
        {Object.keys(socials).length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(socials).map(([key, url]) => url ? (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: TEXT_M,
                  textDecoration: 'none', padding: '0.35rem 0.75rem',
                  border: `1px solid rgba(255,255,255,0.12)`, borderRadius: '4px',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = BORDER_HV; }}
                onMouseLeave={e => { e.currentTarget.style.color = TEXT_M; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                {key}
              </a>
            ) : null)}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: '2.5rem', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
      }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: TEXT_M }}>
          Scroll
        </div>
        <div style={{ width: '1px', height: '40px', background: `linear-gradient(to bottom, ${GOLD}60, transparent)` }} />
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────
function AboutSection({ profile, brand, skills }: { profile: IdentityProfile; brand: OnboardingData; skills: Skill[] }) {
  const bio = profile.bio || 'Add your bio in the profile editor to tell visitors who you are and what you do.';
  const profilePhotoUrl = brand.logo_path ? `/uploads/${brand.logo_path}` : null;

  const skillsByCategory: Record<string, Skill[]> = {};
  for (const s of skills) {
    const cat = s.category || 'General';
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(s);
  }

  return (
    <SectionWrap id="about">
      <div style={{ display: 'grid', gridTemplateColumns: skills.length > 0 ? '1fr 1fr' : '3fr 2fr', gap: 'clamp(2rem,6vw,5rem)', alignItems: 'start' }}>
        {/* Left: Bio */}
        <div>
          <SectionTitle>About</SectionTitle>
          <p style={{
            margin: '0 0 2rem', fontSize: '1.05rem', color: TEXT_S,
            lineHeight: 1.8, whiteSpace: 'pre-wrap',
          }}>
            {bio}
          </p>

          {/* Skills */}
          {Object.keys(skillsByCategory).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.entries(skillsByCategory).map(([cat, items]) => (
                <div key={cat}>
                  <div style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: GOLD, marginBottom: '0.6rem',
                  }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {items.map(s => (
                      <span key={s.id} style={{
                        fontSize: '0.78rem', fontWeight: 500, color: TEXT_S,
                        padding: '0.3rem 0.7rem',
                        border: `1px solid ${BORDER}`, borderRadius: '4px',
                        background: SURFACE,
                      }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Photo or visual */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }}>
          {profilePhotoUrl ? (
            <div style={{
              width: 'clamp(200px,30vw,340px)', aspectRatio: '3/4',
              border: `1px solid ${BORDER}`,
              borderRadius: '4px', overflow: 'hidden',
              boxShadow: `0 0 0 1px rgba(201,168,64,0.08), 0 24px 60px rgba(0,0,0,0.4)`,
            }}>
              <img src={profilePhotoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{
              width: 'clamp(200px,30vw,340px)', aspectRatio: '3/4',
              border: `1px solid ${BORDER}`,
              borderRadius: '4px',
              background: `radial-gradient(ellipse at center, rgba(201,168,64,0.06) 0%, transparent 70%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '3rem', color: 'rgba(201,168,64,0.2)' }}>◉</div>
            </div>
          )}
        </div>
      </div>
    </SectionWrap>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
function ServicesSection({ services }: { services: Service[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (services.length === 0) return (
    <SectionWrap id="services" alt>
      <SectionTitle>What I Do</SectionTitle>
      <p style={{ color: TEXT_M, fontSize: '0.9rem' }}>Add services in the profile editor.</p>
    </SectionWrap>
  );

  return (
    <SectionWrap id="services" alt>
      <SectionTitle>What I Do</SectionTitle>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}>
        {services.map(s => (
          <div
            key={s.id}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === s.id ? 'rgba(201,168,64,0.05)' : SURFACE,
              border: `1px solid ${hovered === s.id ? BORDER_HV : BORDER}`,
              borderRadius: '8px', padding: '1.75rem',
              transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', gap: '0.85rem',
            }}
          >
            <div style={{ fontSize: '1.5rem', color: GOLD, lineHeight: 1 }}>
              {s.icon || '◆'}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.01em' }}>
              {s.title}
            </div>
            {s.description && (
              <div style={{ fontSize: '0.88rem', color: TEXT_S, lineHeight: 1.65 }}>
                {s.description}
              </div>
            )}
            {s.price_range && (
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: GOLD, marginTop: 'auto', paddingTop: '0.5rem',
                borderTop: `1px solid ${BORDER}`,
              }}>
                {s.price_range}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

// ── Experience ────────────────────────────────────────────────────────────────
function ExperienceSection({ experience }: { experience: ExpEntry[] }) {
  if (experience.length === 0) return (
    <SectionWrap id="experience">
      <SectionTitle>Work History</SectionTitle>
      <p style={{ color: TEXT_M, fontSize: '0.9rem' }}>Add experience in the profile editor.</p>
    </SectionWrap>
  );

  return (
    <SectionWrap id="experience">
      <SectionTitle>Work History</SectionTitle>
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: '6px', top: '8px', bottom: '8px',
          width: '1px', background: `linear-gradient(to bottom, ${GOLD}80, transparent)`,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {experience.map((e, i) => (
            <div key={e.id} style={{ position: 'relative' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-2rem', top: '6px',
                width: '13px', height: '13px', borderRadius: '50%',
                background: i === 0 ? GOLD : BG,
                border: `2px solid ${GOLD}`,
                boxShadow: i === 0 ? `0 0 0 4px rgba(201,168,64,0.12)` : 'none',
              }} />

              {/* Date range */}
              <div style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: GOLD, marginBottom: '0.35rem',
              }}>
                {e.start_date}{e.is_current ? ' — Present' : e.end_date ? ` — ${e.end_date}` : ''}
              </div>

              {/* Title */}
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: TEXT, marginBottom: '0.15rem' }}>
                {e.title}
              </div>

              {/* Company */}
              <div style={{ fontSize: '0.88rem', color: TEXT_S, fontWeight: 500, marginBottom: '0.75rem' }}>
                {e.company}
              </div>

              {/* Description */}
              {e.description && (
                <div style={{
                  fontSize: '0.88rem', color: TEXT_S, lineHeight: 1.7,
                  borderLeft: `2px solid rgba(201,168,64,0.15)`,
                  paddingLeft: '1rem',
                }}>
                  {e.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionWrap>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────
function ProjectsSection({ projects }: { projects: Project[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (projects.length === 0) return (
    <SectionWrap id="projects" alt>
      <SectionTitle>Portfolio</SectionTitle>
      <p style={{ color: TEXT_M, fontSize: '0.9rem' }}>Add projects in the profile editor.</p>
    </SectionWrap>
  );

  return (
    <SectionWrap id="projects" alt>
      <SectionTitle>Portfolio</SectionTitle>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}>
        {projects.map(p => (
          <div
            key={p.id}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === p.id ? 'rgba(201,168,64,0.04)' : SURFACE,
              border: `1px solid ${hovered === p.id ? BORDER_HV : BORDER}`,
              borderRadius: '8px', overflow: 'hidden',
              transition: 'all 0.2s',
            }}
          >
            {/* Image area */}
            <div style={{
              height: '180px',
              background: p.image_path
                ? `url(/uploads/${p.image_path}) center/cover`
                : `linear-gradient(135deg, rgba(201,168,64,0.08) 0%, rgba(8,10,18,0.8) 100%)`,
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!p.image_path && (
                <div style={{ fontSize: '2rem', color: 'rgba(201,168,64,0.2)' }}>◈</div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: TEXT, marginBottom: '0.5rem' }}>
                {p.title}
              </div>
              {p.description && (
                <div style={{ fontSize: '0.84rem', color: TEXT_S, lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {p.description}
                </div>
              )}
              {p.tags && p.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {p.tags.map((t, i) => (
                    <span key={i} style={{
                      fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: GOLD,
                      padding: '0.2rem 0.5rem', borderRadius: '3px',
                      background: 'rgba(201,168,64,0.08)', border: `1px solid rgba(201,168,64,0.15)`,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {p.url && (
                <a
                  href={p.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: GOLD_BR, textDecoration: 'none',
                  }}
                >
                  View Project →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

// ── Credentials ───────────────────────────────────────────────────────────────
function CredentialsSection({ credentials }: { credentials: Credential[] }) {
  if (credentials.length === 0) return null;

  return (
    <SectionWrap id="credentials">
      <SectionTitle>Qualifications</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
        {credentials.map(c => (
          <div key={c.id} style={{
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: '8px', padding: '1rem 1.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
          }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: TEXT }}>{c.title}</div>
            {c.issuer && <div style={{ fontSize: '0.75rem', color: GOLD }}>{c.issuer}</div>}
            {c.issued_date && <div style={{ fontSize: '0.7rem', color: TEXT_M }}>{c.issued_date}</div>}
            {c.credential_url && (
              <a href={c.credential_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.7rem', color: TEXT_M, textDecoration: 'none', marginTop: '0.15rem' }}>
                View ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function ContactSection({ profile }: { profile: IdentityProfile; brand?: OnboardingData }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: SURFACE,
    border: `1px solid ${BORDER}`, borderRadius: '6px',
    color: TEXT, fontSize: '0.92rem',
    padding: '0.85rem 1rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
  };

  return (
    <SectionWrap id="contact" alt>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem,6vw,5rem)', alignItems: 'start' }}>
        {/* Left */}
        <div>
          <SectionTitle>Let's Connect</SectionTitle>
          <p style={{ fontSize: '1rem', color: TEXT_S, lineHeight: 1.75, marginBottom: '2rem' }}>
            Ready to work together? Reach out and I'll get back to you promptly.
          </p>

          {profile.website_url && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.25rem' }}>
                Website
              </div>
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.92rem', color: TEXT_S, textDecoration: 'none' }}>
                {profile.website_url}
              </a>
            </div>
          )}

          {Object.entries(profile.social_links ?? {}).map(([k, v]) => v ? (
            <div key={k} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.2rem' }}>
                {k}
              </div>
              <a href={v} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.88rem', color: TEXT_S, textDecoration: 'none' }}>
                {v}
              </a>
            </div>
          ) : null)}
        </div>

        {/* Right: Form */}
        <div>
          {sent ? (
            <div style={{
              background: SURFACE, border: `1px solid rgba(201,168,64,0.25)`,
              borderRadius: '10px', padding: '2.5rem',
              textAlign: 'center', color: GOLD_BR,
              fontSize: '1rem', fontWeight: 600,
            }}>
              Message received. I'll be in touch soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_M, marginBottom: '0.4rem' }}>
                  Your Name
                </label>
                <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="Full name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_M, marginBottom: '0.4rem' }}>
                  Email
                </label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} placeholder="your@email.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_M, marginBottom: '0.4rem' }}>
                  Message
                </label>
                <textarea
                  name="message" value={form.message} onChange={handleChange} required
                  rows={5} style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Tell me about your project..."
                />
              </div>
              <button type="submit" style={{
                background: GOLD_GRAD, border: 'none', cursor: 'pointer',
                color: '#1a0e00', fontWeight: 800, fontSize: '0.85rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '0.95rem', borderRadius: '6px', marginTop: '0.25rem',
              }}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </SectionWrap>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function SiteFooter({ brand }: { brand: OnboardingData }) {
  const name = brand.space_name || brand.display_name || 'PAGIOSystems';
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: '#050609',
      borderTop: `1px solid rgba(201,168,64,0.1)`,
      padding: '2rem clamp(1.5rem,6vw,5rem)',
    }}>
      <div style={{
        maxWidth: '1140px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: TEXT_M,
        }}>
          {name} · {year}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {NAV_LINKS.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: TEXT_M,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: '3px', background: GOLD_GRAD, marginTop: '1.5rem', maxWidth: '1140px', margin: '1.5rem auto 0' }} />
    </footer>
  );
}

// ── Edit FAB (floating action button for authenticated users) ─────────────────
function EditFAB() {
  return (
    <a
      href="/identity/edit"
      style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 200,
        background: GOLD_GRAD, color: '#1a0e00',
        fontWeight: 800, fontSize: '0.75rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '0.75rem 1.25rem', borderRadius: '50px',
        textDecoration: 'none', boxShadow: '0 4px 20px rgba(201,168,64,0.3)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}
    >
      ✎ Edit Profile
    </a>
  );
}

// ── Responsive styles injection ───────────────────────────────────────────────
const RESPONSIVE_CSS = `
  @media (max-width: 768px) {
    .identity-nav-desktop { display: none !important; }
    .identity-nav-mobile { display: flex !important; }
    .identity-about-grid { grid-template-columns: 1fr !important; }
    .identity-contact-grid { grid-template-columns: 1fr !important; }
  }
  @media (min-width: 769px) {
    .identity-nav-mobile { display: none !important; }
  }
`;

// ── Root component ────────────────────────────────────────────────────────────
interface IdentityPageProps {
  isAuthed?: boolean;
}

export default function IdentityPage({ isAuthed = false }: IdentityPageProps) {
  const [data, setData] = useState<FullData | null>(null);
  const [loading, setLoading] = useState(true);
  const styleInjected = useRef(false);

  useEffect(() => {
    if (!styleInjected.current) {
      styleInjected.current = true;
      const el = document.createElement('style');
      el.textContent = RESPONSIVE_CSS;
      document.head.appendChild(el);
    }
    fetch('/api/identity/full')
      .then(r => r.json())
      .then(d => { setData(d as FullData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: BG }} />;
  }

  const profile = data?.profile ?? {};
  const brand = data?.onboarding ?? {};
  const services = data?.services ?? [];
  const experience = data?.experience ?? [];
  const projects = data?.projects ?? [];
  const credentials = data?.credentials ?? [];
  const skills = data?.skills ?? [];
  const visibility = profile.section_visibility ?? {};

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: TEXT }}>
      <SiteNav brand={brand} isAuthed={isAuthed} />
      <HeroSection profile={profile} brand={brand} />
      {visibility['about'] !== false && <AboutSection profile={profile} brand={brand} skills={skills} />}
      {visibility['services'] !== false && <ServicesSection services={services} />}
      {visibility['experience'] !== false && <ExperienceSection experience={experience} />}
      {visibility['projects'] !== false && <ProjectsSection projects={projects} />}
      {visibility['credentials'] !== false && credentials.length > 0 && <CredentialsSection credentials={credentials} />}
      {visibility['contact'] !== false && <ContactSection profile={profile} />}
      <SiteFooter brand={brand} />
      {isAuthed && <EditFAB />}
    </div>
  );
}
