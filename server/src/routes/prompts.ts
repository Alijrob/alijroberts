import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

// Prompt Center store. Lives on the raven hub (ajr_central) alongside Skills.
// A prompt is a stored, viewable, editable document scoped to one of three
// buckets:
//   library - finished, reusable prompts.
//   lab     - drafts being written/tested; carry a status and can be promoted
//             into the library bucket.
//   fixes   - problem -> corrective-fix snippets (trigger = the symptom, content
//             = the fix to apply).
//
// Prompts can be grouped into folders (prompt_folders), and folders are
// themselves bucket-scoped so each tab keeps its own folder set. A prompt's
// folder_id is nullable: NULL means ungrouped. Deleting a folder leaves its
// prompts intact and ungrouped (ON DELETE SET NULL).

const BUCKETS = ['library', 'lab', 'fixes'] as const;
type Bucket = typeof BUCKETS[number];

function normalizeBucket(value: unknown): Bucket {
  return BUCKETS.includes(value as Bucket) ? (value as Bucket) : 'library';
}

export async function promptsRoutes(app: FastifyInstance) {

  // ---- Folders ----------------------------------------------------------

  app.get('/api/prompt-folders', async (req) => {
    const { bucket } = req.query as { bucket?: string };
    const { rows } = await db.query(
      'SELECT id, bucket, name, created_at FROM prompt_folders WHERE bucket = $1 ORDER BY name ASC',
      [normalizeBucket(bucket)]
    );
    return rows;
  });

  app.post('/api/prompt-folders', async (req, reply) => {
    const { name, bucket } = req.body as { name?: string; bucket?: string };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      'INSERT INTO prompt_folders (bucket, name) VALUES ($1, $2) RETURNING *',
      [normalizeBucket(bucket), name.trim()]
    );
    return rows[0];
  });

  app.put('/api/prompt-folders/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      'UPDATE prompt_folders SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // Deleting a folder leaves its prompts (folder_id -> NULL via FK).
  app.delete('/api/prompt-folders/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM prompt_folders WHERE id = $1', [id]);
    return { ok: true };
  });

  // ---- Prompts ----------------------------------------------------------

  app.get('/api/prompts', async (req) => {
    const { bucket } = req.query as { bucket?: string };
    const { rows } = await db.query(
      `SELECT id, bucket, name, description, status, trigger, folder_id, updated_at
       FROM prompts WHERE bucket = $1 ORDER BY name ASC`,
      [normalizeBucket(bucket)]
    );
    return rows;
  });

  app.post('/api/prompts', async (req, reply) => {
    const { name, description, content, status, trigger, bucket, folder_id } = req.body as {
      name?: string; description?: string; content?: string; status?: string;
      trigger?: string; bucket?: string; folder_id?: number | null;
    };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      `INSERT INTO prompts (bucket, name, description, content, status, trigger, folder_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [normalizeBucket(bucket), name.trim(), description ?? '', content ?? '',
       status ?? 'active', trigger ?? '', folder_id ?? null]
    );
    return rows[0];
  });

  app.get('/api/prompts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('SELECT * FROM prompts WHERE id = $1', [id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.put('/api/prompts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      name?: string; description?: string; content?: string; status?: string;
      trigger?: string; bucket?: string; folder_id?: number | null;
    };
    const { name, description, content, status, trigger } = body;
    if (name !== undefined && !name.trim()) {
      return reply.code(400).send({ error: 'Name cannot be empty' });
    }
    // bucket changes (Lab "Promote to Library") and folder_id moves are only
    // applied when the key is present, so plain edits do not clobber them.
    const bucketProvided = Object.prototype.hasOwnProperty.call(body, 'bucket');
    const folderProvided = Object.prototype.hasOwnProperty.call(body, 'folder_id');
    const { rows } = await db.query(
      `UPDATE prompts
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           content     = COALESCE($3, content),
           status      = COALESCE($4, status),
           trigger     = COALESCE($5, trigger),
           bucket      = CASE WHEN $6 THEN $7 ELSE bucket END,
           folder_id   = CASE WHEN $8 THEN $9 ELSE folder_id END,
           updated_at  = NOW()
       WHERE id = $10
       RETURNING *`,
      [name?.trim() ?? null, description ?? null, content ?? null,
       status ?? null, trigger ?? null,
       bucketProvided, bucketProvided ? normalizeBucket(body.bucket) : null,
       folderProvided, body.folder_id ?? null, id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.delete('/api/prompts/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM prompts WHERE id = $1', [id]);
    return { ok: true };
  });
}
