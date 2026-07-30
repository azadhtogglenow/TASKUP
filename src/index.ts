import dotenv from 'dotenv';
import { runMigrations } from './db/migrate';
import app from './app';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    
    if (process.env.NODE_ENV === 'development') {
      await runMigrations();
    }

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`Document Management API`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Heath check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();