import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../migrations');

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME ?? 'das_platform',
  user: process.env.DB_USER ?? 'pagios',
  password: process.env.DB_PASSWORD,
});

const client = await pool.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows: ran } = await client.query('SELECT filename FROM migrations');
  const ranSet = new Set(ran.map(r => r.filename));

  const files = (await fs.readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (ranSet.has(file)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log(`✓ ${file}`);
  }

  console.log('Migrations complete.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
