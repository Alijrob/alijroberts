import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
const PRESETS = {
    gmail: { imap_host: 'imap.gmail.com', imap_port: 993, smtp_host: 'smtp.gmail.com', smtp_port: 587, oauth: false },
    outlook: { imap_host: 'outlook.office365.com', imap_port: 993, smtp_host: 'smtp-mail.outlook.com', smtp_port: 587, oauth: true },
    hostinger: { imap_host: 'imap.hostinger.com', imap_port: 993, smtp_host: 'smtp.hostinger.com', smtp_port: 587, oauth: false },
};
export default function AccountSetup({ onSaved, onCancel }) {
    const [form, setForm] = useState({
        display_name: '', email_address: '', username: '', password: '',
        imap_host: '', imap_port: 993, smtp_host: '', smtp_port: 587,
    });
    const [isOAuth, setIsOAuth] = useState(false);
    const [testState, setTestState] = useState('idle');
    const [testError, setTestError] = useState('');
    const [saving, setSaving] = useState(false);
    const set = (key, value) => {
        setForm(f => ({ ...f, [key]: value }));
        setTestState('idle');
    };
    const applyPreset = (key) => {
        const preset = PRESETS[key];
        setForm(f => ({ ...f, imap_host: preset.imap_host, imap_port: preset.imap_port, smtp_host: preset.smtp_host, smtp_port: preset.smtp_port }));
        setIsOAuth(preset.oauth);
        setTestState('idle');
    };
    const handleEmail = (email) => {
        setForm(f => ({ ...f, email_address: email, username: f.username || email }));
        setTestState('idle');
    };
    const testConnection = async () => {
        setTestState('testing');
        setTestError('');
        try {
            const res = await fetch('/api/email/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imap_host: form.imap_host, imap_port: form.imap_port, username: form.username, password: form.password }),
            });
            const data = await res.json();
            setTestState(data.ok ? 'ok' : 'fail');
            if (!data.ok)
                setTestError(data.error ?? 'Connection failed');
        }
        catch {
            setTestState('fail');
            setTestError('Network error');
        }
    };
    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/email/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok)
                onSaved();
        }
        finally {
            setSaving(false);
        }
    };
    // For OAuth: create the account shell then redirect to Microsoft
    const connectMicrosoft = async () => {
        if (!form.display_name || !form.email_address) {
            setTestError('Fill in Display Name and Email Address first');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/email/accounts/oauth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: form.display_name,
                    email_address: form.email_address,
                    imap_host: form.imap_host || 'outlook.office365.com',
                    imap_port: form.imap_port || 993,
                    smtp_host: form.smtp_host || 'smtp-mail.outlook.com',
                    smtp_port: form.smtp_port || 587,
                    username: form.username || form.email_address,
                    oauth_provider: 'outlook',
                }),
            });
            const acct = await res.json();
            if (acct.id) {
                window.location.href = `/api/email/oauth/outlook/authorize?account_id=${acct.id}`;
            }
        }
        finally {
            setSaving(false);
        }
    };
    const canTest = !!(form.imap_host && form.username && form.password);
    const canSave = canTest && !!form.display_name && !!form.email_address && !!form.smtp_host && testState === 'ok';
    return (_jsxs("div", { style: s.wrap, children: [_jsxs("div", { style: s.header, children: [_jsx("h2", { style: s.title, children: "Add Email Account" }), _jsx("button", { style: s.closeBtn, onClick: onCancel, children: "\u2715" })] }), _jsxs("div", { style: s.body, children: [_jsxs("div", { style: s.presetRow, children: [_jsx("span", { style: s.presetLabel, children: "Quick fill:" }), ['gmail', 'outlook', 'hostinger'].map(p => (_jsx("button", { style: s.presetBtn, onClick: () => applyPreset(p), children: p === 'gmail' ? 'Gmail' : p === 'outlook' ? 'Outlook' : 'Hostinger' }, p)))] }), _jsxs("div", { style: s.grid2, children: [_jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "Display Name" }), _jsx("input", { style: s.input, value: form.display_name, onChange: e => set('display_name', e.target.value), placeholder: "Gmail \u2014 Jay" })] }), _jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "Email Address" }), _jsx("input", { style: s.input, type: "email", value: form.email_address, onChange: e => handleEmail(e.target.value), placeholder: "you@gmail.com" })] })] }), isOAuth ? (_jsxs("div", { style: s.oauthBox, children: [_jsx("div", { style: s.oauthIcon, children: "\uD83D\uDD10" }), _jsx("p", { style: s.oauthTitle, children: "Outlook uses Microsoft OAuth" }), _jsx("p", { style: s.oauthSub, children: "Clicking below opens Microsoft's login page. After you approve, you'll be redirected back here automatically." }), testError && _jsxs("div", { style: { ...s.alert, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }, children: ["\u2717 ", testError] }), _jsx("button", { style: s.msBtn, onClick: connectMicrosoft, disabled: saving, children: saving ? 'Redirecting…' : 'Connect with Microsoft' })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: s.grid2, children: [_jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "Username" }), _jsx("input", { style: s.input, value: form.username, onChange: e => set('username', e.target.value), placeholder: "Same as email" })] }), _jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "App Password" }), _jsx("input", { style: s.input, type: "password", value: form.password, onChange: e => set('password', e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "new-password" })] })] }), _jsx("div", { style: s.sectionDivider, children: "IMAP \u2014 Incoming" }), _jsxs("div", { style: s.grid2, children: [_jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "Host" }), _jsx("input", { style: s.input, value: form.imap_host, onChange: e => set('imap_host', e.target.value), placeholder: "imap.gmail.com" })] }), _jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "Port" }), _jsx("input", { style: s.input, type: "number", value: form.imap_port, onChange: e => set('imap_port', parseInt(e.target.value)) })] })] }), _jsx("div", { style: s.sectionDivider, children: "SMTP \u2014 Outgoing" }), _jsxs("div", { style: s.grid2, children: [_jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "Host" }), _jsx("input", { style: s.input, value: form.smtp_host, onChange: e => set('smtp_host', e.target.value), placeholder: "smtp.gmail.com" })] }), _jsxs("div", { style: s.field, children: [_jsx("label", { style: s.label, children: "Port" }), _jsx("input", { style: s.input, type: "number", value: form.smtp_port, onChange: e => set('smtp_port', parseInt(e.target.value)) })] })] }), testState === 'ok' && (_jsx("div", { style: { ...s.alert, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }, children: "\u2713 Connection successful \u2014 ready to save" })), testState === 'fail' && (_jsxs("div", { style: { ...s.alert, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }, children: ["\u2717 ", testError] })), _jsxs("div", { style: s.footer, children: [_jsx("button", { style: s.cancelBtn, onClick: onCancel, children: "Cancel" }), _jsx("button", { style: { ...s.testBtn, opacity: canTest ? 1 : 0.4 }, onClick: testConnection, disabled: !canTest || testState === 'testing', children: testState === 'testing' ? 'Testing…' : 'Test Connection' }), _jsx("button", { style: { ...s.saveBtn, opacity: canSave ? 1 : 0.4 }, onClick: save, disabled: !canSave || saving, children: saving ? 'Saving…' : 'Save Account' })] })] })), isOAuth && (_jsx("div", { style: s.oauthFooter, children: _jsx("button", { style: s.cancelBtn, onClick: onCancel, children: "Cancel" }) }))] })] }));
}
const s = {
    wrap: { display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb' },
    title: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1c2866' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#6b7280', padding: '4px 8px', borderRadius: 4 },
    body: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
    presetRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    presetLabel: { fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 },
    presetBtn: { fontSize: '0.78rem', padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb', cursor: 'pointer', fontWeight: 500 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: '0.72rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem', color: '#111', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' },
    sectionDivider: { fontSize: '0.7rem', fontWeight: 700, color: '#1c2866', letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: '0.75rem', borderTop: '1px solid #f0f0f0', marginTop: '0.25rem' },
    alert: { padding: '0.625rem 1rem', borderRadius: 6, fontSize: '0.875rem', fontWeight: 500 },
    oauthBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', background: '#f0f4ff', borderRadius: 8, textAlign: 'center' },
    oauthIcon: { fontSize: '2rem' },
    oauthTitle: { margin: 0, fontWeight: 700, color: '#1c2866', fontSize: '0.95rem' },
    oauthSub: { margin: 0, fontSize: '0.8rem', color: '#555', maxWidth: 380 },
    msBtn: { padding: '0.65rem 1.5rem', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' },
    footer: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' },
    oauthFooter: { display: 'flex', justifyContent: 'flex-end' },
    cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#374151' },
    testBtn: { padding: '0.5rem 1rem', border: '1px solid #1c2866', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#1c2866' },
    saveBtn: { padding: '0.5rem 1.25rem', border: 'none', borderRadius: 6, background: '#c9a840', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, color: '#fff' },
};
