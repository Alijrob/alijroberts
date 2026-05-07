import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

export async function filesRoutes(app: FastifyInstance) {

  app.get('/api/files/nodes', async () => {
    const { rows } = await db.query(
      'SELECT id, parent_id, name, type, updated_at FROM file_nodes ORDER BY type DESC, name ASC'
    );
    return rows;
  });

  app.post('/api/files/nodes', async (req, reply) => {
    const { parent_id, name, type, content } = req.body as { parent_id?: number; name: string; type: 'folder' | 'note'; content?: string };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    if (!['folder', 'note'].includes(type)) return reply.code(400).send({ error: 'Invalid type' });
    const { rows } = await db.query(
      'INSERT INTO file_nodes (parent_id, name, type, content) VALUES ($1,$2,$3,$4) RETURNING id, parent_id, name, type, content, created_at, updated_at',
      [parent_id ?? null, name.trim(), type, content ?? '']
    );
    return rows[0];
  });

  app.get('/api/files/nodes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('SELECT * FROM file_nodes WHERE id = $1', [id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.put('/api/files/nodes/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, content } = req.body as { name?: string; content?: string };
    const { rows } = await db.query(
      `UPDATE file_nodes
       SET name = COALESCE($1, name),
           content = COALESCE($2, content),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, parent_id, name, type, content, updated_at`,
      [name ?? null, content ?? null, id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.delete('/api/files/nodes/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM file_nodes WHERE id = $1', [id]);
    return { ok: true };
  });
}
