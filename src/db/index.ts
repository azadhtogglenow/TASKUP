import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv'
dotenv.config()
 const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  const pool = new Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000, 
  });

export const db = drizzle(pool, { schema });
export { schema };