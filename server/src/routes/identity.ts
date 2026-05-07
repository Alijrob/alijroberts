import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';

async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const token = req.headers['x-session-token'] as string | undefined;
  if (!token) { await reply.code(401).send({ error: 'Unauthorized' }); return false; }
  const { rows } = await db.query('SELECT id FROM user_auth WHERE session_token = $1', [token]);
  if (!rows.length) { await reply.code(401).send({ error: 'Unauthorized' }); return false; }
  return true;
}

export async function identityRoutes(app: FastifyInstance) {

  // ── Profile ────────────────────────────────────────────────────────────────

  app.get('/api/identity/profile', async () => {
    const { rows } = await db.query('SELECT * FROM identity_profile WHERE id = 1');
    return rows[0] ?? {};
  });

  app.post('/api/identity/profile', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { tagline, headline, bio, website_url, social_links, section_order, section_visibility, is_public } = req.body as Record<string, unknown>;
    await db.query(
      `INSERT INTO identity_profile (id, tagline, headline, bio, website_url, social_links, section_order, section_visibility, is_public, updated_at)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO UPDATE SET
         tagline = COALESCE(EXCLUDED.tagline, identity_profile.tagline),
         headline = COALESCE(EXCLUDED.headline, identity_profile.headline),
         bio = COALESCE(EXCLUDED.bio, identity_profile.bio),
         website_url = COALESCE(EXCLUDED.website_url, identity_profile.website_url),
         social_links = COALESCE(EXCLUDED.social_links, identity_profile.social_links),
         section_order = COALESCE(EXCLUDED.section_order, identity_profile.section_order),
         section_visibility = COALESCE(EXCLUDED.section_visibility, identity_profile.section_visibility),
         is_public = COALESCE(EXCLUDED.is_public, identity_profile.is_public),
         updated_at = NOW()`,
      [tagline ?? null, headline ?? null, bio ?? null, website_url ?? null,
       social_links ? JSON.stringify(social_links) : null,
       section_order ?? null, section_visibility ? JSON.stringify(section_visibility) : null,
       is_public ?? true]
    );
    return { ok: true };
  });

  app.post('/api/identity/banner', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'banner') {
        await fs.mkdir(config.uploadDir, { recursive: true });
        const ext = path.extname(part.filename || '.jpg');
        const filename = `identity-banner${ext}`;
        await fs.writeFile(path.join(config.uploadDir, filename), await part.toBuffer());
        await db.query(
          `INSERT INTO identity_profile (id, banner_path, updated_at) VALUES (1, $1, NOW())
           ON CONFLICT (id) DO UPDATE SET banner_path = $1, updated_at = NOW()`,
          [filename]
        );
        return { ok: true, path: filename };
      }
    }
    return reply.code(400).send({ error: 'No file' });
  });

  // ── Services ───────────────────────────────────────────────────────────────

  app.get('/api/identity/services', async () => {
    const { rows } = await db.query('SELECT * FROM identity_services ORDER BY display_order ASC, id ASC');
    return rows;
  });

  app.post('/api/identity/services', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { title, description, price_range, icon, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'INSERT INTO identity_services (title, description, price_range, icon, display_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, description ?? null, price_range ?? null, icon ?? '◆', display_order ?? 0]
    );
    return rows[0];
  });

  app.put('/api/identity/services/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    const { title, description, price_range, icon, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'UPDATE identity_services SET title=$1, description=$2, price_range=$3, icon=$4, display_order=$5 WHERE id=$6 RETURNING *',
      [title, description ?? null, price_range ?? null, icon ?? '◆', display_order ?? 0, id]
    );
    return rows[0] ?? reply.code(404).send({ error: 'Not found' });
  });

  app.delete('/api/identity/services/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM identity_services WHERE id = $1', [id]);
    return { ok: true };
  });

  // ── Experience ─────────────────────────────────────────────────────────────

  app.get('/api/identity/experience', async () => {
    const { rows } = await db.query('SELECT * FROM identity_experience ORDER BY display_order ASC, id DESC');
    return rows;
  });

  app.post('/api/identity/experience', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { title, company, start_date, end_date, is_current, description, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'INSERT INTO identity_experience (title, company, start_date, end_date, is_current, description, display_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, company, start_date ?? null, end_date ?? null, is_current ?? false, description ?? null, display_order ?? 0]
    );
    return rows[0];
  });

  app.put('/api/identity/experience/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    const { title, company, start_date, end_date, is_current, description, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'UPDATE identity_experience SET title=$1, company=$2, start_date=$3, end_date=$4, is_current=$5, description=$6, display_order=$7 WHERE id=$8 RETURNING *',
      [title, company, start_date ?? null, end_date ?? null, is_current ?? false, description ?? null, display_order ?? 0, id]
    );
    return rows[0] ?? reply.code(404).send({ error: 'Not found' });
  });

  app.delete('/api/identity/experience/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM identity_experience WHERE id = $1', [id]);
    return { ok: true };
  });

  // ── Projects ───────────────────────────────────────────────────────────────

  app.get('/api/identity/projects', async () => {
    const { rows } = await db.query('SELECT * FROM identity_projects ORDER BY display_order ASC, id DESC');
    return rows;
  });

  app.post('/api/identity/projects', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { title, description, url, tags, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'INSERT INTO identity_projects (title, description, url, tags, display_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, description ?? null, url ?? null, tags ?? [], display_order ?? 0]
    );
    return rows[0];
  });

  app.put('/api/identity/projects/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    const { title, description, url, tags, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'UPDATE identity_projects SET title=$1, description=$2, url=$3, tags=$4, display_order=$5 WHERE id=$6 RETURNING *',
      [title, description ?? null, url ?? null, tags ?? [], display_order ?? 0, id]
    );
    return rows[0] ?? reply.code(404).send({ error: 'Not found' });
  });

  app.delete('/api/identity/projects/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM identity_projects WHERE id = $1', [id]);
    return { ok: true };
  });

  // ── Credentials ────────────────────────────────────────────────────────────

  app.get('/api/identity/credentials', async () => {
    const { rows } = await db.query('SELECT * FROM identity_credentials ORDER BY display_order ASC, id DESC');
    return rows;
  });

  app.post('/api/identity/credentials', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { title, issuer, issued_date, credential_url, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'INSERT INTO identity_credentials (title, issuer, issued_date, credential_url, display_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, issuer ?? null, issued_date ?? null, credential_url ?? null, display_order ?? 0]
    );
    return rows[0];
  });

  app.put('/api/identity/credentials/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    const { title, issuer, issued_date, credential_url, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'UPDATE identity_credentials SET title=$1, issuer=$2, issued_date=$3, credential_url=$4, display_order=$5 WHERE id=$6 RETURNING *',
      [title, issuer ?? null, issued_date ?? null, credential_url ?? null, display_order ?? 0, id]
    );
    return rows[0] ?? reply.code(404).send({ error: 'Not found' });
  });

  app.delete('/api/identity/credentials/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM identity_credentials WHERE id = $1', [id]);
    return { ok: true };
  });

  // ── Skills ─────────────────────────────────────────────────────────────────

  app.get('/api/identity/skills', async () => {
    const { rows } = await db.query('SELECT * FROM identity_skills ORDER BY category ASC, display_order ASC, id ASC');
    return rows;
  });

  app.post('/api/identity/skills', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { name, category, display_order } = req.body as Record<string, unknown>;
    const { rows } = await db.query(
      'INSERT INTO identity_skills (name, category, display_order) VALUES ($1,$2,$3) RETURNING *',
      [name, category ?? 'General', display_order ?? 0]
    );
    return rows[0];
  });

  app.delete('/api/identity/skills/:id', async (req, reply) => {
    if (!await requireAuth(req, reply)) return;
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM identity_skills WHERE id = $1', [id]);
    return { ok: true };
  });

  // ── Full profile fetch (all sections in one call) ──────────────────────────

  app.get('/api/identity/full', async () => {
    const [profile, services, experience, projects, credentials, skills, onboarding] = await Promise.all([
      db.query('SELECT * FROM identity_profile WHERE id = 1'),
      db.query('SELECT * FROM identity_services ORDER BY display_order ASC, id ASC'),
      db.query('SELECT * FROM identity_experience ORDER BY display_order ASC, id DESC'),
      db.query('SELECT * FROM identity_projects ORDER BY display_order ASC, id DESC'),
      db.query('SELECT * FROM identity_credentials ORDER BY display_order ASC, id DESC'),
      db.query('SELECT * FROM identity_skills ORDER BY category ASC, display_order ASC, id ASC'),
      db.query('SELECT display_name, space_name, logo_path FROM onboarding_state WHERE id = 1'),
    ]);
    return {
      profile: profile.rows[0] ?? {},
      services: services.rows,
      experience: experience.rows,
      projects: projects.rows,
      credentials: credentials.rows,
      skills: skills.rows,
      onboarding: onboarding.rows[0] ?? {},
    };
  });
}
