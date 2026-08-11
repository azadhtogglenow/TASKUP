import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";
import { config } from "../config";
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
export const db = drizzle(pool, { schema });
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("PostgreSQL connected successfully");
    return true;
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  console.log("Database pool closed");
}