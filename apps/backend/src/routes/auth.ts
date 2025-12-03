import { Hono } from 'hono';
import { TrialService } from '../services/trial.service';
import { prisma } from '../index';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken, verifyRefreshToken, rateLimitMiddleware } from '../middleware/auth';
import { EmailService } from '../services/email.service';
import { StripeService } from '../services/stripe.service';
import { config } from '../config';

export const authRoutes = new Hono();

// Apply rate limiting to all auth routes (10 requests per 15 minutes)
authRoutes.use('*', rateLimitMiddleware(
  config.rateLimit.auth.maxRequests, 
  config.rateLimit.auth.windowMs
));

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

    // Initialize 14-day trial for new users
    await TrialService.initializeTrial(user.id);
    
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
    
    // Create Stripe customer
    try {
      const stripeCustomerId = await StripeService.createCustomer(
        user.email,
        user.name || email.split('@')[0],
        user.id
      );
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
    }

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(user.email, user.name || email.split('@')[0]);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

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
    
    // Send email with reset link using Resend
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'noreply@mapandmingle.com',
            to: email,
            subject: 'Reset Your Map & Mingle Password',
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;"><h1 style="color: white; margin: 0;">Map & Mingle</h1></div><div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 12px 12px;"><h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2><p style="color: #6b7280; line-height: 1.6;">You requested a password reset. Click the button to set a new password.</p><div style="text-align: center; margin: 30px 0;"><a href="${resetLink}" style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 12px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a></div><p style="color: #9ca3af; font-size: 13px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p></div></div>`,
          }),
        });
      }
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }
    
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

// ==================== GOOGLE OAUTH ====================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://mapandmingle-api-492171901610.us-west1.run.app/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.mapandmingle.com';

// Type definitions for Google OAuth
interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

// GET /api/auth/google - Initiate Google OAuth
authRoutes.get('/google', async (c) => {
  const state = Math.random().toString(36).substring(7);
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /api/auth/google/callback - Google OAuth callback
authRoutes.get('/google/callback', async (c) => {
  console.log('=== Google OAuth Callback Hit ===');
  console.log('Query params:', c.req.query());
  
  try {
    const code = c.req.query('code');
    const error = c.req.query('error');
    
    if (error) {
      console.error('Google OAuth error:', error);
      return c.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
    
    if (!code) {
      return c.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json() as GoogleTokenResponse;
    
    if (!tokenResponse.ok) {
      console.error('Google token error:', tokenData);
      const errorDetail = encodeURIComponent(JSON.stringify(tokenData));
      return c.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed&detail=${errorDetail}`);
    }
    
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const googleUser = await userInfoResponse.json() as GoogleUserInfo;
    
    if (!googleUser.email) {
      return c.redirect(`${FRONTEND_URL}/login?error=no_email`);
    }
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { profile: true, accounts: true },
    });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          image: googleUser.picture,
          emailVerified: true, // Google emails are verified
        },
        include: { profile: true, accounts: true },
      });
      
      // Create Google account link
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: googleUser.id,
          providerId: 'google',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });
      
      // Create profile with 30-day trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);
      
      await prisma.profile.create({
        data: {
          userId: user.id,
          displayName: googleUser.name,
          avatar: googleUser.picture,
          subscriptionStatus: 'trial',
          subscriptionStartedAt: new Date(),
          subscriptionExpiresAt: trialEnd,
          trustScore: 50,
        },
      });
      
      // Create Stripe customer
      try {
        const stripeCustomerId = await StripeService.createCustomer(
          user.email,
          user.name || googleUser.email.split('@')[0],
          user.id
        );
        
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId },
        });
      } catch (err) {
        console.error('Failed to create Stripe customer:', err);
      }
      
      // Refetch user with profile
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true, accounts: true },
      });
    } else {
      // User exists - check if Google account is linked
      const googleAccount = user.accounts.find(a => a.providerId === 'google');
      
      if (!googleAccount) {
        // Link Google account to existing user
        await prisma.account.create({
          data: {
            userId: user.id,
            accountId: googleUser.id,
            providerId: 'google',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        });
      } else {
        // Update existing Google account tokens
        await prisma.account.update({
          where: { id: googleAccount.id },
          data: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || googleAccount.refreshToken,
            accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        });
      }
      
      // Update profile avatar if not set
      if (user.profile && !user.profile.avatar && googleUser.picture) {
        await prisma.profile.update({
          where: { userId: user.id },
          data: { avatar: googleUser.picture },
        });
      }
      
      // Update last active
      if (user.profile) {
        await prisma.profile.update({
          where: { userId: user.id },
          data: { lastActiveAt: new Date() },
        });
      }
    }
    
    // Generate JWT tokens
    const accessToken = generateToken(user!.id, user!.email);
    const refreshToken = generateRefreshToken(user!.id);
    
    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
    });
    
    return c.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return c.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
  }
});
