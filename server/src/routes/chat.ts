import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Provider = 'claude' | 'gpt' | 'gemini' | 'grok';

interface Msg { role: 'user' | 'assistant'; content: string; }

async function getKey(provider: string): Promise<string> {
  const { rows } = await db.query('SELECT api_key FROM api_keys WHERE provider = $1', [provider]);
  const key = rows[0]?.api_key;
  if (!key) throw new Error(`No API key configured for ${provider}. Add one in API Assist.`);
  return key;
}

async function callLLM(provider: Provider, msgs: Msg[], img?: { base64: string; mimeType: string }): Promise<string> {
  if (provider === 'claude') {
    const key = await getKey('anthropic');
    const client = new Anthropic({ apiKey: key });
    const messages = msgs.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages,
    });
    return (res.content[0] as { type: string; text: string }).text;
  }

  if (provider === 'gpt') {
    const key = await getKey('openai');
    const client = new OpenAI({ apiKey: key });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: msgs.map(m => ({ role: m.role, content: m.content })),
    });
    return res.choices[0].message.content ?? '';
  }

  if (provider === 'gemini') {
    const key = await getKey('gemini');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    // Build history (all but last message) + send last as current turn
    const history = msgs.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const last = msgs[msgs.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last.content);
    return result.response.text();
  }

  if (provider === 'grok') {
    const key = await getKey('grok');
    const client = new OpenAI({ apiKey: key, baseURL: 'https://api.x.ai/v1' });
    const res = await client.chat.completions.create({
      model: 'grok-3-mini',
      messages: msgs.map(m => ({ role: m.role, content: m.content })),
    });
    return res.choices[0].message.content ?? '';
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export async function chatRoutes(app: FastifyInstance) {

  app.post('/api/chat/message', async (req, reply) => {
    const { conversationId, provider, content, image } = req.body as {
      conversationId?: string;
      provider: Provider;
      content: string;
      image?: { base64: string; mimeType: string };
    };

    if (!content?.trim()) return reply.code(400).send({ error: 'Message required' });
    if (!['claude', 'gpt', 'gemini', 'grok'].includes(provider)) return reply.code(400).send({ error: 'Invalid provider' });

    // Create or verify conversation
    let convId = conversationId;
    let title = '';
    if (!convId) {
      title = content.trim().slice(0, 60) + (content.trim().length > 60 ? '…' : '');
      const { rows } = await db.query(
        'INSERT INTO chat_conversations (title, model) VALUES ($1, $2) RETURNING id, title',
        [title, provider]
      );
      convId = rows[0].id;
      title = rows[0].title;
    } else {
      const { rows } = await db.query('SELECT title FROM chat_conversations WHERE id = $1', [convId]);
      if (!rows.length) return reply.code(404).send({ error: 'Conversation not found' });
      title = rows[0].title;
    }

    // Save user message
    const { rows: [userMsg] } = await db.query(
      'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1,$2,$3) RETURNING id',
      [convId, 'user', content.trim()]
    );

    // Load full history (including new user message)
    const { rows: history } = await db.query(
      'SELECT role, content FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [convId]
    );

    // Call LLM
    let replyText = '';
    try {
      replyText = await callLLM(provider, history as Msg[], image);
    } catch (err: any) {
      await db.query('DELETE FROM chat_messages WHERE id = $1', [userMsg.id]);
      if (!conversationId) await db.query('DELETE FROM chat_conversations WHERE id = $1', [convId]);
      return reply.code(502).send({ error: err.message || 'LLM call failed' });
    }

    // Save assistant response + update conversation
    await db.query('INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1,$2,$3)', [convId, 'assistant', replyText]);
    await db.query('UPDATE chat_conversations SET updated_at = NOW(), model = $1 WHERE id = $2', [provider, convId]);

    return { conversationId: convId, reply: replyText, title };
  });

  app.post('/api/chat/summarize', async (req, reply) => {
    const { conversationId, provider } = req.body as { conversationId: string; provider: Provider };
    const { rows } = await db.query(
      'SELECT role, content FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    if (!rows.length) return reply.code(400).send({ error: 'No messages to summarize' });

    const msgs: Msg[] = [...rows as Msg[], { role: 'user', content: 'Give me a concise bullet-point summary of this conversation.' }];
    const summary = await callLLM(provider, msgs);
    return { summary };
  });

  app.get('/api/chat/conversations', async () => {
    const { rows } = await db.query(
      'SELECT id, title, model, updated_at FROM chat_conversations ORDER BY updated_at DESC'
    );
    return rows;
  });

  app.get('/api/chat/conversations/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows: conv } = await db.query('SELECT * FROM chat_conversations WHERE id = $1', [id]);
    if (!conv.length) return reply.code(404).send({ error: 'Not found' });
    const { rows: messages } = await db.query(
      'SELECT id, role, content, created_at FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    return { ...conv[0], messages };
  });

  app.delete('/api/chat/conversations/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM chat_conversations WHERE id = $1', [id]);
    return { ok: true };
  });
}
