import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

// Canonical cross-app Skills store. Lives on the raven hub (ajr_central) and is
// read/written by both raven (relative /api/skills) and ibis (absolute URL to
// raven, allowed by the open CORS policy). A skill is a stored, viewable, and
// editable document: name + short description + free-form content (the body).

export async function skillsRoutes(app: FastifyInstance) {

  app.get('/api/skills', async () => {
    const { rows } = await db.query(
      'SELECT id, name, description, updated_at FROM skills ORDER BY name ASC'
    );
    return rows;
  });

  app.post('/api/skills', async (req, reply) => {
    const { name, description, content } = req.body as {
      name: string; description?: string; content?: string;
    };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      `INSERT INTO skills (name, description, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description ?? '', content ?? '']
    );
    return rows[0];
  });

  app.get('/api/skills/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('SELECT * FROM skills WHERE id = $1', [id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.put('/api/skills/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, description, content } = req.body as {
      name?: string; description?: string; content?: string;
    };
    if (name !== undefined && !name.trim()) {
      return reply.code(400).send({ error: 'Name cannot be empty' });
    }
    const { rows } = await db.query(
      `UPDATE skills
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           content     = COALESCE($3, content),
           updated_at  = NOW()
       WHERE id = $4
       RETURNING *`,
      [name?.trim() ?? null, description ?? null, content ?? null, id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.delete('/api/skills/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM skills WHERE id = $1', [id]);
    return { ok: true };
  });
}
