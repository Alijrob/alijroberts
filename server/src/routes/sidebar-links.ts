import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db.js';

const ALLOWED_ICONS = new Set([
  'link', 'globe', 'server', 'terminal', 'database',
  'cloud', 'box', 'layers', 'shield', 'zap',
  'monitor', 'folder', 'feather',
]);

type SidebarLink = {
  id: number;
  label: string;
  url: string;
  icon_key: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function sidebarLinksRoutes(app: FastifyInstance) {
  app.get('/api/sidebar-links', async () => {
    const { rows } = await db.query<SidebarLink>(
      'SELECT * FROM sidebar_links ORDER BY sort_order ASC, id ASC'
    );
    return rows;
  });

  app.post('/api/sidebar-links', async (req: FastifyRequest<{ Body: Partial<SidebarLink> }>, reply) => {
    const { label, url, icon_key, sort_order } = req.body ?? {};
    if (!label?.trim()) return reply.code(400).send({ error: 'label required' });
    const normalized = url ? normalizeUrl(url) : null;
    if (!normalized) return reply.code(400).send({ error: 'valid http(s) url required' });
    const icon = icon_key && ALLOWED_ICONS.has(icon_key) ? icon_key : 'link';
    const order = typeof sort_order === 'number' ? sort_order : 100;
    const { rows } = await db.query<SidebarLink>(
      'INSERT INTO sidebar_links (label, url, icon_key, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [label.trim(), normalized, icon, order]
    );
    return rows[0];
  });

  app.patch('/api/sidebar-links/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: Partial<SidebarLink> }>, reply) => {
    const id = parseInt(req.params.id, 10);
    const patch = req.body ?? {};
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (typeof patch.label === 'string') {
      if (!patch.label.trim()) return reply.code(400).send({ error: 'label cannot be empty' });
      fields.push(`label = $${i++}`); values.push(patch.label.trim());
    }
    if (typeof patch.url === 'string') {
      const normalized = normalizeUrl(patch.url);
      if (!normalized) return reply.code(400).send({ error: 'valid http(s) url required' });
      fields.push(`url = $${i++}`); values.push(normalized);
    }
    if (typeof patch.icon_key === 'string') {
      const icon = ALLOWED_ICONS.has(patch.icon_key) ? patch.icon_key : 'link';
      fields.push(`icon_key = $${i++}`); values.push(icon);
    }
    if (typeof patch.sort_order === 'number') {
      fields.push(`sort_order = $${i++}`); values.push(patch.sort_order);
    }
    if (!fields.length) return reply.code(400).send({ error: 'no updatable fields' });
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const { rows } = await db.query<SidebarLink>(
      `UPDATE sidebar_links SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    return rows[0];
  });

  app.delete('/api/sidebar-links/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await db.query('DELETE FROM sidebar_links WHERE id = $1', [id]);
    if (!rowCount) return reply.code(404).send({ error: 'Not found' });
    return { ok: true };
  });
}
