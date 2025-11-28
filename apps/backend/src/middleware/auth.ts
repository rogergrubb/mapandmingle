import { Context, Next } from 'hono';
import { prisma } from '../index';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      
      // Set user ID in context for downstream routes
      c.set('userId', decoded.userId);
      
      // Optionally verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true },
      });
      
      if (!user) {
        return c.json({ error: 'User not found' }, 401);
      }
      
      await next();
    } catch (jwtError) {
      if ((jwtError as any).name === 'TokenExpiredError') {
        return c.json({ error: 'Token expired' }, 401);
      }
      return c.json({ error: 'Invalid token' }, 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
}

// Optional auth - sets user ID if token is valid, but doesn't require it
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        c.set('userId', decoded.userId);
      } catch {
        // Ignore invalid tokens for optional auth
      }
    }
    
    await next();
  } catch (error) {
    await next();
  }
}

// Helper to get user ID from request
export function getUserId(c: Context): string | null {
  return c.get('userId') || null;
}

// Helper to require user ID
export function requireUserId(c: Context): string {
  const userId = getUserId(c);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

// Generate JWT token
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';
  return jwt.sign(
    { userId, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: '30d' }
  );
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';
    const decoded = jwt.verify(token, REFRESH_SECRET) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Rate limit middleware
export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const key = `ratelimit:${ip}`;
    
    if (!checkRateLimit(key, maxRequests, windowMs)) {
      return c.json({ error: 'Too many requests' }, 429);
    }
    
    await next();
  };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);
