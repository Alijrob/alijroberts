import { useState, useEffect } from 'react';

const GOLD = '#c9a840';
const NAVY = '#1c2866';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.9rem',
  background: '#f9fafb',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.95rem',
  color: '#111',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: '0.3rem',
};

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

function SectionMsg({ msg, isError }: { msg: string; isError?: boolean }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: '0.82rem', color: isError ? '#dc2626' : '#16a34a', margin: 0, fontWeight: 600 }}>
      {isError ? '✕ ' : '✓ '}{msg}
    </p>
  );
}

interface Props {
  onLogout: () => void;
}

export default function SecurityPanel({ onLogout }: Props) {
  const token = localStorage.getItem('ajr_session_token') ?? '';

  const [username, setUsername] = useState('');
  const [autoLogout, setAutoLogout] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(true);

  // Change username fields
  const [newUsername, setNewUsername] = useState('');
  const [unPassword, setUnPassword] = useState('');
  const [unMsg, setUnMsg] = useState('');
  const [unError, setUnError] = useState(false);

  // Change password fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState(false);

  // Overall save state
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    fetch('/api/auth/preferences', { headers: { 'x-session-token': token } })
      .then(r => r.json())
      .then(d => {
        setUsername(d.username ?? '');
        setAutoLogout(d.autoLogout ?? true);
      })
      .finally(() => setPrefsLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    setSaveError(false);
    setUnMsg(''); setUnError(false);
    setPwMsg(''); setPwError(false);

    let anyError = false;

    // 1. Always save session preference
    try {
      await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-token': token },
        body: JSON.stringify({ autoLogout }),
      });
      localStorage.setItem('ajr_auto_logout', String(autoLogout));
    } catch {
      anyError = true;
    }

    // 2. Change username if fields are filled
    if (newUsername.trim() && unPassword) {
      try {
        const res = await fetch('/api/auth/change-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-session-token': token },
          body: JSON.stringify({ newUsername: newUsername.trim(), password: unPassword }),
        });
        if (res.ok) {
          setUsername(newUsername.trim().toLowerCase());
          setNewUsername('');
          setUnPassword('');
          setUnMsg('Username updated.');
        } else {
          const d = await res.json();
          setUnMsg(d.error || 'Failed to update username.');
          setUnError(true);
          anyError = true;
        }
      } catch {
        setUnMsg('Connection error.'); setUnError(true); anyError = true;
      }
    }

    // 3. Change password if fields are filled
    if (currentPw || newPw || confirmPw) {
      if (newPw !== confirmPw) {
        setPwMsg("New passwords don't match."); setPwError(true); anyError = true;
      } else if (newPw.length < 8) {
        setPwMsg('Password must be at least 8 characters.'); setPwError(true); anyError = true;
      } else if (!currentPw) {
        setPwMsg('Current password is required.'); setPwError(true); anyError = true;
      } else {
        try {
          const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-session-token': token },
            body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
          });
          if (res.ok) {
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setPwMsg('Password updated.');
          } else {
            const d = await res.json();
            setPwMsg(d.error || 'Failed to update password.');
            setPwError(true); anyError = true;
          }
        } catch {
          setPwMsg('Connection error.'); setPwError(true); anyError = true;
        }
      }
    }

    setSaving(false);
    if (!anyError) {
      setSaveMsg('All changes saved.');
      setSaveError(false);
    } else {
      setSaveMsg('Some changes could not be saved. See details above.');
      setSaveError(true);
    }
  };

  if (prefsLoading) return (
    <div style={{ padding: '3rem', color: '#888', textAlign: 'center' }}>Loading…</div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>Security</h2>

      {/* Session */}
      <div style={sectionStyle}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Session</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>
          Logged in as <strong>{username}</strong>
        </p>
        <div>
          <p style={{ ...labelStyle, marginBottom: '0.6rem' }}>Inactivity timeout</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { val: true,  label: 'Auto-logout after 10 minutes of inactivity' },
              { val: false, label: 'Stay logged in' },
            ].map(opt => (
              <label key={String(opt.val)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="autoLogout"
                  checked={autoLogout === opt.val}
                  onChange={() => setAutoLogout(opt.val)}
                  style={{ accentColor: NAVY, width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.92rem', color: '#374151' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ alignSelf: 'flex-start', padding: '0.55rem 1.25rem', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', color: '#6b7280', fontWeight: 600 }}
        >
          Sign out
        </button>
      </div>

      {/* Change username */}
      <div style={sectionStyle}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Change Username</h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>Leave blank to keep your current username.</p>
        <Field label="New Username">
          <input style={inputStyle} type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="new-username" autoComplete="off" />
        </Field>
        <Field label="Confirm with Current Password">
          <input style={inputStyle} type="password" value={unPassword} onChange={e => setUnPassword(e.target.value)} placeholder="Current password" autoComplete="current-password" />
        </Field>
        <SectionMsg msg={unMsg} isError={unError} />
      </div>

      {/* Change password */}
      <div style={sectionStyle}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Change Password</h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>Leave blank to keep your current password.</p>
        <Field label="Current Password">
          <input style={inputStyle} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" autoComplete="current-password" />
        </Field>
        <Field label="New Password">
          <input style={inputStyle} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
        </Field>
        <Field label="Confirm New Password">
          <input style={inputStyle} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" />
        </Field>
        <SectionMsg msg={pwMsg} isError={pwError} />
      </div>

      {/* Unified save footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem 1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
        <SectionMsg msg={saveMsg} isError={saveError} />
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.7rem 2rem',
            background: saving ? '#e5e7eb' : NAVY,
            color: saving ? '#9ca3af' : GOLD,
            border: 'none', borderRadius: '7px',
            fontWeight: 800, fontSize: '0.92rem',
            cursor: saving ? 'wait' : 'pointer',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
