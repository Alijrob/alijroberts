import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { encrypt } from '../utils/emailCrypto.js';
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getValidAccessToken,
  isGoogleConnected,
} from '../services/googleService.js';
import { randomBytes } from 'crypto';

const CAL_BASE = 'https://www.googleapis.com/calendar/v3';

export async function calendarRoutes(app: FastifyInstance) {

  app.get('/api/calendar/status', async () => {
    return isGoogleConnected();
  });

  app.get('/api/calendar/auth/start', async (_req, reply) => {
    const state = randomBytes(16).toString('hex');
    return reply.redirect(getGoogleAuthUrl(state));
  });

  app.get('/api/calendar/auth/callback', async (req, reply) => {
    const { code, error } = req.query as { code?: string; error?: string };
    if (error || !code) {
      return reply.redirect(`/?google_auth_error=${encodeURIComponent(error ?? 'Access denied')}`);
    }
    try {
      const { accessToken, refreshToken, expiresAt, email } = await exchangeGoogleCode(code);
      await db.query('DELETE FROM google_tokens');
      await db.query(
        `INSERT INTO google_tokens (access_token_enc, refresh_token_enc, token_expires_at, google_email)
         VALUES ($1, $2, $3, $4)`,
        [encrypt(accessToken), encrypt(refreshToken), expiresAt, email]
      );
      return reply.redirect('/?google_auth_success=1');
    } catch (err: any) {
      return reply.redirect(`/?google_auth_error=${encodeURIComponent(err.message ?? 'Token exchange failed')}`);
    }
  });

  app.delete('/api/calendar/auth', async () => {
    await db.query('DELETE FROM google_tokens');
    return { ok: true };
  });

  app.get('/api/calendar/events', async (req, reply) => {
    try {
      const token  = await getValidAccessToken();
      const q      = req.query as { timeMin?: string; timeMax?: string };
      const now    = q.timeMin ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const future = q.timeMax ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
      const url    = `${CAL_BASE}/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(future)}&singleEvents=true&orderBy=startTime&maxResults=250`;
      const res    = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data   = await res.json() as any;
      if (data.error) return reply.code(400).send({ error: data.error.message });
      return { items: data.items ?? [] };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.post('/api/calendar/events', async (req, reply) => {
    const { summary, description, startDate, startTime, endDate, endTime, allDay } =
      req.body as {
        summary: string;
        description?: string;
        startDate: string;
        endDate: string;
        startTime?: string;
        endTime?: string;
        allDay?: boolean;
      };
    try {
      const token = await getValidAccessToken();
      const tz    = 'America/New_York';
      const event = allDay
        ? { summary, description, start: { date: startDate }, end: { date: endDate } }
        : {
            summary,
            description,
            start: { dateTime: `${startDate}T${startTime ?? '09:00'}:00`, timeZone: tz },
            end:   { dateTime: `${endDate}T${endTime ?? '10:00'}:00`,   timeZone: tz },
          };
      const res  = await fetch(`${CAL_BASE}/calendars/primary/events`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(event),
      });
      const data = await res.json() as any;
      if (data.error) return reply.code(400).send({ error: data.error.message });
      return data;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.delete('/api/calendar/events/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const token = await getValidAccessToken();
      const res   = await fetch(`${CAL_BASE}/calendars/primary/events/${encodeURIComponent(id)}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) return { ok: true };
      const data = await res.json() as any;
      return reply.code(400).send({ error: data.error?.message ?? 'Delete failed' });
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
