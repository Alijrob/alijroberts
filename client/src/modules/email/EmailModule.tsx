import { useState, useEffect } from 'react';
import AccountList, { type EmailAccount } from './AccountList';
import AccountSetup from './AccountSetup';
import FolderTree from './FolderTree';
import MessageList, { type Message } from './MessageList';
import MessageReader from './MessageReader';

export default function EmailModule() {
  const [accounts, setAccounts]         = useState<EmailAccount[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showSetup, setShowSetup]       = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder]       = useState('INBOX');
  const [selectedMessage, setSelectedMessage]     = useState<Message | null>(null);
  const [oauthBanner, setOauthBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadAccounts = async () => {
    const res  = await fetch('/api/email/accounts');
    const data = await res.json();
    setAccounts(data);
    if (data.length && !selectedAccountId) setSelectedAccountId(data[0].id);
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
    const params = new URLSearchParams(window.location.search);
    if (params.get('email_oauth_success')) {
      setOauthBanner({ ok: true, msg: 'Outlook connected successfully' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('email_oauth_error')) {
      setOauthBanner({ ok: false, msg: params.get('email_oauth_error') ?? 'OAuth failed' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const onAccountAdded = () => { setShowSetup(false); loadAccounts(); };

  const handleSelectFolder = (path: string) => {
    setSelectedFolder(path);
    setSelectedMessage(null);
  };

  const handleSelectAccount = (id: number) => {
    setSelectedAccountId(id);
    setSelectedFolder('INBOX');
    setSelectedMessage(null);
  };

  if (loading) return <div style={s.loading}>Loading…</div>;

  return (
    <div style={s.root}>
      {oauthBanner && (
        <div style={{ ...s.banner, background: oauthBanner.ok ? '#f0fdf4' : '#fef2f2', color: oauthBanner.ok ? '#15803d' : '#dc2626', borderBottom: `1px solid ${oauthBanner.ok ? '#bbf7d0' : '#fecaca'}` }}>
          {oauthBanner.ok ? '✓' : '✗'} {oauthBanner.msg}
          <button style={s.bannerClose} onClick={() => setOauthBanner(null)}>✕</button>
        </div>
      )}

      <div style={s.panels}>
        {/* Column 1 — Folder tree */}
        <div style={s.col1}>
          <div style={s.colHeader}>
            <span style={s.colTitle}>Mail</span>
            <button style={s.iconBtn} title="Manage accounts" onClick={() => setShowAccounts(v => !v)}>⚙</button>
            <button style={s.iconBtn} title="Add account" onClick={() => setShowSetup(true)}>+</button>
          </div>
          {showAccounts
            ? <AccountList accounts={accounts} selectedId={selectedAccountId} onSelect={handleSelectAccount} onRefresh={loadAccounts} />
            : <FolderTree
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                selectedFolder={selectedFolder}
                onSelectAccount={handleSelectAccount}
                onSelectFolder={handleSelectFolder}
              />
          }
        </div>

        {/* Column 2 — Message list */}
        <div style={s.col2}>
          <div style={s.colHeader}>
            <span style={s.colTitle}>{selectedFolder}</span>
          </div>
          {accounts.length === 0
            ? <div style={s.empty}>
                <p style={{ margin: 0, color: '#888', fontSize: '0.875rem' }}>No accounts connected</p>
                <button style={s.primaryBtn} onClick={() => setShowSetup(true)}>Add Account</button>
              </div>
            : <MessageList
                accountId={selectedAccountId}
                folder={selectedFolder}
                selectedId={selectedMessage?.id ?? null}
                onSelect={setSelectedMessage}
              />
          }
        </div>

        {/* Column 3 — Message reader */}
        <div style={s.col3}>
          <MessageReader message={selectedMessage} />
        </div>
      </div>

      {/* Add Account modal */}
      {showSetup && (
        <div style={s.overlay} onClick={() => setShowSetup(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <AccountSetup onSaved={onAccountAdded} onCancel={() => setShowSetup(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root:       { display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fa', overflow: 'hidden' },
  loading:    { padding: '2rem', color: '#888', fontSize: '0.875rem' },
  banner:     { padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  bannerClose:{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'inherit', padding: '2px 6px' },
  panels:     { display: 'flex', flex: 1, overflow: 'hidden' },
  col1:       { width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  col2:       { width: 320, background: '#fafafa', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  col3:       { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' },
  colHeader:  { display: 'flex', alignItems: 'center', gap: 4, padding: '0.75rem 0.75rem 0.5rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
  colTitle:   { flex: 1, fontSize: '0.72rem', fontWeight: 700, color: '#1c2866', letterSpacing: '0.08em', textTransform: 'uppercase' },
  iconBtn:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: '#6b7280', padding: '2px 4px', borderRadius: 4 },
  empty:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' },
  primaryBtn: { padding: '0.5rem 1.25rem', background: '#c9a840', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:      { background: '#fff', borderRadius: 12, width: 580, maxWidth: '92vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
};
