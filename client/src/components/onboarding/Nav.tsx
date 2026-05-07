import { useState } from 'react';

interface Props {
  onBack?: () => void;
  onSkip?: () => void;
  onReset: () => void;
  showBack: boolean;
  showSkip: boolean;
  backDisabled?: boolean;
  skipDisabled?: boolean;
}

export default function Nav({ onBack, onSkip, onReset, showBack, showSkip, backDisabled, skipDisabled }: Props) {
  const [showResetPrompt, setShowResetPrompt] = useState(false);

  return (
    <>
      <div style={styles.bar}>
        <div style={styles.left}>
          {showBack && (
            <button
              style={{ ...styles.navBtn, opacity: backDisabled ? 0.3 : 1, cursor: backDisabled ? 'default' : 'pointer' }}
              onClick={backDisabled ? undefined : onBack}
            >
              ← Back
            </button>
          )}
        </div>

        <div style={styles.right}>
          {showSkip && (
            <button
              style={{ ...styles.navBtn, opacity: skipDisabled ? 0.3 : 1, cursor: skipDisabled ? 'default' : 'pointer' }}
              onClick={skipDisabled ? undefined : onSkip}
            >
              Skip →
            </button>
          )}
          <button style={styles.resetBtn} onClick={() => setShowResetPrompt(true)}>
            Reset
          </button>
        </div>
      </div>

      {showResetPrompt && (
        <div style={styles.overlay}>
          <div style={styles.prompt}>
            <p style={styles.promptTitle}>Reset onboarding?</p>
            <p style={styles.promptBody}>Choose what to clear:</p>
            <div style={styles.promptActions}>
              <button style={styles.optionBtn} onClick={() => { setShowResetPrompt(false); onReset(); }}>
                Reset session
                <span style={styles.optionSub}>Clears what you've typed. Saved data untouched.</span>
              </button>
              <button
                style={{ ...styles.optionBtn, ...styles.optionBtnDanger }}
                onClick={async () => {
                  await fetch('/api/onboarding/reset', { method: 'POST' });
                  setShowResetPrompt(false);
                  onReset();
                }}
              >
                Full reset
                <span style={styles.optionSub}>Wipes all saved data. Clean slate.</span>
              </button>
            </div>
            <button style={styles.cancelBtn} onClick={() => setShowResetPrompt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.875rem 1.25rem',
    background: '#0d0d0d',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    zIndex: 50,
  },
  left: { display: 'flex', gap: '0.5rem' },
  right: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  navBtn: {
    background: '#1c1c1c',
    border: '1px solid rgba(255,255,255,0.28)',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    padding: '0.45rem 1rem',
    borderRadius: '5px',
  },
  resetBtn: {
    background: '#1c1c1c',
    border: '1px solid rgba(255,255,255,0.28)',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 500,
    padding: '0.45rem 0.9rem',
    borderRadius: '5px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  prompt: {
    background: '#161616',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    margin: '0 1rem',
  },
  promptTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#fff' },
  promptBody: { fontSize: '0.85rem', color: '#fff' },
  promptActions: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  optionBtn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    padding: '0.85rem 1rem',
    background: '#1c1c1c',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  },
  optionBtnDanger: {
    border: '1px solid rgba(255,80,80,0.5)',
    background: '#2a1010',
    color: '#ff6b6b',
  },
  optionSub: { fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)' },
  cancelBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
    alignSelf: 'center',
  },
};
