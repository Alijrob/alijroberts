import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = '#080a12';
const BG2 = '#0c0e1a';
const SURFACE = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(201,168,64,0.14)';
const BORDER_HV = 'rgba(201,168,64,0.38)';
const GOLD = '#c9a840';
const GOLD_BR = '#f0d060';
const TEXT = '#ffffff';
const TEXT_S = 'rgba(255,255,255,0.65)';
const TEXT_M = 'rgba(255,255,255,0.38)';
const GOLD_GRAD = 'linear-gradient(90deg,#5c3d08 0%,#b8860b 20%,#f0d060 45%,#fffacd 55%,#f0d060 70%,#b8860b 85%,#5c3d08 100%)';
const GOLD_TEXT = 'linear-gradient(180deg,#fff5a8 0%,#f0d060 28%,#c9a840 52%,#8b6008 72%,#c9a840 88%,#fff5a8 100%)';
// ── Helpers ───────────────────────────────────────────────────────────────────
function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function GoldLine() {
    return _jsx("div", { style: { width: '48px', height: '3px', background: GOLD_GRAD, borderRadius: '2px', margin: '0.85rem 0 1.5rem' } });
}
function SectionWrap({ id, alt, children }) {
    return (_jsx("section", { id: id, style: { background: alt ? BG2 : BG, padding: 'clamp(60px,8vw,100px) clamp(1.5rem,6vw,5rem)' }, children: _jsx("div", { style: { maxWidth: '1140px', margin: '0 auto' }, children: children }) }));
}
function SectionTitle({ children }) {
    return (_jsxs("div", { children: [_jsx("h2", { style: {
                    margin: 0, fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 700,
                    color: TEXT, letterSpacing: '-0.01em', lineHeight: 1.15,
                }, children: children }), _jsx(GoldLine, {})] }));
}
// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Portfolio' },
    { id: 'contact', label: 'Contact' },
];
function SiteNav({ brand, isAuthed }) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const name = brand.space_name || brand.display_name || 'PAGIOSystems';
    const logoUrl = brand.logo_path ? `/uploads/${brand.logo_path}` : null;
    return (_jsxs("nav", { style: {
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 clamp(1.5rem,5vw,3.5rem)',
            background: scrolled ? 'rgba(8,10,18,0.97)' : 'rgba(8,10,18,0.75)',
            backdropFilter: 'blur(12px)',
            borderBottom: scrolled ? '1px solid rgba(201,168,64,0.1)' : '1px solid transparent',
            transition: 'all 0.25s',
        }, children: [_jsxs("button", { onClick: () => scrollTo('hero'), style: {
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.65rem', padding: 0,
                }, children: [logoUrl ? (_jsx("img", { src: logoUrl, alt: "logo", style: { width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' } })) : (_jsx("div", { style: { width: '30px', height: '30px', borderRadius: '6px', background: GOLD_GRAD, flexShrink: 0 } })), _jsx("span", { style: {
                            background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        }, children: name })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.25rem' }, className: "identity-nav-desktop", children: [NAV_LINKS.map(l => (_jsx("button", { onClick: () => scrollTo(l.id), style: {
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: TEXT_S, fontSize: '0.82rem', fontWeight: 600,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                            padding: '0.4rem 0.85rem', borderRadius: '5px',
                            transition: 'color 0.15s',
                        }, onMouseEnter: e => (e.currentTarget.style.color = GOLD_BR), onMouseLeave: e => (e.currentTarget.style.color = TEXT_S), children: l.label }, l.id))), isAuthed && (_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '0.15rem', marginLeft: '0.5rem', padding: '0.2rem 0.5rem', border: `1px solid ${BORDER}`, borderRadius: '6px', background: 'rgba(201,168,64,0.04)' }, children: [
                            { href: '/operations/raven/hub', label: 'RAVEN' },
                            { href: '/brain', label: 'BRAIN' },
                            { href: '/platform', label: 'PLATFORM' },
                            { href: '/identity/edit', label: 'EDIT' },
                        ].map(({ href, label }) => (_jsx("a", { href: href, style: {
                                fontSize: '0.68rem', color: TEXT_M,
                                textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase',
                                fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '4px',
                                transition: 'color 0.15s, background 0.15s',
                            }, onMouseEnter: e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(201,168,64,0.08)'; }, onMouseLeave: e => { e.currentTarget.style.color = TEXT_M; e.currentTarget.style.background = 'transparent'; }, children: label }, href))) })), _jsx("button", { onClick: () => scrollTo('contact'), style: {
                            marginLeft: '0.5rem',
                            background: GOLD_GRAD, border: 'none', cursor: 'pointer',
                            color: '#1a0e00', fontWeight: 700, fontSize: '0.78rem',
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            padding: '0.5rem 1.25rem', borderRadius: '5px',
                        }, children: "Get In Touch" })] }), _jsx("button", { onClick: () => setMenuOpen(!menuOpen), className: "identity-nav-mobile", style: {
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: TEXT_S, fontSize: '1.4rem', padding: '0.25rem',
                }, children: menuOpen ? '✕' : '☰' }), menuOpen && (_jsxs("div", { className: "identity-nav-mobile", style: {
                    position: 'absolute', top: '64px', left: 0, right: 0,
                    background: 'rgba(8,10,18,0.98)', borderBottom: `1px solid ${BORDER}`,
                    backdropFilter: 'blur(12px)', padding: '1rem',
                    display: 'flex', flexDirection: 'column', gap: '0.25rem',
                }, children: [NAV_LINKS.map(l => (_jsx("button", { onClick: () => { scrollTo(l.id); setMenuOpen(false); }, style: {
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: TEXT_S, fontSize: '0.9rem', fontWeight: 600,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '0.75rem 0.5rem', textAlign: 'left',
                        }, children: l.label }, l.id))), isAuthed && (_jsx("div", { style: { borderTop: `1px solid ${BORDER}`, marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column' }, children: [
                            { href: '/operations/raven/hub', label: 'RAVEN Hub' },
                            { href: '/brain', label: 'Brain' },
                            { href: '/platform', label: 'Platform' },
                            { href: '/identity/edit', label: 'Edit Profile' },
                        ].map(({ href, label }) => (_jsxs("a", { href: href, style: { color: GOLD, fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.6rem 0.5rem', textDecoration: 'none' }, children: [label, " \u2192"] }, href))) }))] }))] }));
}
// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ profile, brand }) {
    const displayName = brand.display_name || 'Jay Rodriguez';
    const brandName = brand.space_name || 'PAGIOSystems';
    const tagline = profile.tagline || 'Strategy. Systems. Execution.';
    const headline = profile.headline || 'Founder & Systems Architect';
    const bannerUrl = profile.banner_path ? `/uploads/${profile.banner_path}` : null;
    const socials = profile.social_links ?? {};
    const bgStyle = bannerUrl
        ? {
            backgroundImage: `url(${bannerUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
        }
        : {
            background: `radial-gradient(ellipse at 20% 50%, rgba(201,168,64,0.07) 0%, transparent 60%), linear-gradient(135deg, #0a0c18 0%, #080a12 50%, #0d0a18 100%)`,
        };
    return (_jsxs("section", { id: "hero", style: {
            ...bgStyle,
            minHeight: '100vh', position: 'relative',
            display: 'flex', alignItems: 'center',
        }, children: [_jsx("div", { style: {
                    position: 'absolute', inset: 0,
                    background: bannerUrl
                        ? 'linear-gradient(100deg, rgba(8,10,18,0.92) 0%, rgba(8,10,18,0.75) 50%, rgba(8,10,18,0.45) 100%)'
                        : 'transparent',
                } }), _jsx("div", { style: {
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: '3px', background: GOLD_GRAD,
                } }), _jsxs("div", { style: {
                    position: 'relative', zIndex: 1,
                    padding: 'clamp(100px,12vw,140px) clamp(2rem,8vw,6rem) clamp(60px,8vw,100px)',
                    maxWidth: '900px',
                }, children: [_jsx("div", { style: {
                            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em',
                            textTransform: 'uppercase', color: GOLD, marginBottom: '1.5rem',
                        }, children: brandName }), _jsx("h1", { style: {
                            margin: '0 0 0.5rem',
                            fontSize: 'clamp(3rem,7vw,5.5rem)',
                            fontWeight: 800, lineHeight: 1.05,
                            letterSpacing: '-0.02em', color: TEXT,
                        }, children: displayName }), _jsx("div", { style: {
                            fontSize: 'clamp(1rem,2.5vw,1.35rem)', fontWeight: 400,
                            color: GOLD_BR, marginBottom: '1.25rem', letterSpacing: '0.02em',
                        }, children: headline }), _jsx("div", { style: { width: '60px', height: '2px', background: GOLD_GRAD, marginBottom: '1.5rem' } }), _jsx("p", { style: {
                            margin: '0 0 2.5rem', fontSize: 'clamp(0.95rem,1.8vw,1.15rem)',
                            color: TEXT_S, lineHeight: 1.65, maxWidth: '520px',
                        }, children: tagline }), _jsxs("div", { style: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }, children: [_jsx("button", { onClick: () => scrollTo('contact'), style: {
                                    background: GOLD_GRAD, border: 'none', cursor: 'pointer',
                                    color: '#1a0e00', fontWeight: 800, fontSize: '0.88rem',
                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                    padding: '0.85rem 2.25rem', borderRadius: '6px',
                                }, children: "Get In Touch" }), _jsx("button", { onClick: () => scrollTo('projects'), style: {
                                    background: 'transparent',
                                    border: `1px solid rgba(201,168,64,0.45)`,
                                    cursor: 'pointer', color: GOLD_BR,
                                    fontWeight: 700, fontSize: '0.85rem',
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                    padding: '0.85rem 2.25rem', borderRadius: '6px',
                                }, children: "View Work" })] }), Object.keys(socials).length > 0 && (_jsx("div", { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }, children: Object.entries(socials).map(([key, url]) => url ? (_jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", style: {
                                fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em',
                                textTransform: 'uppercase', color: TEXT_M,
                                textDecoration: 'none', padding: '0.35rem 0.75rem',
                                border: `1px solid rgba(255,255,255,0.12)`, borderRadius: '4px',
                                transition: 'color 0.15s, border-color 0.15s',
                            }, onMouseEnter: e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = BORDER_HV; }, onMouseLeave: e => { e.currentTarget.style.color = TEXT_M; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }, children: key }, key)) : null) }))] }), _jsxs("div", { style: {
                    position: 'absolute', bottom: '2.5rem', left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                }, children: [_jsx("div", { style: { fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: TEXT_M }, children: "Scroll" }), _jsx("div", { style: { width: '1px', height: '40px', background: `linear-gradient(to bottom, ${GOLD}60, transparent)` } })] })] }));
}
// ── About ─────────────────────────────────────────────────────────────────────
function AboutSection({ profile, brand, skills }) {
    const bio = profile.bio || 'Add your bio in the profile editor to tell visitors who you are and what you do.';
    const profilePhotoUrl = brand.logo_path ? `/uploads/${brand.logo_path}` : null;
    const skillsByCategory = {};
    for (const s of skills) {
        const cat = s.category || 'General';
        if (!skillsByCategory[cat])
            skillsByCategory[cat] = [];
        skillsByCategory[cat].push(s);
    }
    return (_jsx(SectionWrap, { id: "about", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: skills.length > 0 ? '1fr 1fr' : '3fr 2fr', gap: 'clamp(2rem,6vw,5rem)', alignItems: 'start' }, children: [_jsxs("div", { children: [_jsx(SectionTitle, { children: "About" }), _jsx("p", { style: {
                                margin: '0 0 2rem', fontSize: '1.05rem', color: TEXT_S,
                                lineHeight: 1.8, whiteSpace: 'pre-wrap',
                            }, children: bio }), Object.keys(skillsByCategory).length > 0 && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: Object.entries(skillsByCategory).map(([cat, items]) => (_jsxs("div", { children: [_jsx("div", { style: {
                                            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em',
                                            textTransform: 'uppercase', color: GOLD, marginBottom: '0.6rem',
                                        }, children: cat }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }, children: items.map(s => (_jsx("span", { style: {
                                                fontSize: '0.78rem', fontWeight: 500, color: TEXT_S,
                                                padding: '0.3rem 0.7rem',
                                                border: `1px solid ${BORDER}`, borderRadius: '4px',
                                                background: SURFACE,
                                            }, children: s.name }, s.id))) })] }, cat))) }))] }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }, children: profilePhotoUrl ? (_jsx("div", { style: {
                            width: 'clamp(200px,30vw,340px)', aspectRatio: '3/4',
                            border: `1px solid ${BORDER}`,
                            borderRadius: '4px', overflow: 'hidden',
                            boxShadow: `0 0 0 1px rgba(201,168,64,0.08), 0 24px 60px rgba(0,0,0,0.4)`,
                        }, children: _jsx("img", { src: profilePhotoUrl, alt: "Profile", style: { width: '100%', height: '100%', objectFit: 'cover' } }) })) : (_jsx("div", { style: {
                            width: 'clamp(200px,30vw,340px)', aspectRatio: '3/4',
                            border: `1px solid ${BORDER}`,
                            borderRadius: '4px',
                            background: `radial-gradient(ellipse at center, rgba(201,168,64,0.06) 0%, transparent 70%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }, children: _jsx("div", { style: { fontSize: '3rem', color: 'rgba(201,168,64,0.2)' }, children: "\u25C9" }) })) })] }) }));
}
// ── Services ──────────────────────────────────────────────────────────────────
function ServicesSection({ services }) {
    const [hovered, setHovered] = useState(null);
    if (services.length === 0)
        return (_jsxs(SectionWrap, { id: "services", alt: true, children: [_jsx(SectionTitle, { children: "What I Do" }), _jsx("p", { style: { color: TEXT_M, fontSize: '0.9rem' }, children: "Add services in the profile editor." })] }));
    return (_jsxs(SectionWrap, { id: "services", alt: true, children: [_jsx(SectionTitle, { children: "What I Do" }), _jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                }, children: services.map(s => (_jsxs("div", { onMouseEnter: () => setHovered(s.id), onMouseLeave: () => setHovered(null), style: {
                        background: hovered === s.id ? 'rgba(201,168,64,0.05)' : SURFACE,
                        border: `1px solid ${hovered === s.id ? BORDER_HV : BORDER}`,
                        borderRadius: '8px', padding: '1.75rem',
                        transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', gap: '0.85rem',
                    }, children: [_jsx("div", { style: { fontSize: '1.5rem', color: GOLD, lineHeight: 1 }, children: s.icon || '◆' }), _jsx("div", { style: { fontSize: '1.05rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.01em' }, children: s.title }), s.description && (_jsx("div", { style: { fontSize: '0.88rem', color: TEXT_S, lineHeight: 1.65 }, children: s.description })), s.price_range && (_jsx("div", { style: {
                                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                                textTransform: 'uppercase', color: GOLD, marginTop: 'auto', paddingTop: '0.5rem',
                                borderTop: `1px solid ${BORDER}`,
                            }, children: s.price_range }))] }, s.id))) })] }));
}
// ── Experience ────────────────────────────────────────────────────────────────
function ExperienceSection({ experience }) {
    if (experience.length === 0)
        return (_jsxs(SectionWrap, { id: "experience", children: [_jsx(SectionTitle, { children: "Work History" }), _jsx("p", { style: { color: TEXT_M, fontSize: '0.9rem' }, children: "Add experience in the profile editor." })] }));
    return (_jsxs(SectionWrap, { id: "experience", children: [_jsx(SectionTitle, { children: "Work History" }), _jsxs("div", { style: { position: 'relative', paddingLeft: '2rem' }, children: [_jsx("div", { style: {
                            position: 'absolute', left: '6px', top: '8px', bottom: '8px',
                            width: '1px', background: `linear-gradient(to bottom, ${GOLD}80, transparent)`,
                        } }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '2.5rem' }, children: experience.map((e, i) => (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { style: {
                                        position: 'absolute', left: '-2rem', top: '6px',
                                        width: '13px', height: '13px', borderRadius: '50%',
                                        background: i === 0 ? GOLD : BG,
                                        border: `2px solid ${GOLD}`,
                                        boxShadow: i === 0 ? `0 0 0 4px rgba(201,168,64,0.12)` : 'none',
                                    } }), _jsxs("div", { style: {
                                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                                        textTransform: 'uppercase', color: GOLD, marginBottom: '0.35rem',
                                    }, children: [e.start_date, e.is_current ? ' — Present' : e.end_date ? ` — ${e.end_date}` : ''] }), _jsx("div", { style: { fontSize: '1.1rem', fontWeight: 700, color: TEXT, marginBottom: '0.15rem' }, children: e.title }), _jsx("div", { style: { fontSize: '0.88rem', color: TEXT_S, fontWeight: 500, marginBottom: '0.75rem' }, children: e.company }), e.description && (_jsx("div", { style: {
                                        fontSize: '0.88rem', color: TEXT_S, lineHeight: 1.7,
                                        borderLeft: `2px solid rgba(201,168,64,0.15)`,
                                        paddingLeft: '1rem',
                                    }, children: e.description }))] }, e.id))) })] })] }));
}
// ── Projects ──────────────────────────────────────────────────────────────────
function ProjectsSection({ projects }) {
    const [hovered, setHovered] = useState(null);
    if (projects.length === 0)
        return (_jsxs(SectionWrap, { id: "projects", alt: true, children: [_jsx(SectionTitle, { children: "Portfolio" }), _jsx("p", { style: { color: TEXT_M, fontSize: '0.9rem' }, children: "Add projects in the profile editor." })] }));
    return (_jsxs(SectionWrap, { id: "projects", alt: true, children: [_jsx(SectionTitle, { children: "Portfolio" }), _jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.25rem',
                }, children: projects.map(p => (_jsxs("div", { onMouseEnter: () => setHovered(p.id), onMouseLeave: () => setHovered(null), style: {
                        background: hovered === p.id ? 'rgba(201,168,64,0.04)' : SURFACE,
                        border: `1px solid ${hovered === p.id ? BORDER_HV : BORDER}`,
                        borderRadius: '8px', overflow: 'hidden',
                        transition: 'all 0.2s',
                    }, children: [_jsx("div", { style: {
                                height: '180px',
                                background: p.image_path
                                    ? `url(/uploads/${p.image_path}) center/cover`
                                    : `linear-gradient(135deg, rgba(201,168,64,0.08) 0%, rgba(8,10,18,0.8) 100%)`,
                                borderBottom: `1px solid ${BORDER}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }, children: !p.image_path && (_jsx("div", { style: { fontSize: '2rem', color: 'rgba(201,168,64,0.2)' }, children: "\u25C8" })) }), _jsxs("div", { style: { padding: '1.25rem' }, children: [_jsx("div", { style: { fontSize: '1rem', fontWeight: 700, color: TEXT, marginBottom: '0.5rem' }, children: p.title }), p.description && (_jsx("div", { style: { fontSize: '0.84rem', color: TEXT_S, lineHeight: 1.6, marginBottom: '0.75rem' }, children: p.description })), p.tags && p.tags.length > 0 && (_jsx("div", { style: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }, children: p.tags.map((t, i) => (_jsx("span", { style: {
                                            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
                                            textTransform: 'uppercase', color: GOLD,
                                            padding: '0.2rem 0.5rem', borderRadius: '3px',
                                            background: 'rgba(201,168,64,0.08)', border: `1px solid rgba(201,168,64,0.15)`,
                                        }, children: t }, i))) })), p.url && (_jsx("a", { href: p.url, target: "_blank", rel: "noopener noreferrer", style: {
                                        fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                                        textTransform: 'uppercase', color: GOLD_BR, textDecoration: 'none',
                                    }, children: "View Project \u2192" }))] })] }, p.id))) })] }));
}
// ── Credentials ───────────────────────────────────────────────────────────────
function CredentialsSection({ credentials }) {
    if (credentials.length === 0)
        return null;
    return (_jsxs(SectionWrap, { id: "credentials", children: [_jsx(SectionTitle, { children: "Qualifications" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }, children: credentials.map(c => (_jsxs("div", { style: {
                        background: SURFACE, border: `1px solid ${BORDER}`,
                        borderRadius: '8px', padding: '1rem 1.5rem',
                        display: 'flex', flexDirection: 'column', gap: '0.25rem',
                    }, children: [_jsx("div", { style: { fontSize: '0.88rem', fontWeight: 700, color: TEXT }, children: c.title }), c.issuer && _jsx("div", { style: { fontSize: '0.75rem', color: GOLD }, children: c.issuer }), c.issued_date && _jsx("div", { style: { fontSize: '0.7rem', color: TEXT_M }, children: c.issued_date }), c.credential_url && (_jsx("a", { href: c.credential_url, target: "_blank", rel: "noopener noreferrer", style: { fontSize: '0.7rem', color: TEXT_M, textDecoration: 'none', marginTop: '0.15rem' }, children: "View \u2197" }))] }, c.id))) })] }));
}
// ── Contact ───────────────────────────────────────────────────────────────────
function ContactSection({ profile }) {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);
    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }
    function handleSubmit(e) {
        e.preventDefault();
        setSent(true);
    }
    const inputStyle = {
        width: '100%', background: SURFACE,
        border: `1px solid ${BORDER}`, borderRadius: '6px',
        color: TEXT, fontSize: '0.92rem',
        padding: '0.85rem 1rem',
        outline: 'none', boxSizing: 'border-box',
        fontFamily: 'system-ui, sans-serif',
    };
    return (_jsx(SectionWrap, { id: "contact", alt: true, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2rem,6vw,5rem)', alignItems: 'start' }, children: [_jsxs("div", { children: [_jsx(SectionTitle, { children: "Let's Connect" }), _jsx("p", { style: { fontSize: '1rem', color: TEXT_S, lineHeight: 1.75, marginBottom: '2rem' }, children: "Ready to work together? Reach out and I'll get back to you promptly." }), profile.website_url && (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("div", { style: { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.25rem' }, children: "Website" }), _jsx("a", { href: profile.website_url, target: "_blank", rel: "noopener noreferrer", style: { fontSize: '0.92rem', color: TEXT_S, textDecoration: 'none' }, children: profile.website_url })] })), Object.entries(profile.social_links ?? {}).map(([k, v]) => v ? (_jsxs("div", { style: { marginBottom: '0.75rem' }, children: [_jsx("div", { style: { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.2rem' }, children: k }), _jsx("a", { href: v, target: "_blank", rel: "noopener noreferrer", style: { fontSize: '0.88rem', color: TEXT_S, textDecoration: 'none' }, children: v })] }, k)) : null)] }), _jsx("div", { children: sent ? (_jsx("div", { style: {
                            background: SURFACE, border: `1px solid rgba(201,168,64,0.25)`,
                            borderRadius: '10px', padding: '2.5rem',
                            textAlign: 'center', color: GOLD_BR,
                            fontSize: '1rem', fontWeight: 600,
                        }, children: "Message received. I'll be in touch soon." })) : (_jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_M, marginBottom: '0.4rem' }, children: "Your Name" }), _jsx("input", { name: "name", value: form.name, onChange: handleChange, required: true, style: inputStyle, placeholder: "Full name" })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_M, marginBottom: '0.4rem' }, children: "Email" }), _jsx("input", { name: "email", type: "email", value: form.email, onChange: handleChange, required: true, style: inputStyle, placeholder: "your@email.com" })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_M, marginBottom: '0.4rem' }, children: "Message" }), _jsx("textarea", { name: "message", value: form.message, onChange: handleChange, required: true, rows: 5, style: { ...inputStyle, resize: 'vertical' }, placeholder: "Tell me about your project..." })] }), _jsx("button", { type: "submit", style: {
                                    background: GOLD_GRAD, border: 'none', cursor: 'pointer',
                                    color: '#1a0e00', fontWeight: 800, fontSize: '0.85rem',
                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                    padding: '0.95rem', borderRadius: '6px', marginTop: '0.25rem',
                                }, children: "Send Message" })] })) })] }) }));
}
// ── Footer ────────────────────────────────────────────────────────────────────
function SiteFooter({ brand }) {
    const name = brand.space_name || brand.display_name || 'PAGIOSystems';
    const year = new Date().getFullYear();
    return (_jsxs("footer", { style: {
            background: '#050609',
            borderTop: `1px solid rgba(201,168,64,0.1)`,
            padding: '2rem clamp(1.5rem,6vw,5rem)',
        }, children: [_jsxs("div", { style: {
                    maxWidth: '1140px', margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '1rem',
                }, children: [_jsxs("div", { style: {
                            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
                            textTransform: 'uppercase', color: TEXT_M,
                        }, children: [name, " \u00B7 ", year] }), _jsx("div", { style: { display: 'flex', gap: '1.5rem' }, children: NAV_LINKS.map(l => (_jsx("button", { onClick: () => scrollTo(l.id), style: {
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em',
                                textTransform: 'uppercase', color: TEXT_M,
                            }, children: l.label }, l.id))) })] }), _jsx("div", { style: { height: '3px', background: GOLD_GRAD, marginTop: '1.5rem', maxWidth: '1140px', margin: '1.5rem auto 0' } })] }));
}
// ── Edit FAB (floating action button for authenticated users) ─────────────────
function EditFAB() {
    return (_jsx("a", { href: "/identity/edit", style: {
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 200,
            background: GOLD_GRAD, color: '#1a0e00',
            fontWeight: 800, fontSize: '0.75rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.75rem 1.25rem', borderRadius: '50px',
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(201,168,64,0.3)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
        }, children: "\u270E Edit Profile" }));
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
export default function IdentityPage({ isAuthed = false }) {
    const [data, setData] = useState(null);
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
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);
    if (loading) {
        return _jsx("div", { style: { minHeight: '100vh', background: BG } });
    }
    const profile = data?.profile ?? {};
    const brand = data?.onboarding ?? {};
    const services = data?.services ?? [];
    const experience = data?.experience ?? [];
    const projects = data?.projects ?? [];
    const credentials = data?.credentials ?? [];
    const skills = data?.skills ?? [];
    const visibility = profile.section_visibility ?? {};
    return (_jsxs("div", { style: { background: BG, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: TEXT }, children: [_jsx(SiteNav, { brand: brand, isAuthed: isAuthed }), _jsx(HeroSection, { profile: profile, brand: brand }), visibility['about'] !== false && _jsx(AboutSection, { profile: profile, brand: brand, skills: skills }), visibility['services'] !== false && _jsx(ServicesSection, { services: services }), visibility['experience'] !== false && _jsx(ExperienceSection, { experience: experience }), visibility['projects'] !== false && _jsx(ProjectsSection, { projects: projects }), visibility['credentials'] !== false && credentials.length > 0 && _jsx(CredentialsSection, { credentials: credentials }), visibility['contact'] !== false && _jsx(ContactSection, { profile: profile }), _jsx(SiteFooter, { brand: brand }), isAuthed && _jsx(EditFAB, {})] }));
}
