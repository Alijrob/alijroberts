import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export default function StepShell({ step, total, title, subtitle, children }) {
    return (_jsx("div", { style: styles.screen, children: _jsxs("div", { style: styles.card, children: [_jsxs("p", { style: styles.stepLabel, children: [step, " of ", total] }), _jsx("h2", { style: styles.title, children: title }), subtitle && _jsx("p", { style: styles.subtitle, children: subtitle }), children] }) }));
}
const styles = {
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
