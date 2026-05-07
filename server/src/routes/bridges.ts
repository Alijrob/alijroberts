import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

export async function bridgesRoutes(app: FastifyInstance) {

  app.get('/api/bridges', async () => {
    const { rows } = await db.query(
      'SELECT id, name, status, description, updated_at FROM agent_bridges ORDER BY name ASC'
    );
    return rows;
  });

  app.post('/api/bridges', async (req, reply) => {
    const { name, status, description, content } = req.body as {
      name: string; status?: string; description?: string; content?: string;
    };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      `INSERT INTO agent_bridges (name, status, description, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), status ?? 'planned', description ?? '', content ?? '']
    );
    return rows[0];
  });

  app.get('/api/bridges/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('SELECT * FROM agent_bridges WHERE id = $1', [id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.put('/api/bridges/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, status, description, content } = req.body as {
      name?: string; status?: string; description?: string; content?: string;
    };
    const { rows } = await db.query(
      `UPDATE agent_bridges
       SET name        = COALESCE($1, name),
           status      = COALESCE($2, status),
           description = COALESCE($3, description),
           content     = COALESCE($4, content),
           updated_at  = NOW()
       WHERE id = $5
       RETURNING *`,
      [name ?? null, status ?? null, description ?? null, content ?? null, id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.delete('/api/bridges/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM agent_bridges WHERE id = $1', [id]);
    return { ok: true };
  });
}
