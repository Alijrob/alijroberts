import { useState, useEffect, useRef, useCallback } from 'react';
import { getStoredProvider, setStoredProvider } from './ModelsPanel';

type Provider = 'claude' | 'gpt' | 'gemini' | 'grok';

interface Message { id: string; role: 'user' | 'assistant'; content: string; imagePreview?: string; }
interface Conversation { id: string; title: string; model: Provider; updated_at: string; }

interface ChatProps {
  chatOpen: boolean;
  onToggleChat: () => void;
  historyOpen: boolean;
  onToggleHistory: () => void;
  onOpenApiAssist: () => void;
  onOpenChatSettings: () => void;
}

const PROVIDERS: Record<Provider, { label: string; model: string; color: string }> = {
  claude:  { label: 'Claude',  model: 'Haiku 4.5',      color: '#D97706' },
  gpt:     { label: 'GPT',     model: 'GPT-4o mini',    color: '#16A34A' },
  gemini:  { label: 'Gemini',  model: '2.0 Flash',      color: '#2563EB' },
  grok:    { label: 'Grok',    model: 'Grok-3 Mini',    color: '#7C3AED' },
};

const NAVY = '#1c2866';

function ProviderDot({ p, size = 8 }: { p: Provider; size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: PROVIDERS[p].color, flexShrink: 0 }} />;
}

function IconBtn({ title, onClick, active, disabled, children }: { title: string; onClick?: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? `${NAVY}18` : 'none',
        border: 'none',
        borderRadius: 6,
        padding: '5px 7px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: active ? NAVY : disabled ? '#ccc' : '#666',
        display: 'flex', alignItems: 'center',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.color = NAVY; }}
      onMouseLeave={e => { if (!disabled && !active) (e.currentTarget as HTMLElement).style.color = '#666'; }}
    >
      {children}
    </button>
  );
}

const IconMic = ({ active }: { active?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IconSpeaker = ({ active }: { active?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>{active ? <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/> : <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
  </svg>
);
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconSummarize = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconMenu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export default function Chat({ chatOpen, onToggleChat, historyOpen, onToggleHistory, onOpenApiAssist, onOpenChatSettings }: ChatProps) {
  const [provider, setProvider] = useState<Provider>(getStoredProvider);
  const [providerOpen, setProviderOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noKey, setNoKey] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const handler = (e: Event) => setProvider((e as CustomEvent<Provider>).detail);
    window.addEventListener('chat-provider-change', handler);
    return () => window.removeEventListener('chat-provider-change', handler);
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) setConversations(await res.json());
    } catch {}
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveConvId(id);
      setProvider(data.model as Provider);
      setMessages(data.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
      setError(null);
      setNoKey(false);
    } catch {}
  };

  const newChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
    setPendingImage(null);
    setError(null);
    setNoKey(false);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
    if (activeConvId === id) newChat();
    setConversations(c => c.filter(x => x.id !== id));
  };

  const send = async () => {
    if (!input.trim() && !pendingImage) return;
    if (loading) return;

    const userContent = input.trim() || '(image attached)';
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userContent, imagePreview: pendingImage?.preview };

    setMessages(m => [...m, userMsg]);
    setInput('');
    const imgToSend = pendingImage;
    setPendingImage(null);
    setLoading(true);
    setError(null);
    setNoKey(false);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConvId, provider, content: userContent, image: imgToSend ? { base64: imgToSend.base64, mimeType: imgToSend.mimeType } : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'NO_API_KEY') setNoKey(true);
        else setError(data.error || 'Request failed');
        setMessages(m => m.slice(0, -1));
        return;
      }
      if (!activeConvId) {
        setActiveConvId(data.conversationId);
        await loadConversations();
      }
      setMessages(m => [...m, { id: crypto.randomUUID(), role: 'assistant', content: data.reply }]);
    } catch {
      setError('Connection error.');
      setMessages(m => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const summarize = async () => {
    if (!activeConvId || messages.length === 0 || summarizing) return;
    setSummarizing(true);
    setError(null);
    try {
      const res = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConvId, provider }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMessages(m => [...m, { id: crypto.randomUUID(), role: 'assistant', content: `**Conversation Summary**\n\n${data.summary}` }]);
    } catch { setError('Summarize failed.'); }
    finally { setSummarizing(false); }
  };

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition not supported in this browser.'); return; }
    if (isListening) { recognitionRef.current?.stop(); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => {
      setInput(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript);
      setIsListening(false);
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    setIsListening(true);
    r.start();
  }, [isListening]);

  const speak = useCallback((text: string, id: string) => {
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/#{1,6} /g, ''));
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }, [speakingId]);

  const copyMsg = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setPendingImage({ base64, mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

  const groupedConvs = conversations.reduce((acc, c) => {
    const d = new Date(c.updated_at);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const label = d.toDateString() === today.toDateString() ? 'Today'
      : d.toDateString() === yesterday.toDateString() ? 'Yesterday'
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[label]) acc[label] = [];
    acc[label].push(c);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Panel Header Bar (hidden when collapsed) ── */}
      {chatOpen && <div style={{
        height: 46,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0 0.75rem',
        background: '#fafafa',
        borderBottom: '1px solid #e8e8e8',
      }}>
        {/* History toggle */}
        <button
          onClick={onToggleHistory}
          title={historyOpen ? 'Collapse history' : 'Show history'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: historyOpen ? NAVY : '#aaa', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = NAVY}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = historyOpen ? NAVY : '#aaa'}
        >
          <IconMenu />
        </button>

        {/* Title */}
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333', letterSpacing: '0.04em', textTransform: 'uppercase', userSelect: 'none' }}>
          Chat
        </span>

        <span style={{ width: 1, height: 18, background: '#e0e0e0', margin: '0 0.25rem' }} />

        {/* Provider selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProviderOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.6rem', background: '#f0f0f0',
              border: '1px solid #e0e0e0', borderRadius: 6,
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#333',
            }}
          >
            <ProviderDot p={provider} size={8} />
            <span>{PROVIDERS[provider].label}</span>
            <span style={{ fontSize: '0.6rem', color: '#aaa' }}>▾</span>
          </button>
          {providerOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
              background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden',
            }}>
              {(Object.entries(PROVIDERS) as [Provider, typeof PROVIDERS[Provider]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setStoredProvider(key); setProviderOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    width: '100%', padding: '0.6rem 1rem',
                    background: provider === key ? '#f0f4ff' : 'transparent',
                    border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                    color: provider === key ? NAVY : '#333', fontWeight: provider === key ? 600 : 400,
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (provider !== key) (e.currentTarget as HTMLElement).style.background = '#f9f9f9'; }}
                  onMouseLeave={e => { if (provider !== key) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <ProviderDot p={key} size={9} />
                  <span style={{ flex: 1 }}>{cfg.label}</span>
                  <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{cfg.model}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat settings gear */}
        <button
          onClick={onOpenChatSettings}
          title="Chat Settings"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#aaa', padding: '4px 6px', borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = NAVY}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#aaa'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        <div style={{ flex: 1 }} />

        {activeConvId && (
          <button onClick={newChat} style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            New
          </button>
        )}

        <button
          onClick={onToggleChat}
          title="Collapse chat"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = NAVY}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#aaa'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>}

      {/* ── Body (hidden when collapsed) ── */}
      {chatOpen && <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {/* History overlay — floats on top of chat, slides in from left */}
        {historyOpen && (
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: 240,
            background: '#f9f9f9',
            borderRight: '1px solid #e0e0e0',
            boxShadow: '4px 0 16px rgba(0,0,0,0.10)',
            zIndex: 10,
            display: 'flex', flexDirection: 'column',
            borderRadius: '0 0 0 0',
          }}>
            <div style={{ padding: '0.65rem 0.75rem 0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={newChat}
                style={{ flex: 1, padding: '0.45rem 0.75rem', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + New Chat
              </button>
              <button
                onClick={onToggleHistory}
                title="Close history"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#333'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#aaa'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem 0.75rem' }}>
              {Object.keys(groupedConvs).length === 0 && (
                <p style={{ color: '#aaa', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem', padding: '0 1rem' }}>No conversations yet</p>
              )}
              {Object.entries(groupedConvs).map(([label, convs]) => (
                <div key={label}>
                  <p style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.6rem 0.5rem 0.2rem', margin: 0 }}>{label}</p>
                  {convs.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { loadConversation(c.id); onToggleHistory(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        width: '100%', padding: '0.45rem 0.6rem',
                        background: activeConvId === c.id ? '#e8eaf6' : 'transparent',
                        border: 'none', borderRadius: 6, cursor: 'pointer',
                        fontSize: '0.78rem', color: activeConvId === c.id ? NAVY : '#333',
                        fontWeight: activeConvId === c.id ? 600 : 400,
                        textAlign: 'left', transition: 'background 0.15s',
                      } as any}
                      onMouseEnter={e => { if (activeConvId !== c.id) (e.currentTarget as HTMLElement).style.background = '#f0f0f0'; }}
                      onMouseLeave={e => { if (activeConvId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <ProviderDot p={c.model} size={7} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                      <span
                        onClick={e => deleteConversation(c.id, e)}
                        style={{ opacity: 0.3, color: '#666', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '2px' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.3'}
                        title="Delete"
                      >
                        <IconTrash />
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Area — always full width */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={() => { setProviderOpen(false); }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.length === 0 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: '#bbb', userSelect: 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ProviderDot p={provider} size={14} />
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#ccc' }}>Start a conversation with {PROVIDERS[provider].label}</p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '0.4rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? NAVY : '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700, color: msg.role === 'user' ? '#fff' : '#666',
                }}>
                  {msg.role === 'user' ? 'J' : <ProviderDot p={provider} size={9} />}
                </div>
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="attachment" style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                  )}
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    background: msg.role === 'user' ? NAVY : '#f4f4f4',
                    color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                    borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    fontSize: '0.85rem', lineHeight: 1.55,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', opacity: 0.5 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.5'}>
                    <IconBtn title={copiedId === msg.id ? 'Copied!' : 'Copy'} onClick={() => copyMsg(msg.content, msg.id)} active={copiedId === msg.id}>
                      <IconCopy />
                    </IconBtn>
                    <IconBtn title={speakingId === msg.id ? 'Stop' : 'Read aloud'} onClick={() => speak(msg.content, msg.id)} active={speakingId === msg.id}>
                      <IconSpeaker active={speakingId === msg.id} />
                    </IconBtn>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ProviderDot p={provider} size={9} />
                </div>
                <div style={{ padding: '0.5rem 0.85rem', background: '#f4f4f4', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#bbb', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ padding: '0.5rem 0.85rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: '0.78rem', color: '#dc2626' }}>
                {error}
              </div>
            )}

            {noKey && (
              <div style={{ padding: '0.85rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                  No API key configured for {PROVIDERS[provider].label}
                </p>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#b45309' }}>
                  Add your key in API Assist — it only takes a moment.
                </p>
                <button onClick={onOpenApiAssist} style={{ alignSelf: 'flex-start', padding: '0.35rem 0.8rem', background: NAVY, color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>
                  Open API Assist
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

        </div>
      </div>}

      {/* ── Input bar (always visible) ── */}
      <div style={{ borderTop: '1px solid #e8e8e8', padding: '0.6rem 0.85rem', background: '#fff', flexShrink: 0, position: 'relative' }}
        onClick={() => setProviderOpen(false)}>
        {!chatOpen && (
          <button
            onClick={onToggleChat}
            title="Expand chat"
            style={{
              position: 'absolute', top: -14, right: 12,
              background: '#fff', border: '1px solid #e0e0e0', borderRadius: '50%',
              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#888', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = NAVY}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#888'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        )}
        {pendingImage && (
          <div style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={pendingImage.preview} alt="pending" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0e0e0' }} />
            <button onClick={() => setPendingImage(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            onFocus={() => { if (!chatOpen) onToggleChat(); }}
            placeholder={`Message ${PROVIDERS[provider].label}…`}
            rows={1}
            style={{
              flex: 1, resize: 'none', border: '1px solid #e0e0e0', borderRadius: 10,
              padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto',
              color: '#111', background: '#fff',
            }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 100) + 'px';
            }}
          />
          <button
            onClick={send}
            disabled={loading || (!input.trim() && !pendingImage)}
            style={{
              padding: '0.5rem 1rem', background: NAVY, color: '#fff',
              border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem',
              cursor: (loading || (!input.trim() && !pendingImage)) ? 'not-allowed' : 'pointer',
              opacity: (loading || (!input.trim() && !pendingImage)) ? 0.5 : 1,
              transition: 'opacity 0.15s', flexShrink: 0, alignSelf: 'flex-end',
            }}
          >
            {loading ? '…' : '↑'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.25rem' }}>
          <IconBtn title="Attach file or photo" onClick={() => fileRef.current?.click()}>
            <IconPlus />
          </IconBtn>
          <IconBtn title={isListening ? 'Stop listening' : 'Speak to type'} onClick={startListening} active={isListening}>
            <IconMic active={isListening} />
          </IconBtn>
          <IconBtn
            title={speakingId === lastAssistant?.id ? 'Stop reading' : 'Read last response aloud'}
            onClick={() => lastAssistant && speak(lastAssistant.content, lastAssistant.id)}
            active={!!lastAssistant && speakingId === lastAssistant.id}
            disabled={!lastAssistant}
          >
            <IconSpeaker active={!!lastAssistant && speakingId === lastAssistant.id} />
          </IconBtn>
          <IconBtn
            title={copiedId === lastAssistant?.id ? 'Copied!' : 'Copy last response'}
            onClick={() => lastAssistant && copyMsg(lastAssistant.content, lastAssistant.id)}
            active={copiedId === lastAssistant?.id}
            disabled={!lastAssistant}
          >
            <IconCopy />
          </IconBtn>
          <IconBtn title="Summarize conversation" onClick={summarize} disabled={!activeConvId || messages.length === 0 || summarizing} active={summarizing}>
            <IconSummarize />
          </IconBtn>
          <IconBtn title="Prompt Optimizer (coming soon)" disabled>
            <IconSparkle />
          </IconBtn>
          <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.txt,.md" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
