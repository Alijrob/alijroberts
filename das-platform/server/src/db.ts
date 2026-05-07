import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const db = new Pool(config.db);

export async function dbPing(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
