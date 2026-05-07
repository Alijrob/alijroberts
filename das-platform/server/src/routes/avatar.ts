import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';

function placeholderPage(name: string, domain: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;display:flex;align-items:center;justify-content:center}
    .wrap{text-align:center;padding:3rem 2rem;max-width:480px}
    .badge{display:inline-block;background:#7c3aed18;border:1px solid #7c3aed33;color:#a78bfa;font-size:.65rem;font-family:monospace;letter-spacing:.15em;text-transform:uppercase;padding:2px 8px;border-radius:4px;margin-bottom:1.5rem}
    h1{font-size:2.5rem;font-weight:800;letter-spacing:-.03em;margin-bottom:.5rem}
    .domain{color:rgba(248,250,252,.35);font-size:.9rem;margin-bottom:2rem}
    .status{background:#111;border:1px solid #1e1e1e;border-radius:8px;padding:1rem 1.5rem;color:rgba(248,250,252,.5);font-size:.85rem;line-height:1.6}
    .powered{margin-top:2rem;color:rgba(248,250,252,.2);font-size:.75rem}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="badge">Digital Avatar System</div>
    <h1>${name}</h1>
    <div class="domain">${domain}</div>
    <div class="status">Identity layer launching soon.<br>Check back shortly.</div>
    <div class="powered">Powered by PAGIOS</div>
  </div>
</body>
</html>`;
}

function notFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Not Found</title>
  <style>*{margin:0;padding:0}body{min-height:100vh;background:#0a0a0a;font-family:system-ui,sans-serif;color:rgba(248,250,252,.4);display:flex;align-items:center;justify-content:center;font-size:.9rem}</style>
</head>
<body>No avatar registered for this domain.</body>
</html>`;
}

export async function avatarRoutes(app: FastifyInstance) {
  app.get('/*', async (req, reply) => {
    const host = (req.headers['host'] ?? '').split(':')[0].toLowerCase();

    const { rows } = await db.query(
      "SELECT name, domain, status FROM tenants WHERE domain = $1",
      [host]
    );

    reply.header('Content-Type', 'text/html');

    if (!rows.length || rows[0].status === 'archived') {
      return reply.code(404).send(notFoundPage());
    }

    return reply.send(placeholderPage(rows[0].name as string, rows[0].domain as string));
  });
}
