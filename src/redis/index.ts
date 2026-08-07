import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  lazyConnect: true, 
});

redis.on('connect', () => {
  console.log(' Redis connected successfully');
});

redis.on('error', (err) => {
  console.error(' Redis connection error:', err.message);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

process.on('SIGINT', async () => {
  await redis.quit();
  process.exit(0);
});