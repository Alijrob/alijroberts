import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
const GOLD = '#c9a840';
const NAVY = '#1c2866';
const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.85rem',
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.95rem',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box',
};
const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.3rem',
    display: 'block',
};
const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
};
function Field({ label, children }) {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("span", { style: labelStyle, children: label }), children] }));
}
export default function ProfilePanel({ onClose, onSaved }) {
    const [form, setForm] = useState({
        name: '', spaceName: '', phone: '', phoneType: 'cell',
        email: '', emailType: 'personal',
        addrType: 'home', addrLine1: '', addrLine2: '', addrCity: '', addrState: '', addrZip: '',
        logoPath: null,
    });
    const [newPhotoFile, setNewPhotoFile] = useState(null);
    const [newPhotoPreview, setNewPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileRef = useRef(null);
    const set = (patch) => setForm(f => ({ ...f, ...patch }));
    useEffect(() => {
        fetch('/api/onboarding/state')
            .then(r => r.json())
            .then(data => {
            setForm({
                name: data.display_name || '',
                spaceName: data.space_name || '',
                phone: data.phone?.number || '',
                phoneType: data.phone?.type || 'cell',
                email: data.email?.email || '',
                emailType: data.email?.type || 'personal',
                addrType: data.address?.type || 'home',
                addrLine1: data.address?.line1 || '',
                addrLine2: data.address?.line2 || '',
                addrCity: data.address?.city || '',
                addrState: data.address?.state || '',
                addrZip: data.address?.zip || '',
                logoPath: data.logo_path || null,
            });
        })
            .finally(() => setLoading(false));
    }, []);
    const photoUrl = newPhotoPreview || (form.logoPath ? `/uploads/${form.logoPath}` : null);
    const handlePhotoChange = (e) => {
        const f = e.target.files?.[0];
        if (!f)
            return;
        e.target.value = '';
        setNewPhotoFile(f);
        setNewPhotoPreview(URL.createObjectURL(f));
    };
    const handleSave = async () => {
        if (!form.name.trim())
            return;
        setSaving(true);
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('spaceName', 'Command Center');
        fd.append('phone', form.phone.trim());
        fd.append('phoneType', form.phoneType);
        fd.append('email', form.email.trim());
        fd.append('emailType', form.emailType);
        fd.append('addrType', form.addrType);
        fd.append('addrLine1', form.addrLine1);
        fd.append('addrLine2', form.addrLine2);
        fd.append('addrCity', form.addrCity);
        fd.append('addrState', form.addrState);
        fd.append('addrZip', form.addrZip);
        fd.append('addrInternational', 'false');
        if (newPhotoFile)
            fd.append('logo', newPhotoFile);
        try {
            await fetch('/api/onboarding/save', { method: 'POST', body: fd });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            onSaved();
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }, onClick: e => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { style: { background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: NAVY, flexShrink: 0 }, children: [_jsx("h2", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }, children: "Profile Details" }), _jsx("button", { onClick: onClose, style: { background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '2px 4px', fontWeight: 300 }, children: "\u2715" })] }), loading ? (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }, children: "Loading\u2026" })) : (_jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }, children: [_jsxs("div", { style: { position: 'relative', width: '88px', height: '88px', cursor: 'pointer' }, onClick: () => fileRef.current?.click(), children: [photoUrl ? (_jsx("img", { src: photoUrl, alt: "profile", style: { width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}55` } })) : (_jsx("div", { style: { width: '88px', height: '88px', borderRadius: '50%', background: '#f3f4f6', border: `2px solid ${GOLD}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx("span", { style: { fontSize: '1.8rem', color: '#9ca3af' }, children: "\uD83D\uDC64" }) })), _jsx("div", { style: { position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }, onMouseEnter: e => (e.currentTarget.style.opacity = '1'), onMouseLeave: e => (e.currentTarget.style.opacity = '0'), children: _jsx("span", { style: { color: '#fff', fontSize: '0.72rem', fontWeight: 600 }, children: "Change" }) })] }), _jsx("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: handlePhotoChange }), _jsx("button", { onClick: () => fileRef.current?.click(), style: { fontSize: '0.8rem', color: NAVY, background: 'none', border: `1px solid ${NAVY}44`, borderRadius: '5px', padding: '0.3rem 0.85rem', cursor: 'pointer', fontWeight: 500 }, children: "Change Photo" })] }), _jsx("hr", { style: { border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 } }), _jsx(Field, { label: "Full Name", children: _jsx("input", { style: inputStyle, value: form.name, onChange: e => set({ name: e.target.value }), placeholder: "Your full name" }) }), _jsx("hr", { style: { border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 } }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'end' }, children: [_jsx(Field, { label: "Phone Type", children: _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("select", { style: selectStyle, value: form.phoneType, onChange: e => set({ phoneType: e.target.value }), children: [_jsx("option", { value: "cell", children: "Cell" }), _jsx("option", { value: "home", children: "Home" }), _jsx("option", { value: "work", children: "Work" })] }), _jsx("span", { style: { position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#6b7280' }, children: "\u25BE" })] }) }), _jsx(Field, { label: "Phone Number", children: _jsx("input", { style: inputStyle, value: form.phone, onChange: e => set({ phone: e.target.value }), placeholder: "+1 000-000-0000", type: "tel" }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'end' }, children: [_jsx(Field, { label: "Email Type", children: _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("select", { style: selectStyle, value: form.emailType, onChange: e => set({ emailType: e.target.value }), children: [_jsx("option", { value: "personal", children: "Personal" }), _jsx("option", { value: "work", children: "Work" })] }), _jsx("span", { style: { position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#6b7280' }, children: "\u25BE" })] }) }), _jsx(Field, { label: "Email Address", children: _jsx("input", { style: inputStyle, value: form.email, onChange: e => set({ email: e.target.value }), placeholder: "you@example.com", type: "email" }) })] }), _jsx("hr", { style: { border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 } }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'end' }, children: [_jsx(Field, { label: "Addr Type", children: _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("select", { style: selectStyle, value: form.addrType, onChange: e => set({ addrType: e.target.value }), children: [_jsx("option", { value: "home", children: "Home" }), _jsx("option", { value: "mailing", children: "Mailing" })] }), _jsx("span", { style: { position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#6b7280' }, children: "\u25BE" })] }) }), _jsx(Field, { label: "Street Address", children: _jsx("input", { style: inputStyle, value: form.addrLine1, onChange: e => set({ addrLine1: e.target.value }), placeholder: "123 Main St" }) })] }), _jsx(Field, { label: "Apt / Suite (optional)", children: _jsx("input", { style: inputStyle, value: form.addrLine2, onChange: e => set({ addrLine2: e.target.value }), placeholder: "Apt 4B" }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: '0.5rem' }, children: [_jsx(Field, { label: "City", children: _jsx("input", { style: inputStyle, value: form.addrCity, onChange: e => set({ addrCity: e.target.value }), placeholder: "City" }) }), _jsx(Field, { label: "State", children: _jsx("input", { style: inputStyle, value: form.addrState, onChange: e => set({ addrState: e.target.value }), placeholder: "FL", maxLength: 2 }) }), _jsx(Field, { label: "ZIP", children: _jsx("input", { style: inputStyle, value: form.addrZip, onChange: e => set({ addrZip: e.target.value }), placeholder: "00000" }) })] })] })), _jsxs("div", { style: { padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fafafa' }, children: [_jsx("span", { style: { fontSize: '0.85rem', color: saved ? '#16a34a' : 'transparent', fontWeight: 600, transition: 'color 0.2s' }, children: "\u2713 Saved" }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: onClose, style: { padding: '0.6rem 1.25rem', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }, children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: saving || !form.name.trim(), style: { padding: '0.6rem 1.5rem', background: NAVY, border: 'none', borderRadius: '6px', cursor: saving ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 700, color: GOLD, opacity: !form.name.trim() ? 0.5 : 1, letterSpacing: '0.04em' }, children: saving ? 'Saving…' : 'Save Changes' })] })] })] }) }));
}
