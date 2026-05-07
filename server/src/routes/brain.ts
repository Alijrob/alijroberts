import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { readFile, writeFile } from 'fs/promises';

const VERSION_FILE = '/root/das-daedalus/data/widget-version.json';
const KEYS_FILE = '/root/das-daedalus/data/deploy-keys.json';

async function readJson(filePath: string, fallback: unknown): Promise<unknown> {
  try { return JSON.parse(await readFile(filePath, 'utf8')); } catch { return fallback; }
}

export async function brainRoutes(app: FastifyInstance) {

  app.get('/api/brain/settings', async () => {
    const { rows } = await db.query('SELECT * FROM brain_settings WHERE id = 1');
    if (!rows.length) return { system_prompt: '', persona_name: 'Assistant', agentic_mode: 'manual' };
    return {
      system_prompt: rows[0].system_prompt as string,
      persona_name: rows[0].persona_name as string,
      agentic_mode: rows[0].agentic_mode as string,
    };
  });

  app.put('/api/brain/settings', async (req, reply) => {
    const { system_prompt, persona_name, agentic_mode } = req.body as {
      system_prompt?: string;
      persona_name?: string;
      agentic_mode?: string;
    };
    if (agentic_mode && !['manual', 'orchestrated', 'autonomous'].includes(agentic_mode)) {
      return reply.code(400).send({ error: 'Invalid mode' });
    }
    await db.query(
      `INSERT INTO brain_settings (id, system_prompt, persona_name, agentic_mode, updated_at)
       VALUES (1, $1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         system_prompt = $1, persona_name = $2, agentic_mode = $3, updated_at = NOW()`,
      [system_prompt ?? '', persona_name ?? 'Assistant', agentic_mode ?? 'manual']
    );
    return { ok: true };
  });

  app.get('/api/brain/widget-status', async () => {
    const version = await readJson(VERSION_FILE, { version: '1.0.0', deployedAt: new Date().toISOString() }) as { version: string; deployedAt: string };
    const keys = await readJson(KEYS_FILE, []) as unknown[];
    const activeClients = Array.isArray(keys)
      ? keys.filter((k: unknown) => (k as { status?: string }).status === 'active').length
      : 0;
    return { version: version.version, deployedAt: version.deployedAt, activeClients };
  });

  app.post('/api/brain/widget-push', async (_req, reply) => {
    try {
      const current = await readJson(VERSION_FILE, { version: '1.0.0', deployedAt: '' }) as { version: string; deployedAt: string };
      const parts = current.version.split('.').map(Number);
      parts[2] = (parts[2] ?? 0) + 1;
      const updated = { version: parts.join('.'), deployedAt: new Date().toISOString() };
      await writeFile(VERSION_FILE, JSON.stringify(updated, null, 2));
      return { ok: true, version: updated.version, deployedAt: updated.deployedAt };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return reply.code(500).send({ error: msg });
    }
  });
}
