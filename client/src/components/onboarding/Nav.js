import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
export default function Nav({ onBack, onSkip, onReset, showBack, showSkip, backDisabled, skipDisabled }) {
    const [showResetPrompt, setShowResetPrompt] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: styles.bar, children: [_jsx("div", { style: styles.left, children: showBack && (_jsx("button", { style: { ...styles.navBtn, opacity: backDisabled ? 0.3 : 1, cursor: backDisabled ? 'default' : 'pointer' }, onClick: backDisabled ? undefined : onBack, children: "\u2190 Back" })) }), _jsxs("div", { style: styles.right, children: [showSkip && (_jsx("button", { style: { ...styles.navBtn, opacity: skipDisabled ? 0.3 : 1, cursor: skipDisabled ? 'default' : 'pointer' }, onClick: skipDisabled ? undefined : onSkip, children: "Skip \u2192" })), _jsx("button", { style: styles.resetBtn, onClick: () => setShowResetPrompt(true), children: "Reset" })] })] }), showResetPrompt && (_jsx("div", { style: styles.overlay, children: _jsxs("div", { style: styles.prompt, children: [_jsx("p", { style: styles.promptTitle, children: "Reset onboarding?" }), _jsx("p", { style: styles.promptBody, children: "Choose what to clear:" }), _jsxs("div", { style: styles.promptActions, children: [_jsxs("button", { style: styles.optionBtn, onClick: () => { setShowResetPrompt(false); onReset(); }, children: ["Reset session", _jsx("span", { style: styles.optionSub, children: "Clears what you've typed. Saved data untouched." })] }), _jsxs("button", { style: { ...styles.optionBtn, ...styles.optionBtnDanger }, onClick: async () => {
                                        await fetch('/api/onboarding/reset', { method: 'POST' });
                                        setShowResetPrompt(false);
                                        onReset();
                                    }, children: ["Full reset", _jsx("span", { style: styles.optionSub, children: "Wipes all saved data. Clean slate." })] })] }), _jsx("button", { style: styles.cancelBtn, onClick: () => setShowResetPrompt(false), children: "Cancel" })] }) }))] }));
}
const styles = {
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
