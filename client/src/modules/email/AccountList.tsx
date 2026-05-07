import { useState } from 'react';

export interface EmailAccount {
  id: number;
  display_name: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  username: string;
  active: boolean;
  oauth_provider: string | null;
  oauth_connected: boolean;
}

interface Props {
  accounts: EmailAccount[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRefresh: () => void;
}

export default function AccountList({ accounts, selectedId, onSelect, onRefresh }: Props) {
  const [testing, setTesting]   = useState<number | null>(null);
  const [results, setResults]   = useState<Record<number, boolean | null>>({});
  const [deleting, setDeleting] = useState<number | null>(null);

  const testAccount = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setTesting(id);
    try {
      const res  = await fetch(`/api/email/accounts/${id}/test`, { method: 'POST' });
      const data = await res.json();
      setResults(prev => ({ ...prev, [id]: data.ok }));
    } finally {
      setTesting(null);
    }
  };

  const deleteAccount = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (!confirm(`Remove "${name}"?`)) return;
    setDeleting(id);
    await fetch(`/api/email/accounts/${id}`, { method: 'DELETE' });
    setDeleting(null);
    onRefresh();
  };

  const reconnectOAuth = (e: React.MouseEvent, id: number, provider: string) => {
    e.stopPropagation();
    window.location.href = `/api/email/oauth/${provider}/authorize?account_id=${id}`;
  };

  if (accounts.length === 0) {
    return <div style={s.empty}>No accounts connected yet</div>;
  }

  return (
    <div style={s.list}>
      {accounts.map(acct => {
        const result     = results[acct.id];
        const isTesting  = testing === acct.id;
        const isSelected = selectedId === acct.id;
        const needsAuth  = acct.oauth_provider && !acct.oauth_connected;

        return (
          <div
            key={acct.id}
            style={{ ...s.row, background: isSelected ? '#f0f4ff' : 'transparent', borderLeft: isSelected ? '3px solid #c9a840' : '3px solid transparent' }}
            onClick={() => onSelect(acct.id)}
          >
            <div style={s.avatar}>{acct.display_name.charAt(0).toUpperCase()}</div>
            <div style={s.info}>
              <div style={s.nameRow}>
                <span style={s.name}>{acct.display_name}</span>
                {acct.oauth_provider && (
                  <span style={{ ...s.badge, background: acct.oauth_connected ? '#dbeafe' : '#fee2e2', color: acct.oauth_connected ? '#1d4ed8' : '#dc2626' }}>
                    {acct.oauth_connected ? 'OAuth ✓' : 'needs auth'}
                  </span>
                )}
              </div>
              <span style={s.addr}>{acct.email_address}</span>
            </div>
            <div style={s.actions}>
              {needsAuth ? (
                <button
                  title="Re-authorize"
                  style={{ ...s.actionBtn, color: '#dc2626', fontSize: '0.7rem', fontWeight: 700 }}
                  onClick={e => reconnectOAuth(e, acct.id, acct.oauth_provider!)}
                >
                  Auth
                </button>
              ) : (
                <button
                  title="Test connection"
                  style={{ ...s.actionBtn, color: result === true ? '#15803d' : result === false ? '#dc2626' : '#9ca3af' }}
                  onClick={e => testAccount(e, acct.id)}
                  disabled={isTesting}
                >
                  {isTesting ? '…' : result === true ? '✓' : result === false ? '✗' : '⟳'}
                </button>
              )}
              <button
                title="Remove account"
                style={{ ...s.actionBtn, color: '#dc2626' }}
                onClick={e => deleteAccount(e, acct.id, acct.display_name)}
                disabled={deleting === acct.id}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  list:      { overflowY: 'auto', flex: 1 },
  empty:     { padding: '1.5rem 1rem', color: '#aaa', fontSize: '0.85rem', textAlign: 'center' },
  row:       { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.75rem', cursor: 'pointer', transition: 'background 0.1s' },
  avatar:    { width: 34, height: 34, borderRadius: '50%', background: '#1c2866', color: '#c9a840', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 },
  info:      { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  nameRow:   { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  name:      { fontSize: '0.83rem', fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badge:     { fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 10, flexShrink: 0 },
  addr:      { fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  actions:   { display: 'flex', gap: '0.15rem', flexShrink: 0 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', padding: '4px 5px', borderRadius: 4 },
};
