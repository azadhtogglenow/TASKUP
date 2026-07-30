import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index';
import dotenv from'dotenv'
dotenv.config()
export async function runMigrations() {
  console.log(' Running migrations...');
  try {
    const start = Date.now();
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    const duration = Date.now() - start;
    console.log(`Migrations completed in ${duration}ms`);
  } catch (error) {
    console.error(' Migration failed:', error);
    process.exit(1);
  }
}