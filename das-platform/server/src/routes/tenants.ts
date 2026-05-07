import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { config } from '../config.js';

function requireApiKey(req: { headers: Record<string, string | string[] | undefined> }, reply: { code: (n: number) => { send: (o: unknown) => void } }): boolean {
  if (req.headers['x-platform-key'] !== config.platformApiKey) {
    reply.code(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function domainToDbName(domain: string): string {
  return 'das_' + domain.replace(/[^a-z0-9]/gi, '_').toLowerCase().replace(/_+/g, '_').replace(/^_|_$/g, '');
}

export async function tenantRoutes(app: FastifyInstance) {

  app.get('/api/tenants', async (req, reply) => {
    if (!requireApiKey(req as never, reply as never)) return;
    const { rows } = await db.query(
      'SELECT id, name, domain, db_name, status, notes, created_at FROM tenants ORDER BY created_at DESC'
    );
    return rows;
  });

  app.post('/api/tenants', async (req, reply) => {
    if (!requireApiKey(req as never, reply as never)) return;
    const { name, domain, notes } = req.body as { name?: string; domain?: string; notes?: string };
    if (!name?.trim() || !domain?.trim()) return reply.code(400).send({ error: 'name and domain required' });

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const dbName = domainToDbName(cleanDomain);

    const { rows } = await db.query(
      `INSERT INTO tenants (name, domain, db_name, status, notes)
       VALUES ($1, $2, $3, 'provisioning', $4)
       RETURNING id, name, domain, db_name, status, notes, created_at`,
      [name.trim(), cleanDomain, dbName, notes?.trim() ?? null]
    );
    return reply.code(201).send(rows[0]);
  });

  app.put('/api/tenants/:id', async (req, reply) => {
    if (!requireApiKey(req as never, reply as never)) return;
    const { id } = req.params as { id: string };
    const { name, status, notes } = req.body as { name?: string; status?: string; notes?: string };

    const validStatuses = ['provisioning', 'active', 'suspended', 'archived'];
    if (status && !validStatuses.includes(status)) return reply.code(400).send({ error: 'Invalid status' });

    const { rows } = await db.query(
      `UPDATE tenants SET
         name = COALESCE($1, name),
         status = COALESCE($2, status),
         notes = COALESCE($3, notes),
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, domain, db_name, status, notes, created_at`,
      [name?.trim() ?? null, status ?? null, notes?.trim() ?? null, id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.delete('/api/tenants/:id', async (req, reply) => {
    if (!requireApiKey(req as never, reply as never)) return;
    const { id } = req.params as { id: string };
    const { rowCount } = await db.query('DELETE FROM tenants WHERE id = $1', [id]);
    if (!rowCount) return reply.code(404).send({ error: 'Not found' });
    return { ok: true };
  });

  app.get('/api/health', async () => {
    const alive = await import('../db.js').then(m => m.dbPing());
    return { ok: alive, service: 'das-platform' };
  });
}
