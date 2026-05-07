import { useState } from 'react';

const METALLIC_GOLD ='linear-gradient(90deg, #5c3d08 0%, #b8860b 20%, #f0d060 45%, #fffacd 55%, #f0d060 70%, #b8860b 85%, #5c3d08 100%)';

type View = 'login' | 'forgot' | 'forgot-sent';

interface Props {
  onLogin: (token: string, autoLogout: boolean) => void;
}

export default function Login({ onLogin }: Props) {
  const [view, setView] = useState<View>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgot = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Could not send reset email.');
        return;
      }
      setView('forgot-sent');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        setError('Invalid username or password.');
        return;
      }
      const data = await res.json();
      onLogin(data.token, data.autoLogout);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid rgba(201,168,64,0.3)`,
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
      backgroundImage: "url('/uploads/087ca06c-d805-432d-8b54-0a75673c8e10.PNG')",
      backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    }}>
      {/* Navy overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,40,102,0.93)' }} />

      {/* Gold bottom strip */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: METALLIC_GOLD }} />

      {/* Form */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: '1.5rem', padding: '2rem',
      }}>
        {/* Logo */}
        <img src="/uploads/087ca06c-d805-432d-8b54-0a75673c8e10.PNG" alt="PAGIOS Logo" style={{
          width: '120px', height: '120px', objectFit: 'contain',
          filter: 'drop-shadow(0 0 20px rgba(201,168,64,0.55))',
          marginBottom: '0.25rem',
        }} />

        {/* Title */}
        <div style={{
          background: 'linear-gradient(180deg, #fff5a8 0%, #f0d060 28%, #c9a840 52%, #8b6008 72%, #c9a840 88%, #fff5a8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(0 0 8px rgba(201,168,64,0.7))',
          fontWeight: 800, fontStyle: 'italic', fontSize: '1.5rem',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Pagios Command Center
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: '360px',
          background: 'rgba(0,0,0,0.35)',
          border: `1px solid rgba(201,168,64,0.2)`,
          borderRadius: '12px',
          padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          backdropFilter: 'blur(8px)',
        }}>
          {view === 'forgot-sent' ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Reset link sent.</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: 0 }}>Check your email — the link expires in 1 hour.</p>
              <button onClick={() => { setView('login'); setError(''); }} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'rgba(201,168,64,0.7)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to sign in
              </button>
            </div>
          ) : view === 'forgot' ? (
            <>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: 0, textAlign: 'center' }}>
                A reset link will be sent to your registered email address.
              </p>
              {error && (
                <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>{error}</p>
              )}
              <button
                onClick={handleForgot}
                disabled={loading}
                style={{
                  padding: '0.85rem',
                  background: METALLIC_GOLD,
                  border: 'none', borderRadius: '8px',
                  color: '#1a0e00', fontWeight: 800, fontSize: '0.95rem',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button onClick={() => { setView('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <input
                style={inputStyle}
                type="text"
                placeholder="Username"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
              <input
                style={inputStyle}
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />

              {error && (
                <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !username.trim() || !password}
                style={{
                  padding: '0.85rem',
                  background: METALLIC_GOLD,
                  border: 'none', borderRadius: '8px',
                  color: '#1a0e00', fontWeight: 800, fontSize: '0.95rem',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: (!username.trim() || !password) ? 0.5 : 1,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </>
          )}
        </div>

        {view === 'login' && (
          <button
            onClick={() => { setView('forgot'); setError(''); }}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem',
              cursor: 'pointer', letterSpacing: '0.03em',
              textDecoration: 'underline', marginTop: '-0.5rem',
            }}
          >
            Forgot my password
          </button>
        )}

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          PAGIOSystems · Private
        </p>
      </div>
    </div>
  );
}
