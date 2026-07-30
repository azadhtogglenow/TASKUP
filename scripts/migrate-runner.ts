import 'dotenv/config';
import { runMigrations } from '../src/db/migrate'; 

async function main() {
  await runMigrations();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
