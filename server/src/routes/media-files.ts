import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = path.resolve(__dirname, '../../uploads/media');

if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

type FileRow = {
  id: number;
  name: string;
  stored_name: string | null;
  parent_id: number | null;
  is_folder: boolean;
  size: number;
  mime_type: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

async function deleteFolderRecursive(id: number) {
  const { rows: children } = await db.query<FileRow>('SELECT * FROM media_files WHERE parent_id = $1', [id]);
  for (const child of children) {
    if (child.is_folder) {
      await deleteFolderRecursive(child.id);
    } else if (child.stored_name) {
      try { fs.unlinkSync(path.join(MEDIA_DIR, child.stored_name)); } catch {}
    }
  }
  await db.query('DELETE FROM media_files WHERE id = $1', [id]);
}

async function seedPhotoFolders() {
  let { rows } = await db.query<{ id: number }>(
    `SELECT id FROM media_files WHERE name = 'Photos' AND is_folder = TRUE AND parent_id IS NULL LIMIT 1`
  );
  let photosId = rows[0]?.id;
  if (!photosId) {
    const r = await db.query<{ id: number }>(`INSERT INTO media_files (name, is_folder) VALUES ('Photos', TRUE) RETURNING id`);
    photosId = r.rows[0].id;
  }
  for (const sub of ['Profile Photos', 'Misc.']) {
    const ex = await db.query(
      `SELECT id FROM media_files WHERE name = $1 AND is_folder = TRUE AND parent_id = $2 LIMIT 1`,
      [sub, photosId]
    );
    if (!ex.rows.length) {
      await db.query(`INSERT INTO media_files (name, is_folder, parent_id) VALUES ($1, TRUE, $2)`, [sub, photosId]);
    }
  }
}

export async function mediaFilesRoutes(app: FastifyInstance) {
  await seedPhotoFolders().catch(err => app.log.error({ err }, 'seedPhotoFolders failed'));

  app.get('/api/media', async (req: FastifyRequest<{ Querystring: { parent_id?: string } }>, reply) => {
    const raw = req.query.parent_id;
    const parentId = raw === undefined || raw === 'null' ? null : parseInt(raw, 10);
    const { rows } = await db.query(
      'SELECT * FROM media_files WHERE parent_id IS NOT DISTINCT FROM $1 ORDER BY is_folder DESC, name ASC',
      [parentId]
    );
    return rows;
  });

  app.get('/api/media/tree', async () => {
    const { rows } = await db.query('SELECT * FROM media_files WHERE is_folder = TRUE ORDER BY name ASC');
    return rows;
  });

  app.get('/api/media/breadcrumb/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const crumbs: Array<{ id: number; name: string; parent_id: number | null }> = [];
    let currentId: number | null = parseInt(req.params.id, 10);
    while (currentId !== null && !Number.isNaN(currentId)) {
      const { rows }: { rows: { id: number; name: string; parent_id: number | null }[] } = await db.query(
        'SELECT id, name, parent_id FROM media_files WHERE id = $1',
        [currentId]
      );
      if (!rows.length) break;
      crumbs.unshift(rows[0]);
      currentId = rows[0].parent_id;
    }
    return crumbs;
  });

  app.post('/api/media/folder', async (req: FastifyRequest<{ Body: { name?: string; parent_id?: number | null } }>, reply) => {
    const { name, parent_id } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' });
    const { rows } = await db.query(
      'INSERT INTO media_files (name, parent_id, is_folder) VALUES ($1, $2, TRUE) RETURNING *',
      [name.trim(), parent_id ?? null]
    );
    return rows[0];
  });

  app.post('/api/media/upload', async (req, reply) => {
    const parentRaw = (req.query as { parent_id?: string }).parent_id;
    const parentId = parentRaw && parentRaw !== 'null' ? parseInt(parentRaw, 10) : null;

    if (!req.isMultipart()) return reply.code(400).send({ error: 'multipart required' });

    const inserted: FileRow[] = [];
    const parts = req.files();
    for await (const part of parts) {
      const ext = path.extname(part.filename) || '';
      const storedName = `${crypto.randomUUID()}${ext}`;
      const dest = path.join(MEDIA_DIR, storedName);
      let size = 0;
      const writer = fs.createWriteStream(dest);
      part.file.on('data', (chunk: Buffer) => { size += chunk.length; });
      await pipeline(part.file, writer);
      const { rows } = await db.query<FileRow>(
        'INSERT INTO media_files (name, stored_name, parent_id, is_folder, size, mime_type) VALUES ($1,$2,$3,FALSE,$4,$5) RETURNING *',
        [part.filename, storedName, parentId, size, part.mimetype ?? null]
      );
      inserted.push(rows[0]);
    }
    return inserted;
  });

  app.delete('/api/media/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const id = parseInt(req.params.id, 10);
    const { rows } = await db.query<FileRow>('SELECT * FROM media_files WHERE id = $1', [id]);
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    const file = rows[0];
    if (file.is_folder) {
      await deleteFolderRecursive(id);
    } else {
      if (file.stored_name) {
        try { fs.unlinkSync(path.join(MEDIA_DIR, file.stored_name)); } catch {}
      }
      await db.query('DELETE FROM media_files WHERE id = $1', [id]);
    }
    return { ok: true };
  });

  app.patch('/api/media/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: { name?: string } }>, reply) => {
    const { name } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' });
    const { rows } = await db.query<FileRow>(
      'UPDATE media_files SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name.trim(), parseInt(req.params.id, 10)]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.post('/api/media/:id/move', async (req: FastifyRequest<{ Params: { id: string }; Body: { parent_id?: number | null } }>, reply) => {
    const { parent_id } = req.body ?? {};
    const { rows } = await db.query<FileRow>(
      'UPDATE media_files SET parent_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [parent_id ?? null, parseInt(req.params.id, 10)]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.post('/api/media/:id/share', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const id = parseInt(req.params.id, 10);
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const { rows } = await db.query<{ share_token: string }>(
      'UPDATE media_files SET share_token = $1 WHERE id = $2 RETURNING share_token',
      [token, id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = req.headers.host;
    return { url: `${proto}://${host}/share/${token}`, token };
  });

  app.get('/api/media/:id/download', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { rows } = await db.query<FileRow>('SELECT * FROM media_files WHERE id = $1', [parseInt(req.params.id, 10)]);
    if (!rows.length || rows[0].is_folder || !rows[0].stored_name) return reply.code(404).send({ error: 'File not found' });
    const file = rows[0];
    const stream = fs.createReadStream(path.join(MEDIA_DIR, file.stored_name!));
    reply.header('Content-Disposition', `attachment; filename="${file.name.replace(/"/g, '\\"')}"`);
    reply.header('Content-Type', file.mime_type ?? 'application/octet-stream');
    return reply.send(stream);
  });

  app.get('/api/media/photos/folders', async (_req, reply) => {
    const { rows: photosRows } = await db.query<{ id: number }>(
      `SELECT id FROM media_files WHERE name = 'Photos' AND is_folder = TRUE AND parent_id IS NULL LIMIT 1`
    );
    if (!photosRows.length) return reply.code(404).send({ error: 'Photos folder not found' });
    const { rows: subs } = await db.query(
      `SELECT id, name FROM media_files WHERE is_folder = TRUE AND parent_id = $1 ORDER BY name`,
      [photosRows[0].id]
    );
    return { photos_id: photosRows[0].id, sub_folders: subs };
  });

  app.get('/share/:token', async (req: FastifyRequest<{ Params: { token: string } }>, reply) => {
    const { rows } = await db.query<FileRow>('SELECT * FROM media_files WHERE share_token = $1', [req.params.token]);
    if (!rows.length || rows[0].is_folder || !rows[0].stored_name) return reply.code(404).send('File not found');
    const file = rows[0];
    const stream = fs.createReadStream(path.join(MEDIA_DIR, file.stored_name!));
    reply.header('Content-Disposition', `inline; filename="${file.name.replace(/"/g, '\\"')}"`);
    reply.header('Content-Type', file.mime_type ?? 'application/octet-stream');
    return reply.send(stream);
  });
}
