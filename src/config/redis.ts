import Redis from "ioredis";
import { config } from "./index";

export const redisConnection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  maxRetriesPerRequest: null,
});
redisConnection.on("connect", () => {
  console.log(" Redis connected successfully");
});

redisConnection.on("error", (err) => {
  console.error(" Redis connection error:", err.message);
});

redisConnection.on("close", () => {
  console.log(" Redis connection closed");
});
export async function closeRedisConnection(): Promise<void> {
  await redisConnection.quit();
  console.log("Redis connection closed");
}