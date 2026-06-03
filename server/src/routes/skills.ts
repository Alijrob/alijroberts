import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

// Canonical cross-app Skills store. Lives on the raven hub (ajr_central) and is
// read/written by both raven (relative /api/skills) and ibis (absolute URL to
// raven, allowed by the open CORS policy). A skill is a stored, viewable, and
// editable document: name + short description + free-form content (the body).
//
// Skills can be grouped into folders (skill_folders). A skill's folder_id is
// nullable: NULL means ungrouped. Deleting a folder leaves its skills intact
// and ungrouped (ON DELETE SET NULL).

export async function skillsRoutes(app: FastifyInstance) {

  // ---- Folders ----------------------------------------------------------

  app.get('/api/skill-folders', async () => {
    const { rows } = await db.query(
      'SELECT id, name, created_at FROM skill_folders ORDER BY name ASC'
    );
    return rows;
  });

  app.post('/api/skill-folders', async (req, reply) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      'INSERT INTO skill_folders (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    return rows[0];
  });

  app.put('/api/skill-folders/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      'UPDATE skill_folders SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // Deleting a folder leaves its skills (folder_id -> NULL via FK).
  app.delete('/api/skill-folders/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM skill_folders WHERE id = $1', [id]);
    return { ok: true };
  });

  // ---- Skills -----------------------------------------------------------

  app.get('/api/skills', async () => {
    const { rows } = await db.query(
      'SELECT id, name, description, folder_id, updated_at FROM skills ORDER BY name ASC'
    );
    return rows;
  });

  app.post('/api/skills', async (req, reply) => {
    const { name, description, content, folder_id } = req.body as {
      name: string; description?: string; content?: string; folder_id?: number | null;
    };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      `INSERT INTO skills (name, description, content, folder_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), description ?? '', content ?? '', folder_id ?? null]
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
    const body = req.body as {
      name?: string; description?: string; content?: string; folder_id?: number | null;
    };
    const { name, description, content } = body;
    if (name !== undefined && !name.trim()) {
      return reply.code(400).send({ error: 'Name cannot be empty' });
    }
    // folder_id is only touched when the key is present, so plain edits don't
    // clobber an assignment. Sending folder_id: null explicitly ungroups.
    const folderProvided = Object.prototype.hasOwnProperty.call(body, 'folder_id');
    const { rows } = await db.query(
      `UPDATE skills
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           content     = COALESCE($3, content),
           folder_id   = CASE WHEN $4 THEN $5 ELSE folder_id END,
           updated_at  = NOW()
       WHERE id = $6
       RETURNING *`,
      [name?.trim() ?? null, description ?? null, content ?? null,
       folderProvided, body.folder_id ?? null, id]
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
