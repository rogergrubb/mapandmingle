import { Hono } from 'hono';
import { prisma } from '../index';

export const migrationRoutes = new Hono();

// POST /api/migrations/add-countdown-fields - Run migration (one-time)
migrationRoutes.post('/add-countdown-fields', async (c) => {
  try {
    console.log('🔄 Running migration: add arrivalTime and pinType fields...');
    
    // Use Prisma's $executeRaw to run raw SQL
    await prisma.$executeRaw`
      ALTER TABLE "Pin" ADD COLUMN IF NOT EXISTS "arrivalTime" TIMESTAMP(3);
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Pin" ADD COLUMN IF NOT EXISTS "pinType" TEXT NOT NULL DEFAULT 'current';
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Pin_arrivalTime_idx" ON "Pin"("arrivalTime");
    `;
    
    await prisma.$executeRaw`
      UPDATE "Pin" SET "pinType" = 'current' WHERE "pinType" IS NULL OR "pinType" = '';
    `;
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Pin' 
      AND column_name IN ('arrivalTime', 'pinType');
    `;
    
    return c.json({
      success: true,
      message: 'Migration completed successfully',
      columns: result
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return c.json({
      success: false,
      error: error.message,
      details: error
    }, 500);
  }
});
