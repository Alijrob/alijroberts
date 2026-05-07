import { useState, useEffect, useRef } from 'react';

interface Conversation {
  id: string;
  title: string;
  model: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

type Provider = 'claude' | 'gpt' | 'gemini' | 'grok';

const ACCENT = '#22d3ee';
const PROVIDERS: { id: Provider; label: string; color: string }[] = [
  { id: 'claude', label: 'Claude', color: '#f97316' },
  { id: 'gpt', label: 'GPT-4', color: '#22c55e' },
  { id: 'gemini', label: 'Gemini', color: '#8b5cf6' },
  { id: 'grok', label: 'Grok', color: ACCENT },
];

export default function Chatbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<Provider>('claude');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/chat/conversations').then(r => r.json()).then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = (id: string) => {
    setActiveId(id);
    setLoadingMsgs(true);
    fetch(`/api/chat/conversations/${id}`)
      .then(r => r.json())
      .then(data => { setMessages(data.messages ?? []); })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    const optimistic: Message = { id: 'tmp', role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, provider, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (!activeId) {
        setActiveId(data.conversationId);
        const updated: Conversation[] = await fetch('/api/chat/conversations').then(r => r.json());
        setConversations(updated);
      }
      const conv = await fetch(`/api/chat/conversations/${data.conversationId}`).then(r => r.json());
      setMessages(conv.messages ?? []);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'tmp'));
      const errMsg = err instanceof Error ? err.message : 'Send failed';
      setMessages(prev => [...prev.filter(m => m.id !== 'tmp'), { id: 'err', role: 'assistant', content: `Error: ${errMsg}`, created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const s = {
    container: { display: 'flex', height: 'calc(100vh - 130px)', minHeight: '500px', gap: '1px', background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e1e1e' },
    sidebar: { width: '220px', flexShrink: 0, background: '#0f0f0f', display: 'flex', flexDirection: 'column' as const },
    sidebarHeader: { padding: '0.75rem', borderBottom: '1px solid #1e1e1e' },
    newBtn: { width: '100%', background: `${ACCENT}18`, border: `1px solid ${ACCENT}33`, borderRadius: '6px', color: ACCENT, fontSize: '0.78rem', fontWeight: 600, padding: '0.5rem', cursor: 'pointer', letterSpacing: '0.04em' },
    convList: { flex: 1, overflowY: 'auto' as const },
    convItem: (active: boolean) => ({ padding: '0.6rem 0.75rem', cursor: 'pointer', borderLeft: active ? `2px solid ${ACCENT}` : '2px solid transparent', background: active ? '#1a1a1a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }),
    convTitle: { fontSize: '0.75rem', color: 'rgba(248,250,252,0.7)', overflow: 'hidden', whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis', flex: 1 },
    delBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.7rem', padding: '0 2px', flexShrink: 0 },
    main: { flex: 1, display: 'flex', flexDirection: 'column' as const, background: '#0a0a0a' },
    providerBar: { padding: '0.5rem 0.75rem', borderBottom: '1px solid #1e1e1e', display: 'flex', gap: '0.25rem' },
    provBtn: (active: boolean, color: string) => ({ background: active ? `${color}22` : 'none', border: active ? `1px solid ${color}44` : '1px solid transparent', borderRadius: '4px', color: active ? color : 'rgba(248,250,252,0.35)', fontSize: '0.72rem', fontWeight: active ? 600 : 400, padding: '3px 10px', cursor: 'pointer', letterSpacing: '0.04em' }),
    messages: { flex: 1, overflowY: 'auto' as const, padding: '1rem', display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
    msgRow: (role: string) => ({ display: 'flex', justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }),
    bubble: (role: string) => ({ maxWidth: '72%', padding: '0.6rem 0.875rem', borderRadius: role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: role === 'user' ? '#1e3a4a' : '#141414', border: role === 'user' ? `1px solid ${ACCENT}33` : '1px solid #222', color: '#f8fafc', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const }),
    emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,250,252,0.2)', fontSize: '0.85rem' },
    inputArea: { padding: '0.75rem', borderTop: '1px solid #1e1e1e', display: 'flex', gap: '0.5rem' },
    textarea: { flex: 1, background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f8fafc', fontSize: '0.875rem', padding: '0.6rem 0.875rem', resize: 'none' as const, outline: 'none', fontFamily: 'inherit', minHeight: '44px', maxHeight: '120px' },
    sendBtn: (disabled: boolean) => ({ background: disabled ? '#1a2a2a' : ACCENT, border: 'none', borderRadius: '8px', color: disabled ? 'rgba(248,250,252,0.2)' : '#0a0a0a', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 700, padding: '0.6rem 1.25rem', transition: 'all 0.15s' }),
  };

  return (
    <div style={s.container}>
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <button style={s.newBtn} onClick={() => { setActiveId(null); setMessages([]); }}>+ New Chat</button>
        </div>
        <div style={s.convList}>
          {conversations.map(c => (
            <div key={c.id} style={s.convItem(c.id === activeId)} onClick={() => loadConversation(c.id)}>
              <span style={s.convTitle}>{c.title}</span>
              <button style={s.delBtn} onClick={(e) => deleteConversation(c.id, e)}>✕</button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: '1rem', color: 'rgba(248,250,252,0.2)', fontSize: '0.72rem', textAlign: 'center' }}>No conversations yet</div>
          )}
        </div>
      </div>
      <div style={s.main}>
        <div style={s.providerBar}>
          {PROVIDERS.map(p => (
            <button key={p.id} style={s.provBtn(provider === p.id, p.color)} onClick={() => setProvider(p.id)}>{p.label}</button>
          ))}
        </div>
        <div style={s.messages}>
          {loadingMsgs ? (
            <div style={s.emptyState}>Loading…</div>
          ) : messages.length === 0 ? (
            <div style={s.emptyState}>Start a conversation or select one from the list.</div>
          ) : (
            messages.map(m => (
              <div key={m.id} style={s.msgRow(m.role)}>
                <div style={s.bubble(m.role)}>{m.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div style={s.inputArea}>
          <textarea
            style={s.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${PROVIDERS.find(p => p.id === provider)?.label ?? provider}…`}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
          />
          <button style={s.sendBtn(!input.trim() || sending)} onClick={sendMessage} disabled={!input.trim() || sending}>
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
