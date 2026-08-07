import dotenv from 'dotenv';
import { redis } from './redis/index';
import app from './app';


dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await redis.connect();
    console.log(' Redis connected');

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(` Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(` API base: http://localhost:${PORT}/api`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
}


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});


startServer();