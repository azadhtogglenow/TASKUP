import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";
import { console } from "inspector/promises";
export const pool = new Pool({ connectionString: env.databaseUrl });
export const db = drizzle(pool, { schema });
const DDL = `
  CREATE TABLE IF NOT EXISTS documents (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    content       TEXT NOT NULL,
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content)) STORED,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS documents_search_vector_idx
    ON documents USING GIN (search_vector);
`;
export async function initDatabase(): Promise<void> {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query("SELECT 1");
      break;
    } catch (err) {
      if (attempt === maxAttempts) {
        throw new Error(`Cannot connect to PostgreSQL: ${(err as Error).message}`);
      }
      console.log(`[db] waiting for PostgreSQL... (${attempt}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  await pool.query(DDL);
  console.log("[db] schema ready (documents table + full-text search index)");
}

export async function checkDatabase(): Promise<void> {
  await pool.query("SELECT 1");
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}