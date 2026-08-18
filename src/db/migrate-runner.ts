import { ensureVectorExtension, runMigrations } from "./migrator.js"; // <-- Change this to the actual file path where those two functions are located
import { pool } from "./index.js";

async function main() {
  console.log("Starting database preparation...");
  try {
    await ensureVectorExtension();
    await runMigrations();
    
    console.log("Database schema is fully ready!");
  } catch (error) {
    console.error(" Database migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log(" Database pool closed safely.");
  }
}

main();
