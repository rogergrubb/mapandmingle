import { Hono } from 'hono';
import { prisma } from '../index';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';

export const authRoutes = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// POST /api/auth/register - Register new user
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid data', details: parsed.error.errors }, 400);
    }
    
    const { email, password, name, displayName, username } = parsed.data;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 409);
    }
    
    // Check if username is taken
    if (username) {
      const existingUsername = await prisma.user.findFirst({ where: { name: username } });
      if (existingUsername) {
        return c.json({ error: 'Username already taken' }, 409);
      }
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: displayName || name || username || email.split('@')[0],
        emailVerified: false,
      },
    });
    
    // Create account with hashed password
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
    
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: displayName || name,
        handle: username,
        subscriptionStatus: 'trial',
        subscriptionStartedAt: new Date(),
        subscriptionExpiresAt: trialEnd,
        trustScore: 50,
      },
    });
    
    // Generate JWT tokens
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: profile.displayName || user.name,
        username: profile.handle || username,
        avatar: profile.avatar,
        bio: profile.bio,
        interests: profile.interests ? JSON.parse(profile.interests) : [],
        trustScore: profile.trustScore,
        streak: 0,
        isPremium: profile.subscriptionStatus === 'active',
        isVerified: user.emailVerified,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
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
    
    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
        profile: true,
      },
    });
    
    if (!user || !user.accounts[0]?.password) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.accounts[0].password);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Update last active
    const profile = await prisma.profile.update({
      where: { userId: user.id },
      data: { lastActiveAt: new Date() },
    });
    
    // Generate JWT tokens
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: profile.displayName || user.name,
        username: profile.handle,
        avatar: profile.avatar,
        bio: profile.bio,
        interests: profile.interests ? JSON.parse(profile.interests) : [],
        trustScore: profile.trustScore,
        streak: 0,
        isPremium: profile.subscriptionStatus === 'active',
        isVerified: user.emailVerified,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /api/auth/refresh - Refresh access token
authRoutes.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = refreshTokenSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid request' }, 400);
    }
    
    const { refreshToken } = parsed.data;
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return c.json({ error: 'Invalid or expired refresh token' }, 401);
    }
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Generate new access token
    const accessToken = generateToken(user.id, user.email);
    
    return c.json({
      accessToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Token refresh failed' }, 500);
  }
});

// POST /api/auth/logout - Logout user (optional: invalidate tokens if using a blacklist)
authRoutes.post('/logout', async (c) => {
  try {
    // With JWT, logout is typically handled client-side by removing tokens
    // If you implement a token blacklist, add the token here
    
    return c.json({ success: true, message: 'Logged out successfully' });
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
    
    // The JWT verification is handled by the auth middleware
    // If we reach here, the token is valid
    const userId = c.req.header('x-user-id');
    
    if (!userId) {
      return c.json({ user: null });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
    
    if (!user) {
      return c.json({ user: null });
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        profile: user.profile,
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
    
    // Generate secure token
    const token = generateRefreshToken(user.id);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
    
    await prisma.verification.create({
      data: {
        identifier: email,
        value: token,
        expiresAt,
      },
    });
    
    // TODO: Send email with reset link using Resend
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
    
    // Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password
    await prisma.account.updateMany({
      where: { userId: user.id, providerId: 'credential' },
      data: { password: hashedPassword },
    });
    
    // Delete verification token
    await prisma.verification.delete({ where: { id: verification.id } });
    
    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// POST /api/auth/verify-email - Verify email
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
