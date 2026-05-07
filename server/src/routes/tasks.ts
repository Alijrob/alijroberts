import type { FastifyInstance } from 'fastify';
import { getValidAccessToken, isGoogleConnected } from '../services/googleService.js';

const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1';

export async function tasksRoutes(app: FastifyInstance) {

  app.get('/api/tasks/status', async () => {
    return isGoogleConnected();
  });

  app.get('/api/tasks/auth/start', async (_req, reply) => {
    return reply.redirect('/api/calendar/auth/start');
  });

  app.get('/api/tasks/auth/callback', async (_req, reply) => {
    return reply.redirect('/api/calendar/auth/callback');
  });

  app.get('/api/tasks/lists', async (_req, reply) => {
    try {
      const token = await getValidAccessToken();
      const res   = await fetch(`${TASKS_BASE}/users/@me/lists?maxResults=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data  = await res.json() as any;
      if (data.error) return reply.code(400).send({ error: data.error.message });
      return { items: data.items ?? [] };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.get('/api/tasks/tasks', async (req, reply) => {
    const { list_id } = req.query as { list_id?: string };
    const listId      = list_id ?? '@default';
    try {
      const token = await getValidAccessToken();
      const res   = await fetch(
        `${TASKS_BASE}/lists/${encodeURIComponent(listId)}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data  = await res.json() as any;
      if (data.error) return reply.code(400).send({ error: data.error.message });
      return { items: data.items ?? [] };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.post('/api/tasks/tasks', async (req, reply) => {
    const { title, notes, due, list_id } =
      req.body as { title: string; notes?: string; due?: string; list_id?: string };
    const listId = list_id ?? '@default';
    try {
      const token = await getValidAccessToken();
      const body: Record<string, string> = { title };
      if (notes) body.notes = notes;
      if (due)   body.due   = due;
      const res  = await fetch(`${TASKS_BASE}/lists/${encodeURIComponent(listId)}/tasks`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json() as any;
      if (data.error) return reply.code(400).send({ error: data.error.message });
      return data;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.patch('/api/tasks/tasks/:id', async (req, reply) => {
    const { id }                     = req.params as { id: string };
    const { status, title, list_id } =
      req.body as { status?: string; title?: string; list_id?: string };
    const listId = list_id ?? '@default';
    try {
      const token  = await getValidAccessToken();
      const patch: Record<string, string> = {};
      if (status !== undefined) patch.status = status;
      if (title  !== undefined) patch.title  = title;
      const res  = await fetch(
        `${TASKS_BASE}/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`,
        {
          method:  'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify(patch),
        }
      );
      const data = await res.json() as any;
      if (data.error) return reply.code(400).send({ error: data.error.message });
      return data;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.delete('/api/tasks/tasks/:id', async (req, reply) => {
    const { id }       = req.params as { id: string };
    const { list_id }  = req.query as { list_id?: string };
    const listId       = list_id ?? '@default';
    try {
      const token = await getValidAccessToken();
      const res   = await fetch(
        `${TASKS_BASE}/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 204) return { ok: true };
      const data = await res.json() as any;
      return reply.code(400).send({ error: data.error?.message ?? 'Delete failed' });
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
