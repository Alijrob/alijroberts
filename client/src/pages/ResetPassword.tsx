import { useState } from 'react';

const METALLIC_GOLD = 'linear-gradient(90deg, #5c3d08 0%, #b8860b 20%, #f0d060 45%, #fffacd 55%, #f0d060 70%, #b8860b 85%, #5c3d08 100%)';

interface Props {
  token: string;
  onDone: () => void;
}

type Stage = 'form' | 'loading' | 'success' | 'error';

export default function ResetPassword({ token, onDone }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = newPassword.length >= 8 && newPassword === confirm;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStage('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Reset failed. The link may be expired.');
        setStage('error');
        return;
      }
      setStage('success');
      window.history.replaceState({}, '', '/');
      setTimeout(onDone, 2500);
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setStage('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(201,168,64,0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: '0.02em',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundImage: "url('/uploads/raven.png')",
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,40,102,0.93)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: METALLIC_GOLD }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: '1.5rem', padding: '2rem',
      }}>
        <img src="/uploads/raven.png" alt="logo" style={{
          width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px',
          filter: 'drop-shadow(0 0 16px rgba(201,168,64,0.6))',
        }} />

        <div style={{
          background: 'linear-gradient(180deg, #fff5a8 0%, #f0d060 28%, #c9a840 52%, #8b6008 72%, #c9a840 88%, #fff5a8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(0 0 8px rgba(201,168,64,0.7))',
          fontWeight: 800, fontStyle: 'italic', fontSize: '1.5rem',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Command Center
        </div>

        <div style={{
          width: '100%', maxWidth: '360px',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(201,168,64,0.2)',
          borderRadius: '12px',
          padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          backdropFilter: 'blur(8px)',
        }}>
          {stage === 'success' ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Password updated.</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: 0 }}>Redirecting to sign in…</p>
            </div>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0, textAlign: 'center' }}>
                Set a new password
              </p>

              <input
                style={inputStyle}
                type="password"
                placeholder="New password (min 8 chars)"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
                disabled={stage === 'loading'}
              />
              <input
                style={inputStyle}
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={stage === 'loading'}
              />

              {confirm && newPassword !== confirm && (
                <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>Passwords don't match.</p>
              )}
              {stage === 'error' && (
                <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>{errorMsg}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || stage === 'loading'}
                style={{
                  padding: '0.85rem',
                  background: METALLIC_GOLD,
                  border: 'none', borderRadius: '8px',
                  color: '#1a0e00', fontWeight: 800, fontSize: '0.95rem',
                  cursor: (!canSubmit || stage === 'loading') ? 'not-allowed' : 'pointer',
                  opacity: (!canSubmit || stage === 'loading') ? 0.5 : 1,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'opacity 0.15s',
                }}
              >
                {stage === 'loading' ? 'Saving…' : 'Set New Password'}
              </button>
            </>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          PAGIOSystems · Private
        </p>
      </div>
    </div>
  );
}
