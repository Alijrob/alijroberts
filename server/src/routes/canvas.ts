import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = path.join(__dirname, '../../uploads/canvas-media');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

export async function canvasRoutes(app: FastifyInstance) {

  // List all folders
  app.get('/api/canvas/folders', async () => {
    const { rows } = await db.query('SELECT id, name, created_at FROM canvas_folders ORDER BY name ASC');
    return rows;
  });

  // Create folder
  app.post('/api/canvas/folders', async (req, reply) => {
    const { name } = req.body as { name: string };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      'INSERT INTO canvas_folders (name) VALUES ($1) RETURNING id, name, created_at',
      [name.trim()]
    );
    return rows[0];
  });

  // Delete folder
  app.delete('/api/canvas/folders/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM canvas_folders WHERE id = $1', [id]);
    return { ok: true };
  });

  // Move canvas folder → Files module (creates file_nodes folder + notes, then removes canvas data)
  app.post('/api/canvas/folders/:id/move-to-files', async (req, reply) => {
    const { id } = req.params as { id: string };
    const folder = await db.query('SELECT id, name FROM canvas_folders WHERE id = $1', [id]);
    if (!folder.rows[0]) return reply.code(404).send({ error: 'Folder not found' });
    const { name } = folder.rows[0];

    const { rows: [fileFolder] } = await db.query(
      'INSERT INTO file_nodes (parent_id, name, type, content) VALUES (NULL,$1,\'folder\',\'\') RETURNING id',
      [name]
    );

    const { rows: docs } = await db.query(
      'SELECT title, content FROM canvas_documents WHERE folder_id = $1',
      [id]
    );
    for (const doc of docs) {
      await db.query(
        'INSERT INTO file_nodes (parent_id, name, type, content) VALUES ($1,$2,\'note\',$3)',
        [fileFolder.id, doc.title, doc.content ?? '']
      );
    }

    await db.query('DELETE FROM canvas_folders WHERE id = $1', [id]);
    return { ok: true, file_folder_id: fileFolder.id };
  });

  // List documents in folder
  app.get('/api/canvas/folders/:folderId/documents', async (req) => {
    const { folderId } = req.params as { folderId: string };
    const { rows } = await db.query(
      'SELECT id, title, created_at, updated_at FROM canvas_documents WHERE folder_id = $1 ORDER BY updated_at DESC',
      [folderId]
    );
    return rows;
  });

  // Create document
  app.post('/api/canvas/folders/:folderId/documents', async (req, reply) => {
    const { folderId } = req.params as { folderId: string };
    const { title, content } = req.body as { title: string; content?: string };
    if (!title?.trim()) return reply.code(400).send({ error: 'Title required' });
    const { rows } = await db.query(
      'INSERT INTO canvas_documents (folder_id, title, content) VALUES ($1,$2,$3) RETURNING id, title, content, created_at, updated_at',
      [folderId, title.trim(), content ?? '']
    );
    return rows[0];
  });

  // Get single document
  app.get('/api/canvas/documents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('SELECT * FROM canvas_documents WHERE id = $1', [id]);
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // Update document
  app.put('/api/canvas/documents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { title, content } = req.body as { title?: string; content?: string };
    const { rows } = await db.query(
      'UPDATE canvas_documents SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = NOW() WHERE id = $3 RETURNING id, title, content, updated_at',
      [title ?? null, content ?? null, id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // Delete document
  app.delete('/api/canvas/documents/:id', async (req) => {
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM canvas_documents WHERE id = $1', [id]);
    return { ok: true };
  });

  // ── Media Files ──

  // List media
  app.get('/api/canvas/media', async () => {
    const { rows } = await db.query('SELECT * FROM canvas_media_files ORDER BY created_at DESC');
    return rows;
  });

  // Upload media
  app.post('/api/canvas/media', async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'No file' });
    const ext = path.extname(data.filename) || '';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(MEDIA_DIR, filename);
    const buffer = await data.toBuffer();
    await fs.promises.writeFile(filepath, buffer);
    const { rows } = await db.query(
      'INSERT INTO canvas_media_files (filename, original_name, mime_type, size) VALUES ($1,$2,$3,$4) RETURNING *',
      [filename, data.filename, data.mimetype, buffer.length]
    );
    return rows[0];
  });

  // Rename media
  app.patch('/api/canvas/media/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name } = req.body as { name: string };
    if (!name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const { rows } = await db.query(
      'UPDATE canvas_media_files SET original_name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  // Delete media
  app.delete('/api/canvas/media/:id', async (req) => {
    const { id } = req.params as { id: string };
    const { rows } = await db.query('DELETE FROM canvas_media_files WHERE id = $1 RETURNING filename', [id]);
    if (rows[0]) {
      const filepath = path.join(MEDIA_DIR, rows[0].filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    return { ok: true };
  });
}
