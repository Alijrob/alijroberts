import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { authRoutes } from './routes/auth.js';
import { aiVisionRoutes } from './routes/ai-vision.js';
import { dockRoutes } from './routes/dock.js';
import { chatRoutes } from './routes/chat.js';
import { apikeyRoutes } from './routes/apikeys.js';
import { canvasRoutes } from './routes/canvas.js';
import { brainRoutes } from './routes/brain.js';
import { identityRoutes } from './routes/identity.js';
import { platformRoutes } from './routes/platform.js';
import { embedRoutes } from './routes/embed.js';
import { filesRoutes } from './routes/files.js';
import { mediaFilesRoutes } from './routes/media-files.js';
import { sidebarLinksRoutes } from './routes/sidebar-links.js';
import { bridgesRoutes } from './routes/bridges.js';
import { emailRoutes } from './routes/email.js';
import { calendarRoutes } from './routes/calendar.js';
import { tasksRoutes } from './routes/tasks.js';
import { projectsRoutes } from './routes/projects.js';
import { skillsRoutes } from './routes/skills.js';
import { db } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureChatTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'claude',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS chat_messages_conv_idx ON chat_messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS chat_conversations_updated_idx ON chat_conversations(updated_at DESC);
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
await app.register(staticFiles, {
  root: path.join(__dirname, '../public'),
});

await app.register(staticFiles, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});

await app.register(healthRoutes);
await app.register(onboardingRoutes);
await app.register(authRoutes);
await app.register(aiVisionRoutes);
await app.register(dockRoutes);
await app.register(chatRoutes);
await app.register(apikeyRoutes);
await app.register(canvasRoutes);
await app.register(brainRoutes);
await app.register(identityRoutes);
await app.register(platformRoutes);
await app.register(embedRoutes);
await app.register(filesRoutes);
await app.register(mediaFilesRoutes);
await app.register(sidebarLinksRoutes);
await app.register(bridgesRoutes);
await app.register(emailRoutes);
await app.register(calendarRoutes);
await app.register(tasksRoutes);
await app.register(projectsRoutes);
await app.register(skillsRoutes);

// SPA fallback — serve index.html for all non-API routes
app.setNotFoundHandler((_req, reply) => {
  reply.sendFile('index.html');
});

try {
  await ensureChatTables();
  await app.listen({ port: config.port, host: config.host });
  console.log(`AJR Central running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
