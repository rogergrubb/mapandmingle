/**
 * Centralized configuration for MapMingle Backend
 * All environment variables should be accessed through this module
 */

// Helper to get required env var (fails if not set in production)
function getRequired(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

// Helper to get optional env var
function getOptional(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export const config = {
  // Environment
  nodeEnv: getOptional('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',

  // Server
  port: parseInt(getOptional('PORT', '3000'), 10),

  // Database
  databaseUrl: getRequired('DATABASE_URL', 'postgresql://localhost:5432/mapandmingle'),

  // JWT - MUST be set in production
  jwtSecret: getRequired('JWT_SECRET', 'dev-only-secret-change-in-production'),
  jwtRefreshSecret: getRequired('JWT_REFRESH_SECRET', getRequired('JWT_SECRET', 'dev-only-secret-change-in-production') + '-refresh'),
  jwtExpiresIn: getOptional('JWT_EXPIRES_IN', '7d'),
  jwtRefreshExpiresIn: getOptional('JWT_REFRESH_EXPIRES_IN', '30d'),

  // CORS - Allowed origins
  corsOrigins: getOptional('CORS_ORIGINS', 'https://mapandmingle.com,https://www.mapandmingle.com,https://mapandmingle.vercel.app,https://mapandmingle-production.up.railway.app').split(','),

  // App URLs
  appUrl: getRequired('APP_URL', 'http://localhost:3000'),
  frontendUrl: getRequired('FRONTEND_URL', 'http://localhost:5173'),

  // AWS S3
  aws: {
    region: getOptional('AWS_REGION', 'us-east-1'),
    accessKeyId: getOptional('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getOptional('AWS_SECRET_ACCESS_KEY'),
    s3BucketName: getOptional('S3_BUCKET_NAME', 'mapmingle-uploads'),
    cdnUrl: getOptional('CDN_URL'),
  },

  // Stripe
  stripe: {
    secretKey: getOptional('STRIPE_SECRET_KEY'),
    publishableKey: getOptional('STRIPE_PUBLISHABLE_KEY'),
    webhookSecret: getOptional('STRIPE_WEBHOOK_SECRET'),
    prices: {
      basicMonthly: getOptional('STRIPE_BASIC_MONTHLY_PRICE_ID'),
      basicYearly: getOptional('STRIPE_BASIC_YEARLY_PRICE_ID'),
      premiumMonthly: getOptional('STRIPE_PREMIUM_MONTHLY_PRICE_ID'),
      premiumYearly: getOptional('STRIPE_PREMIUM_YEARLY_PRICE_ID'),
    },
  },

  // Email (Resend)
  email: {
    resendApiKey: getOptional('RESEND_API_KEY'),
    fromEmail: getOptional('FROM_EMAIL', 'MapMingle <noreply@mapandmingle.com>'),
  },

  // Anthropic AI
  anthropic: {
    apiKey: getOptional('ANTHROPIC_API_KEY'),
  },

  // Push Notifications (VAPID)
  vapid: {
    publicKey: getOptional('VAPID_PUBLIC_KEY'),
    privateKey: getOptional('VAPID_PRIVATE_KEY'),
    subject: getOptional('VAPID_SUBJECT', 'mailto:admin@mapandmingle.com'),
  },

  // Redis (optional, for rate limiting)
  redis: {
    host: getOptional('REDIS_HOST', 'localhost'),
    port: parseInt(getOptional('REDIS_PORT', '6379'), 10),
    password: getOptional('REDIS_PASSWORD'),
  },

  // Rate Limiting defaults
  rateLimit: {
    auth: {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    api: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
    upload: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
    },
  },
} as const;

// Validate critical config on startup
export function validateConfig(): void {
  const errors: string[] = [];

  if (config.isProduction) {
    if (config.jwtSecret === 'dev-only-secret-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    if (config.jwtSecret.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters');
    }
    if (!config.databaseUrl || config.databaseUrl.includes('localhost')) {
      errors.push('DATABASE_URL must be set to a production database');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    if (config.isProduction) {
      process.exit(1);
    }
  }
}

export default config;
