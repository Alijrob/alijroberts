import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db.js';

// Canonical cross-app Projects store. Lives on the raven hub (ajr_central) and is
// read/written by both raven and ibis (licencee-finder) via these endpoints.
// The intake form POSTs a pending project; /project-setup PATCHes it to active
// once it has scaffolded the GitHub artifacts (repo, tracker, onboarding, phases).

type Project = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  goal: string | null;
  stack: string | null;
  target: string | null;
  repo_strategy: string;
  repo_name: string | null;
  repo_url: string | null;
  tracker_path: string | null;
  tracker_url: string | null;
  onboarding_url: string | null;
  phases: unknown;
  artifacts: unknown;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const REPO_STRATEGIES = new Set(['new', 'pagios-ops', 'existing']);
const STATUSES = new Set(['pending', 'active', 'archived']);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project';
}

// Insert with slug-collision retry: base, base-2, base-3, ... up to a small cap.
async function insertWithUniqueSlug(base: string, cols: string[], vals: unknown[]): Promise<Project> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ');
      const { rows } = await db.query<Project>(
        `INSERT INTO projects (slug, ${cols.join(', ')}) VALUES ($1, ${placeholders}) RETURNING *`,
        [slug, ...vals]
      );
      return rows[0];
    } catch (err) {
      // 23505 = unique_violation; only retry when it is the slug that collided.
      if ((err as { code?: string }).code === '23505') continue;
      throw err;
    }
  }
  throw new Error('could not generate a unique slug');
}

export async function projectsRoutes(app: FastifyInstance) {
  // List, newest first. Optional ?status= filter.
  app.get('/api/projects', async (req: FastifyRequest<{ Querystring: { status?: string } }>) => {
    const status = req.query?.status;
    if (status && STATUSES.has(status)) {
      const { rows } = await db.query<Project>(
        'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC, id DESC',
        [status]
      );
      return rows;
    }
    const { rows } = await db.query<Project>('SELECT * FROM projects ORDER BY created_at DESC, id DESC');
    return rows;
  });

  app.get('/api/projects/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return reply.code(400).send({ error: 'invalid id' });
    const { rows } = await db.query<Project>('SELECT * FROM projects WHERE id = $1', [id]);
    if (!rows.length) return reply.code(404).send({ error: 'not found' });
    return rows[0];
  });

  // Create from the intake form. Only name is required.
  app.post('/api/projects', async (req: FastifyRequest<{ Body: Partial<Project> }>, reply) => {
    const b = req.body ?? {};
    if (!b.name?.trim()) return reply.code(400).send({ error: 'name required' });
    const repo_strategy = b.repo_strategy && REPO_STRATEGIES.has(b.repo_strategy) ? b.repo_strategy : 'new';
    const status = b.status && STATUSES.has(b.status) ? b.status : 'pending';

    const cols = ['name', 'description', 'goal', 'stack', 'target', 'repo_strategy', 'repo_name', 'notes', 'status', 'created_by'];
    const vals = [
      b.name.trim(),
      b.description?.trim() || null,
      b.goal?.trim() || null,
      b.stack?.trim() || null,
      b.target?.trim() || null,
      repo_strategy,
      b.repo_name?.trim() || null,
      b.notes?.trim() || null,
      status,
      b.created_by?.trim() || null,
    ];
    try {
      const project = await insertWithUniqueSlug(slugify(b.name), cols, vals);
      return reply.code(201).send(project);
    } catch {
      return reply.code(500).send({ error: 'could not create project' });
    }
  });

  // Partial update. Used by the intake flow and by /project-setup to back-fill
  // GitHub artifact pointers and flip status from pending to active.
  app.patch('/api/projects/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: Partial<Project> }>, reply) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return reply.code(400).send({ error: 'invalid id' });
    const p = req.body ?? {};
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    const textCols: (keyof Project)[] = ['name', 'description', 'goal', 'stack', 'target', 'repo_name', 'repo_url', 'tracker_path', 'tracker_url', 'onboarding_url', 'notes', 'created_by'];
    for (const col of textCols) {
      if (typeof p[col] === 'string') {
        if (col === 'name' && !(p[col] as string).trim()) return reply.code(400).send({ error: 'name cannot be empty' });
        fields.push(`${col} = $${i++}`);
        values.push((p[col] as string).trim() || null);
      }
    }
    if (typeof p.repo_strategy === 'string') {
      if (!REPO_STRATEGIES.has(p.repo_strategy)) return reply.code(400).send({ error: 'invalid repo_strategy' });
      fields.push(`repo_strategy = $${i++}`); values.push(p.repo_strategy);
    }
    if (typeof p.status === 'string') {
      if (!STATUSES.has(p.status)) return reply.code(400).send({ error: 'invalid status' });
      fields.push(`status = $${i++}`); values.push(p.status);
    }
    if (p.phases !== undefined) { fields.push(`phases = $${i++}::jsonb`); values.push(JSON.stringify(p.phases)); }
    if (p.artifacts !== undefined) { fields.push(`artifacts = $${i++}::jsonb`); values.push(JSON.stringify(p.artifacts)); }

    if (!fields.length) return reply.code(400).send({ error: 'no updatable fields provided' });
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const { rows } = await db.query<Project>(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows.length) return reply.code(404).send({ error: 'not found' });
    return rows[0];
  });

  app.delete('/api/projects/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return reply.code(400).send({ error: 'invalid id' });
    const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [id]);
    if (!rowCount) return reply.code(404).send({ error: 'not found' });
    return reply.code(204).send();
  });
}
