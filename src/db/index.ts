import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schemas from './schemas';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema: schemas,});

export { pool };

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});