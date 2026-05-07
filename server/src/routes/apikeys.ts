import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

const VALID_PROVIDERS = ['anthropic', 'openai', 'gemini', 'grok'];

export async function apikeyRoutes(app: FastifyInstance) {

  // Returns which providers are configured (not the actual keys)
  app.get('/api/apikeys', async () => {
    const { rows } = await db.query('SELECT provider, api_key IS NOT NULL AND api_key != \'\' AS configured FROM api_keys');
    const result: Record<string, boolean> = {};
    for (const row of rows) result[row.provider] = row.configured;
    return result;
  });

  // Save or update an API key
  app.post('/api/apikeys/:provider', async (req, reply) => {
    const { provider } = req.params as { provider: string };
    const { key } = req.body as { key: string };
    if (!VALID_PROVIDERS.includes(provider)) return reply.code(400).send({ error: 'Invalid provider' });
    if (!key?.trim()) return reply.code(400).send({ error: 'Key required' });
    await db.query(
      'INSERT INTO api_keys (provider, api_key, updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (provider) DO UPDATE SET api_key = $2, updated_at = NOW()',
      [provider, key.trim()]
    );
    return { ok: true };
  });

  // Remove an API key
  app.delete('/api/apikeys/:provider', async (req, reply) => {
    const { provider } = req.params as { provider: string };
    if (!VALID_PROVIDERS.includes(provider)) return reply.code(400).send({ error: 'Invalid provider' });
    await db.query('UPDATE api_keys SET api_key = NULL, updated_at = NOW() WHERE provider = $1', [provider]);
    return { ok: true };
  });
}
