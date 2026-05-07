import 'dotenv/config';

function req(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3400'),
  host: process.env.HOST ?? '0.0.0.0',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    database: process.env.DB_NAME ?? 'das_platform',
    user: process.env.DB_USER ?? 'pagios',
    password: req('DB_PASSWORD'),
  },
  platformApiKey: req('PLATFORM_API_KEY'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
