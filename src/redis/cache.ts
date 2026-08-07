import { redis } from './index.js';

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL || '3600', 10); // 1 hour default

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setInCache(key: string, value: unknown, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function deleteFromCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}


export async function deleteByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
}
export const CacheKeys = {
  
  userById: (id: string) => `user:id:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  
  documentById: (id: string) => `document:id:${id}`,
  documentsByUser: (userId: string) => `documents:user:${userId}`,
} as const;