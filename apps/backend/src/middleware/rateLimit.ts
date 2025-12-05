import { Context, Next } from 'hono';
import { prisma } from '../lib/prisma';

const RATE_LIMITS = {
  free: 30, // requests per minute
  trialing: 60,
  active: 200,
  premium: 200,
  default: 30,
};

interface RateLimitKey {
  userId: string;
  minute: number;
}

// In-memory rate limit tracking
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Global rate limiting middleware
 */
export async function rateLimitMiddleware(c: Context, next: Next) {
  const path = c.req.path;
  
  // Skip rate limiting for auth routes (login, register, OAuth callbacks)
  if (path.startsWith('/api/auth/') || path === '/api/auth') {
    return next();
  }
  
  // Skip rate limiting for health checks and debug
  if (path === '/' || path === '/health' || path.startsWith('/debug')) {
    return next();
  }
  
  const userId = c.req.header('X-User-Id');
  
  // Skip rate limiting for unauthenticated requests to public endpoints
  if (!userId) {
    return next();
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { subscriptionStatus: true },
    });

    const subscriptionStatus = profile?.subscriptionStatus || 'free';
    const limit = RATE_LIMITS[subscriptionStatus as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;

    // Get rate limit key (userId + current minute)
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const key = `${userId}:${currentMinute}`;

    // Get or initialize rate limit tracker
    let tracker = rateLimitMap.get(key);
    if (!tracker) {
      tracker = { count: 0, resetAt: now + 60000 };
      rateLimitMap.set(key, tracker);
    }

    // Clean up old entries
    if (tracker.resetAt < now) {
      tracker.count = 0;
      tracker.resetAt = now + 60000;
    }

    // Check limit
    if (tracker.count >= limit) {
      // Log rate limit event
      try {
        await prisma.rateLimitLog.create({
          data: {
            userId,
            endpoint: c.req.path,
            method: c.req.method,
            timestamp: new Date(),
            blocked: true,
          },
        });
      } catch (error) {
        console.error('Failed to log rate limit event:', error);
      }

      return c.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Max ${limit} requests per minute.`,
          retryAfter: Math.ceil((tracker.resetAt - now) / 1000),
        },
        429
      );
    }

    // Increment counter
    tracker.count++;

    // Log successful request
    try {
      await prisma.rateLimitLog.create({
        data: {
          userId,
          endpoint: c.req.path,
          method: c.req.method,
          timestamp: new Date(),
          blocked: false,
        },
      });
    } catch (error) {
      console.error('Failed to log request:', error);
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', (limit - tracker.count).toString());
    c.header('X-RateLimit-Reset', tracker.resetAt.toString());

    return next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request on error
    return next();
  }
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(userId: string) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { subscriptionStatus: true },
    });

    const subscriptionStatus = profile?.subscriptionStatus || 'free';
    const limit = RATE_LIMITS[subscriptionStatus as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;

    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const key = `${userId}:${currentMinute}`;
    const tracker = rateLimitMap.get(key);

    return {
      limit,
      remaining: tracker ? Math.max(0, limit - tracker.count) : limit,
      resetAt: tracker?.resetAt || now + 60000,
      subscriptionStatus,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitMap() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitMap.forEach((tracker, key) => {
    if (tracker.resetAt < now) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitMap.delete(key));
  console.log(`Cleaned up ${keysToDelete.length} rate limit entries`);
}
