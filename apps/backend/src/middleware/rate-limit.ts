import { Context, Next } from 'hono';

/**
 * Redis-based Rate Limiter for Production
 * 
 * This implementation uses Redis for distributed rate limiting across multiple server instances.
 * Install: npm install ioredis
 * 
 * Usage:
 * import { createRedisRateLimiter } from './middleware/rate-limit';
 * const rateLimiter = createRedisRateLimiter(redis);
 * app.use('*', rateLimiter());
 */

interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
  keyPrefix?: string;
}

/**
 * Create a Redis-based rate limiter middleware
 * 
 * @param redis - Redis client instance (ioredis)
 * @param options - Rate limiter configuration
 */
export function createRedisRateLimiter(redis: any, options: RateLimiterOptions = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000, // 1 minute
    keyPrefix = 'ratelimit',
  } = options;

  return async (c: Context, next: Next) => {
    try {
      // Get client identifier (IP address or user ID)
      const ip = c.req.header('x-forwarded-for') || 
                 c.req.header('x-real-ip') || 
                 'unknown';
      const userId = c.req.header('x-user-id');
      const identifier = userId || ip;
      
      const key = `${keyPrefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use Redis sorted set to track requests
      // Remove old entries outside the time window
      await redis.zremrangebyscore(key, 0, windowStart);
      
      // Count requests in current window
      const requestCount = await redis.zcard(key);
      
      if (requestCount >= maxRequests) {
        return c.json({ 
          error: 'Too many requests', 
          retryAfter: Math.ceil(windowMs / 1000) 
        }, 429);
      }
      
      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration on key
      await redis.expire(key, Math.ceil(windowMs / 1000));
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', (maxRequests - requestCount - 1).toString());
      c.header('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      
      await next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiter fails
      await next();
    }
  };
}

/**
 * In-Memory Rate Limiter (Development Only)
 * 
 * This is a simple in-memory implementation suitable for development.
 * DO NOT use in production with multiple server instances.
 */
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export function createInMemoryRateLimiter(options: RateLimiterOptions = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000,
  } = options;

  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown';
    const userId = c.req.header('x-user-id');
    const identifier = userId || ip;
    const key = `ratelimit:${identifier}`;
    
    const now = Date.now();
    const record = inMemoryStore.get(key);
    
    if (!record || now > record.resetAt) {
      inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
      
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', (maxRequests - 1).toString());
      c.header('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      
      await next();
      return;
    }
    
    if (record.count >= maxRequests) {
      return c.json({ 
        error: 'Too many requests', 
        retryAfter: Math.ceil((record.resetAt - now) / 1000) 
      }, 429);
    }
    
    record.count++;
    
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    c.header('X-RateLimit-Reset', new Date(record.resetAt).toISOString());
    
    await next();
  };
}

// Clean up old in-memory entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryStore.entries()) {
      if (now > record.resetAt) {
        inMemoryStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

/**
 * Example Redis setup:
 * 
 * import Redis from 'ioredis';
 * 
 * const redis = new Redis({
 *   host: process.env.REDIS_HOST || 'localhost',
 *   port: parseInt(process.env.REDIS_PORT || '6379'),
 *   password: process.env.REDIS_PASSWORD,
 * });
 * 
 * const rateLimiter = createRedisRateLimiter(redis, {
 *   maxRequests: 100,
 *   windowMs: 60000, // 1 minute
 * });
 * 
 * app.use('*', rateLimiter);
 */
