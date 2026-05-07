import type { FastifyInstance } from 'fastify';

const PLATFORM_URL = process.env.PLATFORM_API_URL ?? 'http://147.93.119.147:3200';
const PLATFORM_KEY = process.env.PLATFORM_API_KEY ?? '';

async function pf(path: string, init?: RequestInit) {
  return fetch(`${PLATFORM_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-platform-key': PLATFORM_KEY,
      ...(init?.headers ?? {}),
    },
  });
}

export async function platformRoutes(app: FastifyInstance) {

  app.get('/api/platform/tenants', async (_req, reply) => {
    const res = await pf('/api/admin/tenants');
    reply.code(res.status);
    return res.json();
  });

  app.post('/api/platform/tenants', async (req, reply) => {
    const res = await pf('/api/admin/tenants', { method: 'POST', body: JSON.stringify(req.body) });
    reply.code(res.status);
    return res.json();
  });

  app.put('/api/platform/tenants/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await pf(`/api/admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify(req.body) });
    reply.code(res.status);
    return res.json();
  });

  app.get('/api/platform/domains', async (_req, reply) => {
    const res = await pf('/api/admin/domains');
    reply.code(res.status);
    return res.json();
  });

  app.post('/api/platform/domains', async (req, reply) => {
    const res = await pf('/api/admin/domains', { method: 'POST', body: JSON.stringify(req.body) });
    reply.code(res.status);
    return res.json();
  });

  app.delete('/api/platform/domains/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await pf(`/api/admin/domains/${id}`, { method: 'DELETE' });
    reply.code(res.status);
    return res.json();
  });

  app.get('/api/platform/health', async (_req, reply) => {
    try {
      const res = await pf('/api/health');
      reply.code(res.status);
      return res.json();
    } catch {
      return reply.code(503).send({ ok: false, error: 'Platform engine unreachable' });
    }
  });
}
