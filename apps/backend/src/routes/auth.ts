import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import * as crypto from 'crypto';

export const authRoutes = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Helper: Hash password
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Helper: Verify password
function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Helper: Generate session token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/auth/register - Register new user
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid data', details: parsed.error.errors }, 400);
    }
    
    const { email, password, name } = parsed.data;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 409);
    }
    
    // Create user
    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: false,
      },
    });
    
    // Create account with password
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });
    
    // Create profile with 30-day trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    
    await prisma.profile.create({
      data: {
        userId: user.id,
        subscriptionStatus: 'trial',
        subscriptionStartedAt: new Date(),
        subscriptionExpiresAt: trialEnd,
      },
    });
    
    // Create session
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      token,
      expiresAt: expiresAt.toISOString(),
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// POST /api/auth/login - Login user
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid credentials' }, 400);
    }
    
    const { email, password } = parsed.data;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
      },
    });
    
    if (!user || !user.accounts[0]?.password) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    if (!verifyPassword(password, user.accounts[0].password)) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Create session
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });
    
    // Update last active
    await prisma.profile.update({
      where: { userId: user.id },
      data: { lastActiveAt: new Date() },
    });
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /api/auth/logout - Logout user
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    await prisma.session.deleteMany({
      where: { token },
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// GET /api/auth/session - Get current session
authRoutes.get('/session', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ user: null });
    }
    
    const token = authHeader.substring(7);
    
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    if (!session || session.expiresAt < new Date()) {
      return c.json({ user: null });
    }
    
    return c.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        emailVerified: session.user.emailVerified,
        profile: session.user.profile,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return c.json({ user: null });
  }
});

// POST /api/auth/request-reset - Request password reset
authRoutes.post('/request-reset', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = resetPasswordRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid email' }, 400);
    }
    
    const { email } = parsed.data;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return c.json({ success: true, message: 'If an account exists, a reset email has been sent' });
    }
    
    // Create verification token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
    
    await prisma.verification.create({
      data: {
        identifier: email,
        value: token,
        expiresAt,
      },
    });
    
    // TODO: Send email with reset link
    // In production, use Resend to send email
    console.log(`Password reset token for ${email}: ${token}`);
    
    return c.json({ success: true, message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

// POST /api/auth/reset-password - Reset password with token
authRoutes.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid data' }, 400);
    }
    
    const { token, password } = parsed.data;
    
    // Find verification
    const verification = await prisma.verification.findFirst({
      where: {
        value: token,
        expiresAt: { gt: new Date() },
      },
    });
    
    if (!verification) {
      return c.json({ error: 'Invalid or expired token' }, 400);
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: verification.identifier },
    });
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Update password
    const hashedPassword = hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: user.id, providerId: 'credential' },
      data: { password: hashedPassword },
    });
    
    // Delete verification token
    await prisma.verification.delete({ where: { id: verification.id } });
    
    // Delete all sessions (force re-login)
    await prisma.session.deleteMany({ where: { userId: user.id } });
    
    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// POST /api/auth/verify-email - Verify email (would be called from email link)
authRoutes.post('/verify-email', async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;
    
    if (!token) {
      return c.json({ error: 'Token required' }, 400);
    }
    
    // Find verification
    const verification = await prisma.verification.findFirst({
      where: {
        value: token,
        expiresAt: { gt: new Date() },
      },
    });
    
    if (!verification) {
      return c.json({ error: 'Invalid or expired token' }, 400);
    }
    
    // Update user
    await prisma.user.update({
      where: { email: verification.identifier },
      data: { emailVerified: true },
    });
    
    // Delete verification
    await prisma.verification.delete({ where: { id: verification.id } });
    
    return c.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return c.json({ error: 'Failed to verify email' }, 500);
  }
});
