import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";
export async function runMigrations(): Promise<void> {
  console.log(" Running database migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log(" Migrations completed successfully");
  } catch (error) {
    console.error(" Migration failed:", error);
    throw error;
  }
}
export async function ensureVectorExtension(): Promise<void> {
  const { pool } = await import("./index.js");
  const client = await pool.connect();
  
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    console.log(" pg_vector extension enabled");
  } finally {
    client.release();
  }
}