import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { tenantRoutes } from './routes/tenants.js';
import { avatarRoutes } from './routes/avatar.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(tenantRoutes);
await app.register(avatarRoutes);

try {
  await app.listen({ port: config.port, host: config.host });
  console.log(`DAS Platform engine running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
