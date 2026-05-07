import type { FastifyInstance } from 'fastify';
import { dbPing } from '../db.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const db = await dbPing();
    return {
      status: db ? 'ok' : 'degraded',
      db,
      uptime: process.uptime(),
      version: '1.0.0',
      ts: new Date().toISOString(),
    };
  });
}
