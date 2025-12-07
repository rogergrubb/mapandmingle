import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma Client instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Helper to ensure DATABASE_URL has pgbouncer mode enabled
// This fixes the "prepared statement already exists" error with Railway's proxy
function getPgBouncerUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  
  // Check if URL already has pgbouncer parameter
  if (url.includes('pgbouncer=true')) {
    return url;
  }
  
  // Add pgbouncer=true to handle connection pooling
  // Also add connection_limit=1 to prevent connection issues
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}pgbouncer=true&connection_limit=1`;
}

// Get the modified database URL
const databaseUrl = getPgBouncerUrl(process.env.DATABASE_URL);

// Log for debugging (redacted)
if (databaseUrl) {
  console.log('[Prisma] Database URL configured with pgbouncer mode');
}

// Initialize Prisma Client with optimized settings
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
