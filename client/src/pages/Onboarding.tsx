import { useState, useRef } from 'react';
import Nav from '../components/onboarding/Nav';
import StepShell from '../components/onboarding/StepShell';
import ImageCropModal from '../components/onboarding/ImageCropModal';

type StepId = 'welcome' | 'credentials' | 'name' | 'phone' | 'email' | 'address' | 'logo' | 'spacename' | 'brandlogo' | 'brandcolors' | 'review';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  phonePrefix: string;
  phonePrefixCustom: string;
  phone: string;
  phoneType: 'home' | 'cell' | 'work';
  email: string;
  emailType: 'personal' | 'work';
  addrLine1: string;
  addrLine2: string;
  addrCity: string;
  addrState: string;
  addrZip: string;
  addrType: 'home' | 'mailing';
  addrInternational: boolean;
  addrFreeform: string;
  addrCountry: string;
  logoFile: File | null;
  logoPreview: string | null;
  spaceName: string;
  brandLogoFile: File | null;
  brandLogoPreview: string | null;
  brandColorPrimary: string;
  brandColorSecondary: string;
}

const EMPTY: FormData = {
  username: '', password: '', confirmPassword: '',
  name: '',
  phonePrefix: '+1', phonePrefixCustom: '', phone: '', phoneType: 'cell',
  email: '', emailType: 'personal',
  addrLine1: '', addrLine2: '', addrCity: '', addrState: '', addrZip: '', addrType: 'home',
  addrInternational: false, addrFreeform: '', addrCountry: '',
  logoFile: null, logoPreview: null,
  spaceName: '',
  brandLogoFile: null, brandLogoPreview: null,
  brandColorPrimary: '#7c3aed', brandColorSecondary: '',
};

const DIAL_CODES = [
  { code: '+1',   label: '+1  US / Canada' },
  { code: '+44',  label: '+44  UK' },
  { code: '+52',  label: '+52  Mexico' },
  { code: '+61',  label: '+61  Australia' },
  { code: '+33',  label: '+33  France' },
  { code: '+49',  label: '+49  Germany' },
  { code: '+39',  label: '+39  Italy' },
  { code: '+34',  label: '+34  Spain' },
  { code: '+81',  label: '+81  Japan' },
  { code: '+86',  label: '+86  China' },
  { code: '+91',  label: '+91  India' },
  { code: '+55',  label: '+55  Brazil' },
  { code: '+7',   label: '+7   Russia' },
  { code: '+27',  label: '+27  South Africa' },
  { code: '+971', label: '+971 UAE' },
  { code: '+other', label: 'Other…' },
];

const US_STATES = [
  { value: '', label: 'State / Territory' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
  // Territories
  { value: 'AS', label: 'American Samoa' },
  { value: 'GU', label: 'Guam' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'VI', label: 'U.S. Virgin Islands' },
  // Separator
  { value: 'OTHER', label: '── Outside the US ──' },
];

const STEPS: StepId[] = ['welcome', 'credentials', 'name', 'phone', 'email', 'address', 'logo', 'review'];
const TOTAL_STEPS = 6;

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: '#1c1c1c',
  border: '1px solid rgba(255,255,255,0.28)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: '#1c1c1c',
  border: '1px solid rgba(255,255,255,0.28)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
};

const btnStyle: React.CSSProperties = {
  padding: '0.75rem 2.5rem',
  background: '#fff',
  color: '#0d0d0d',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: '0.5rem',
};

function SelectWrapper({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select style={selectStyle} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none', fontSize: '0.75rem' }}>▾</span>
    </div>
  );
}

interface Props { onComplete: (token: string) => void; onLogin?: () => void; }

export default function Onboarding({ onComplete, onLogin }: Props) {
  const [step, setStep] = useState<StepId>('welcome');
  const [form, setForm] = useState<FormData>(EMPTY);
  const [editingFrom, setEditingFrom] = useState<StepId | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openCrop = (file: File) => setCropSrc(URL.createObjectURL(file));
  const set = (patch: Partial<FormData>) => setForm(f => ({ ...f, ...patch }));

  const idx = STEPS.indexOf(step);

  const go = (target: StepId) => { setEditingFrom(null); setStep(target); };
  const next = () => { if (editingFrom) { go('review'); return; } const n = STEPS[idx + 1]; if (n) setStep(n); };
  const back = () => { if (editingFrom) { go('review'); return; } const p = STEPS[idx - 1]; if (p) setStep(p); };
  const skip = () => { if (editingFrom) { go('review'); return; } const n = STEPS[idx + 1]; if (n) setStep(n); };
  const resetSession = () => { setForm(EMPTY); setEditingFrom(null); setStep('welcome'); };
  const editStep = (target: StepId) => { setEditingFrom('review'); setStep(target); };

  const confirm = async () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('spaceName', 'Command Center');
    const prefix = form.phonePrefix === '+other' ? form.phonePrefixCustom : form.phonePrefix;
    fd.append('phone', form.phone ? `${prefix} ${form.phone}` : '');
    fd.append('phoneType', form.phoneType);
    fd.append('email', form.email);
    fd.append('emailType', form.emailType);
    fd.append('addrInternational', String(form.addrInternational));
    fd.append('addrType', form.addrType);
    if (form.addrInternational) {
      fd.append('addrFreeform', form.addrFreeform);
      fd.append('addrCountry', form.addrCountry);
    } else {
      fd.append('addrLine1', form.addrLine1);
      fd.append('addrLine2', form.addrLine2);
      fd.append('addrCity', form.addrCity);
      fd.append('addrState', form.addrState);
      fd.append('addrZip', form.addrZip);
    }
    if (form.logoFile) fd.append('logo', form.logoFile);
    if (form.brandLogoFile) fd.append('brandLogo', form.brandLogoFile);
    fd.append('brandColorPrimary', form.brandColorPrimary);
    if (form.brandColorSecondary) fd.append('brandColorSecondary', form.brandColorSecondary);
    await fetch('/api/onboarding/save', { method: 'POST', body: fd });
    await fetch('/api/onboarding/complete', { method: 'POST' });
    const authRes = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username.trim().toLowerCase(), password: form.password }),
    });
    const authData = await authRes.json();
    onComplete(authData.token ?? '');
  };

  const continueLabel = editingFrom ? 'Back to review' : 'Continue';

  // ── Welcome ───────────────────────────────────────────────────────────────
  if (step === 'welcome') return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Nav showBack showSkip backDisabled onSkip={() => setStep('credentials')} onBack={() => {}} onReset={resetSession} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', maxWidth: '480px', width: '100%', padding: '2.25rem', textAlign: 'center', background: 'transparent' }}>
        <h1 style={{ fontSize: '5rem', fontWeight: 700, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>RAVEN</h1>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.6, margin: 0 }}>
          Recursive Autonomous Vectorized Execution Network
        </p>
        <button style={{ ...btnStyle, marginTop: '1rem' }} onClick={() => setStep('credentials')}>Get started</button>
        {onLogin && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
            Already in Command?{' '}
            <button onClick={onLogin} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}>
              Login
            </button>
          </p>
        )}
      </div>
      <div style={{ position: 'fixed', bottom: '1.5rem', left: 0, right: 0, textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
          Presented by PAGIOSystems&nbsp;&nbsp;|&nbsp;&nbsp;Private Advanced Gradient Intelligence Operating Systems
        </p>
      </div>
    </div>
  );

  // ── Credentials ───────────────────────────────────────────────────────────
  if (step === 'credentials') {
    const credValid = form.username.trim().length >= 3 && form.password.length >= 8 && form.password === form.confirmPassword;
    const pwMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
    return (
      <StepShell step={1} total={TOTAL_STEPS} title="Create your login" subtitle="You'll use these to sign in each time.">
        <Nav showBack showSkip skipDisabled onBack={back} onSkip={skip} onReset={resetSession} />
        <input style={{ ...inputStyle, textAlign: 'center' }} autoFocus placeholder="Username (min. 3 characters)"
          autoComplete="off" value={form.username} onChange={e => set({ username: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && credValid && next()} />
        <input style={{ ...inputStyle, textAlign: 'center' }} type="password" placeholder="Password (min. 8 characters)"
          autoComplete="new-password" value={form.password} onChange={e => set({ password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && credValid && next()} />
        <input
          style={{ ...inputStyle, textAlign: 'center', borderColor: pwMismatch ? '#f87171' : undefined }}
          type="password" placeholder="Confirm password"
          autoComplete="new-password" value={form.confirmPassword} onChange={e => set({ confirmPassword: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && credValid && next()}
        />
        {pwMismatch && <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>Passwords don't match</p>}
        <button style={{ ...btnStyle, opacity: credValid ? 1 : 0.35 }} disabled={!credValid} onClick={next}>
          {continueLabel}
        </button>
      </StepShell>
    );
  }

  // ── Name ──────────────────────────────────────────────────────────────────
  if (step === 'name') return (
    <StepShell step={2} total={TOTAL_STEPS} title="What's your name?">
      <Nav showBack showSkip skipDisabled onBack={back} onSkip={skip} onReset={resetSession} />
      <input style={{ ...inputStyle, textAlign: 'center' }} autoFocus placeholder="Your name"
        value={form.name} onChange={e => set({ name: e.target.value })}
        onKeyDown={e => e.key === 'Enter' && form.name.trim() && next()} />
      <button style={{ ...btnStyle, opacity: form.name.trim() ? 1 : 0.35 }} disabled={!form.name.trim()} onClick={next}>
        {continueLabel}
      </button>
    </StepShell>
  );

  // ── Phone ─────────────────────────────────────────────────────────────────
  if (step === 'phone') return (
    <StepShell step={3} total={TOTAL_STEPS} title="Phone number" subtitle="Optional">
      <Nav showBack showSkip onBack={back} onSkip={skip} onReset={resetSession} />
      <SelectWrapper value={form.phoneType} onChange={v => set({ phoneType: v as FormData['phoneType'] })}
        options={[{ value: 'cell', label: 'Cell' }, { value: 'home', label: 'Home' }, { value: 'work', label: 'Work' }]} />
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            style={{ ...selectStyle, width: '140px', paddingRight: '1.75rem', fontSize: '0.85rem' }}
            value={form.phonePrefix}
            onChange={e => set({ phonePrefix: e.target.value, phonePrefixCustom: '' })}
          >
            {DIAL_CODES.map(d => (
              <option key={d.code} value={d.code} style={{ background: '#1a1a1a' }}>{d.label}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none', fontSize: '0.7rem' }}>▾</span>
        </div>
        {form.phonePrefix === '+other' ? (
          <input style={{ ...inputStyle, width: '80px', textAlign: 'center', flexShrink: 0 }}
            placeholder="+__" maxLength={6}
            value={form.phonePrefixCustom}
            onChange={e => set({ phonePrefixCustom: e.target.value })} />
        ) : null}
        <input style={{ ...inputStyle, flex: 1 }} autoFocus type="tel"
          placeholder="000-000-0000"
          value={form.phone} onChange={e => set({ phone: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && next()} />
      </div>
      <button style={btnStyle} onClick={next}>{continueLabel}</button>
    </StepShell>
  );

  // ── Email ─────────────────────────────────────────────────────────────────
  if (step === 'email') return (
    <StepShell step={4} total={TOTAL_STEPS} title="Email address" subtitle="Optional">
      <Nav showBack showSkip onBack={back} onSkip={skip} onReset={resetSession} />
      <SelectWrapper value={form.emailType} onChange={v => set({ emailType: v as FormData['emailType'] })}
        options={[{ value: 'personal', label: 'Personal' }, { value: 'work', label: 'Work' }]} />
      <input style={{ ...inputStyle, textAlign: 'center' }} autoFocus type="email" placeholder="you@example.com"
        value={form.email} onChange={e => set({ email: e.target.value })}
        onKeyDown={e => e.key === 'Enter' && next()} />
      <button style={btnStyle} onClick={next}>{continueLabel}</button>
    </StepShell>
  );

  // ── Address ───────────────────────────────────────────────────────────────
  if (step === 'address') return (
    <StepShell step={5} total={TOTAL_STEPS} title="Address" subtitle="Optional">
      <Nav showBack showSkip onBack={back} onSkip={skip} onReset={resetSession} />
      <SelectWrapper value={form.addrType} onChange={v => set({ addrType: v as FormData['addrType'] })}
        options={[{ value: 'home', label: 'Home Address' }, { value: 'mailing', label: 'Mailing Address' }]} />

      {form.addrInternational ? (
        <>
          <textarea
            style={{ ...inputStyle, resize: 'none', minHeight: '100px', lineHeight: 1.6 }}
            autoFocus
            placeholder={'Street address, city, region, postal code'}
            value={form.addrFreeform}
            onChange={e => set({ addrFreeform: e.target.value })}
          />
          <input style={inputStyle} placeholder="Country" value={form.addrCountry} onChange={e => set({ addrCountry: e.target.value })} />
          <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
            onClick={() => set({ addrInternational: false, addrFreeform: '', addrCountry: '' })}>
            Switch to US address
          </button>
        </>
      ) : (
        <>
          <input style={inputStyle} autoFocus placeholder="Street address" value={form.addrLine1} onChange={e => set({ addrLine1: e.target.value })} />
          <input style={inputStyle} placeholder="Apt, suite, unit (optional)" value={form.addrLine2} onChange={e => set({ addrLine2: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px', gap: '0.5rem', width: '100%' }}>
            <input style={inputStyle} placeholder="City" value={form.addrCity} onChange={e => set({ addrCity: e.target.value })} />
            <div style={{ position: 'relative' }}>
              <select
                style={{ ...selectStyle, width: '100%' }}
                value={form.addrState}
                onChange={e => {
                  if (e.target.value === 'OTHER') {
                    set({ addrInternational: true, addrState: '', addrLine1: '', addrLine2: '', addrCity: '', addrZip: '' });
                  } else {
                    set({ addrState: e.target.value });
                  }
                }}
              >
                {US_STATES.map(s => (
                  <option key={s.value} value={s.value} style={{ background: '#1a1a1a' }}>{s.label}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none', fontSize: '0.7rem' }}>▾</span>
            </div>
            <input style={inputStyle} placeholder="ZIP" value={form.addrZip} onChange={e => set({ addrZip: e.target.value })} />
          </div>
        </>
      )}

      <button style={btnStyle} onClick={next}>{continueLabel}</button>
    </StepShell>
  );

  // ── Profile Image ─────────────────────────────────────────────────────────
  if (step === 'logo') return (
    <StepShell step={6} total={TOTAL_STEPS} title="Profile image" subtitle="Optional — shown in your header">
      <Nav showBack showSkip onBack={back} onSkip={skip} onReset={resetSession} />

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onConfirm={(blob, preview) => {
            set({ logoFile: new File([blob], 'profile.jpg', { type: 'image/jpeg' }), logoPreview: preview });
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Drop zone */}
      <div
        style={{
          width: '160px', height: '160px',
          border: form.logoPreview ? '2px solid rgba(255,255,255,0.3)' : '2px dashed rgba(255,255,255,0.15)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', position: 'relative',
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) openCrop(f); }}
        onClick={() => !form.logoPreview && fileRef.current?.click()}
      >
        {form.logoPreview ? (
          <>
            <img src={form.logoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              onClick={() => fileRef.current?.click()}
            >
              <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>Change</span>
            </div>
          </>
        ) : (
          <span style={{ fontSize: '0.78rem', color: '#fff', textAlign: 'center', padding: '0 1rem', lineHeight: 1.5 }}>
            Drop image here
          </span>
        )}
      </div>

      {/* Browse button */}
      <button
        style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        onClick={() => fileRef.current?.click()}
      >
        Browse device
      </button>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; openCrop(f); } }} />

      <button style={btnStyle} onClick={next}>{continueLabel}</button>
    </StepShell>
  );

  // ── Review ────────────────────────────────────────────────────────────────
  if (step === 'review') {
    const addrValue = form.addrInternational
      ? [form.addrFreeform, form.addrCountry].filter(Boolean).join('\n') || null
      : [form.addrLine1, form.addrLine2, form.addrCity && `${form.addrCity}, ${form.addrState} ${form.addrZip}`.trim()]
          .filter(Boolean).join('\n') || null;

    const rows: { label: string; sub?: string; value: string | null; multiline?: boolean; step: StepId }[] = [
      { label: 'Name', value: form.name || null, step: 'name' },
      { label: 'Phone', sub: form.phone ? form.phoneType : undefined, value: form.phone || null, step: 'phone' },
      { label: 'Email', sub: form.email ? form.emailType : undefined, value: form.email || null, step: 'email' },
      { label: 'Address', sub: addrValue ? form.addrType : undefined, value: addrValue, multiline: true, step: 'address' },
      { label: 'Profile image', value: form.logoFile ? form.logoFile.name : null, step: 'logo' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4rem', paddingBottom: '2rem' }}>
        <Nav showBack showSkip onBack={back} onSkip={confirm} onReset={resetSession} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '440px', width: '100%', padding: '2.25rem', background: 'transparent' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fff', textAlign: 'center' }}>Review</h2>
          <p style={{ fontSize: '0.78rem', color: '#fff', textAlign: 'center' }}>Click any row to edit. Nothing is saved until you confirm.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rows.map(r => (
              <button key={r.step}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.85rem 1rem', background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
                onClick={() => editStep(r.step)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: '60px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#fff' }}>{r.label}</span>
                  {r.sub && <span style={{ fontSize: '0.7rem', color: '#fff', textTransform: 'capitalize' }}>{r.sub}</span>}
                </div>
                <span style={{ fontSize: '0.88rem', color: r.value ? '#fff' : 'rgba(255,255,255,0.2)', flex: 1, textAlign: 'right', whiteSpace: r.multiline ? 'pre-line' : 'nowrap', overflow: 'hidden', textOverflow: r.multiline ? 'clip' : 'ellipsis' }}>
                  {r.value ?? '—'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#fff', flexShrink: 0 }}>edit</span>
              </button>
            ))}
          </div>

          {form.logoPreview && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src={form.logoPreview} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="profile" />
            </div>
          )}

          <button style={{ padding: '0.85rem', background: '#fff', color: '#0d0d0d', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }} onClick={confirm}>
            Confirm & continue
          </button>
        </div>
      </div>
    );
  }

  return null;
}
