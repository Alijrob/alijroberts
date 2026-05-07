import 'dotenv/config';

function require(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3200'),
  host: process.env.HOST ?? '0.0.0.0',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    database: process.env.DB_NAME ?? 'ajr_central',
    user: process.env.DB_USER ?? 'pagios',
    password: require('DB_PASSWORD'),
  },
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appUrl: process.env.APP_URL ?? 'https://ajrcentralcommand.com',
  ownerEmail: process.env.OWNER_EMAIL ?? '',
  smtp: {
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
};
