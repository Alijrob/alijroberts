import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db.js';
import { randomUUID } from 'node:crypto';

async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const token = req.headers['x-session-token'] as string | undefined;
  if (!token) { await reply.code(401).send({ error: 'Unauthorized' }); return false; }
  const { rows } = await db.query('SELECT id FROM user_auth WHERE session_token = $1', [token]);
  if (!rows.length) { await reply.code(401).send({ error: 'Unauthorized' }); return false; }
  return true;
}

export async function embedRoutes(app: FastifyInstance) {

  // POST /api/embed/sites — register a new site (auth required)
  app.post('/api/embed/sites', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { name, domain } = req.body as { name: string; domain: string };
    if (!name?.trim() || !domain?.trim()) return reply.code(400).send({ error: 'name and domain required' });
    const siteKey = randomUUID();
    const { rows } = await db.query(
      'INSERT INTO embed_sites (name, domain, site_key) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), domain.trim().toLowerCase(), siteKey]
    );
    return rows[0];
  });

  // GET /api/embed/sites — list all registered sites (auth required)
  app.get('/api/embed/sites', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { rows } = await db.query('SELECT * FROM embed_sites ORDER BY created_at DESC');
    return rows;
  });

  // GET /api/embed/overrides — fetch overrides for a site + page (called by widget)
  app.get('/api/embed/overrides', async (req, reply) => {
    const { site, path: pagePath } = req.query as { site?: string; path?: string };
    if (!site) return reply.code(400).send({ error: 'site required' });
    const { rows } = await db.query(
      'SELECT * FROM editor_overrides WHERE site_key = $1 AND page_path = $2',
      [site, pagePath ?? '/']
    );
    return rows;
  });

  // POST /api/embed/overrides — upsert a CSS override (called by widget)
  app.post('/api/embed/overrides', async (req, reply) => {
    const { site_key, page_path, eid, css_property, value } = req.body as {
      site_key: string; page_path?: string; eid: string; css_property: string; value: string;
    };
    if (!site_key || !eid || !css_property || value === undefined) {
      return reply.code(400).send({ error: 'site_key, eid, css_property, value required' });
    }
    const { rows: sites } = await db.query('SELECT id FROM embed_sites WHERE site_key = $1', [site_key]);
    if (!sites.length) return reply.code(404).send({ error: 'Unknown site' });
    const { rows } = await db.query(
      `INSERT INTO editor_overrides (site_key, page_path, eid, css_property, value, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (site_key, page_path, eid, css_property) DO UPDATE
       SET value = $5, updated_at = NOW()
       RETURNING *`,
      [site_key, page_path ?? '/', eid, css_property, value]
    );
    return rows[0];
  });

  // DELETE /api/embed/overrides/:id — remove one override (auth required)
  app.delete('/api/embed/overrides/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM editor_overrides WHERE id = $1', [parseInt(id)]);
    return { ok: true };
  });

  // GET /api/embed/content — fetch text content overrides for a site + page
  app.get('/api/embed/content', async (req, reply) => {
    const { site, path: pagePath } = req.query as { site?: string; path?: string };
    if (!site) return reply.code(400).send({ error: 'site required' });
    const { rows } = await db.query(
      'SELECT eid, content FROM content_overrides WHERE site_key = $1 AND page_path = $2',
      [site, pagePath ?? '/']
    );
    return rows;
  });

  // POST /api/embed/content — upsert a text content override
  app.post('/api/embed/content', async (req, reply) => {
    const { site_key, page_path, eid, content } = req.body as {
      site_key: string; page_path?: string; eid: string; content: string;
    };
    if (!site_key || !eid || content === undefined) {
      return reply.code(400).send({ error: 'site_key, eid, content required' });
    }
    const { rows: sites } = await db.query('SELECT id FROM embed_sites WHERE site_key = $1', [site_key]);
    if (!sites.length) return reply.code(404).send({ error: 'Unknown site' });
    const { rows } = await db.query(
      `INSERT INTO content_overrides (site_key, page_path, eid, content, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (site_key, page_path, eid) DO UPDATE
       SET content = $4, updated_at = NOW()
       RETURNING *`,
      [site_key, page_path ?? '/', eid, content]
    );
    return rows[0];
  });
}
