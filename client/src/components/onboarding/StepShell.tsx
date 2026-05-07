interface Props {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function StepShell({ step, total, title, subtitle, children }: Props) {
  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <p style={styles.stepLabel}>{step} of {total}</p>
        <h2 style={styles.title}>{title}</h2>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: '100vh',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '4rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
    maxWidth: '440px',
    width: '100%',
    padding: '2.25rem',
    textAlign: 'center',
    background: 'transparent',
  },
  stepLabel: {
    fontSize: '0.7rem',
    color: '#fff',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#fff',
    lineHeight: 1.6,
  },
};
