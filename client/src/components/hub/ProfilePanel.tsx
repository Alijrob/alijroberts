import { useState, useEffect, useRef } from 'react';

interface ProfileState {
  name: string;
  spaceName: string;
  phone: string;
  phoneType: string;
  email: string;
  emailType: string;
  addrType: string;
  addrLine1: string;
  addrLine2: string;
  addrCity: string;
  addrState: string;
  addrZip: string;
  logoPath: string | null;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const GOLD = '#c9a840';
const NAVY = '#1c2866';

const inputStyle: React.CSSProperties = {
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

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.3rem',
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

export default function ProfilePanel({ onClose, onSaved }: Props) {
  const [form, setForm] = useState<ProfileState>({
    name: '', spaceName: '', phone: '', phoneType: 'cell',
    email: '', emailType: 'personal',
    addrType: 'home', addrLine1: '', addrLine2: '', addrCity: '', addrState: '', addrZip: '',
    logoPath: null,
  });
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<ProfileState>) => setForm(f => ({ ...f, ...patch }));

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = '';
    setNewPhotoFile(f);
    setNewPhotoPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
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
    if (newPhotoFile) fd.append('logo', newPhotoFile);

    try {
      await fetch('/api/onboarding/save', { method: 'POST', body: fd });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: NAVY, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>Profile Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '2px 4px', fontWeight: 300 }}>✕</button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>Loading…</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Profile photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{ position: 'relative', width: '88px', height: '88px', cursor: 'pointer' }}
                onClick={() => fileRef.current?.click()}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="profile" style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}55` }} />
                ) : (
                  <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: '#f3f4f6', border: `2px solid ${GOLD}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.8rem', color: '#9ca3af' }}>👤</span>
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 600 }}>Change</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <button onClick={() => fileRef.current?.click()} style={{ fontSize: '0.8rem', color: NAVY, background: 'none', border: `1px solid ${NAVY}44`, borderRadius: '5px', padding: '0.3rem 0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                Change Photo
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 }} />

            {/* Identity */}
            <Field label="Full Name">
              <input style={inputStyle} value={form.name} onChange={e => set({ name: e.target.value })} placeholder="Your full name" />
            </Field>

            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 }} />

            {/* Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'end' }}>
              <Field label="Phone Type">
                <div style={{ position: 'relative' }}>
                  <select style={selectStyle} value={form.phoneType} onChange={e => set({ phoneType: e.target.value })}>
                    <option value="cell">Cell</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                  </select>
                  <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#6b7280' }}>▾</span>
                </div>
              </Field>
              <Field label="Phone Number">
                <input style={inputStyle} value={form.phone} onChange={e => set({ phone: e.target.value })} placeholder="+1 000-000-0000" type="tel" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'end' }}>
              <Field label="Email Type">
                <div style={{ position: 'relative' }}>
                  <select style={selectStyle} value={form.emailType} onChange={e => set({ emailType: e.target.value })}>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                  </select>
                  <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#6b7280' }}>▾</span>
                </div>
              </Field>
              <Field label="Email Address">
                <input style={inputStyle} value={form.email} onChange={e => set({ email: e.target.value })} placeholder="you@example.com" type="email" />
              </Field>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 }} />

            {/* Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'end' }}>
              <Field label="Addr Type">
                <div style={{ position: 'relative' }}>
                  <select style={selectStyle} value={form.addrType} onChange={e => set({ addrType: e.target.value })}>
                    <option value="home">Home</option>
                    <option value="mailing">Mailing</option>
                  </select>
                  <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: '#6b7280' }}>▾</span>
                </div>
              </Field>
              <Field label="Street Address">
                <input style={inputStyle} value={form.addrLine1} onChange={e => set({ addrLine1: e.target.value })} placeholder="123 Main St" />
              </Field>
            </div>
            <Field label="Apt / Suite (optional)">
              <input style={inputStyle} value={form.addrLine2} onChange={e => set({ addrLine2: e.target.value })} placeholder="Apt 4B" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: '0.5rem' }}>
              <Field label="City">
                <input style={inputStyle} value={form.addrCity} onChange={e => set({ addrCity: e.target.value })} placeholder="City" />
              </Field>
              <Field label="State">
                <input style={inputStyle} value={form.addrState} onChange={e => set({ addrState: e.target.value })} placeholder="FL" maxLength={2} />
              </Field>
              <Field label="ZIP">
                <input style={inputStyle} value={form.addrZip} onChange={e => set({ addrZip: e.target.value })} placeholder="00000" />
              </Field>
            </div>

          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fafafa' }}>
          <span style={{ fontSize: '0.85rem', color: saved ? '#16a34a' : 'transparent', fontWeight: 600, transition: 'color 0.2s' }}>
            ✓ Saved
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              style={{ padding: '0.6rem 1.5rem', background: NAVY, border: 'none', borderRadius: '6px', cursor: saving ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 700, color: GOLD, opacity: !form.name.trim() ? 0.5 : 1, letterSpacing: '0.04em' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
