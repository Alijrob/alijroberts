import { useEffect, useState } from 'react';
import { type Message } from './MessageList';

interface Props {
  message: Message | null;
}

export default function MessageReader({ message }: Props) {
  const [body, setBody]       = useState<{ html: string | null; text: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!message) { setBody(null); return; }
    setLoading(true);
    setBody(null);
    fetch(`/api/email/messages/${message.id}/body`)
      .then(r => r.json())
      .then(data => { setBody(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [message?.id]);

  if (!message) {
    return (
      <div style={s.empty}>
        <div style={s.emptyIcon}>✉</div>
        <p style={s.emptyText}>Select a message to read</p>
      </div>
    );
  }

  const from = message.from_name
    ? `${message.from_name} <${message.from_address}>`
    : (message.from_address ?? 'Unknown');

  const dateStr = message.date_sent
    ? new Date(message.date_sent).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.subject}>{message.subject || '(no subject)'}</div>
        <div style={s.meta}>
          <span style={s.from}>{from}</span>
          <span style={s.date}>{dateStr}</span>
        </div>
      </div>

      <div style={s.bodyWrap}>
        {loading && <div style={s.loading}>Loading…</div>}
        {!loading && body && (
          body.html
            ? <iframe
                srcDoc={body.html}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                style={s.iframe}
                title="email-body"
              />
            : <pre style={s.text}>{body.text}</pre>
        )}
        {!loading && !body && <div style={s.loading}>Could not load message</div>}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  empty:     { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#bbb' },
  emptyIcon: { fontSize: '2.5rem', opacity: 0.3 },
  emptyText: { fontSize: '0.875rem', margin: 0 },
  wrap:      { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  header:    { padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#fff' },
  subject:   { fontSize: '1rem', fontWeight: 700, color: '#111', marginBottom: '0.4rem' },
  meta:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  from:      { fontSize: '0.8rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  date:      { fontSize: '0.75rem', color: '#888', flexShrink: 0 },
  bodyWrap:  { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff' },
  iframe:    { flex: 1, border: 'none', width: '100%', height: '100%' },
  text:      { flex: 1, padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#333', whiteSpace: 'pre-wrap', overflowY: 'auto', margin: 0, lineHeight: 1.6 },
  loading:   { padding: '2rem', color: '#aaa', fontSize: '0.875rem', textAlign: 'center' },
};
