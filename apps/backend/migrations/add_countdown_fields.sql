-- Add arrivalTime and pinType fields to Pin table for countdown timers
-- Migration created: 2024-12-08

-- Add arrivalTime column (nullable, when user will arrive at destination)
ALTER TABLE "Pin" ADD COLUMN IF NOT EXISTS "arrivalTime" TIMESTAMP(3);

-- Add pinType column (default "current", can be "current" or "future")
ALTER TABLE "Pin" ADD COLUMN IF NOT EXISTS "pinType" TEXT NOT NULL DEFAULT 'current';

-- Create index on arrivalTime for efficient queries
CREATE INDEX IF NOT EXISTS "Pin_arrivalTime_idx" ON "Pin"("arrivalTime");

-- Update existing pins to have pinType = 'current'
UPDATE "Pin" SET "pinType" = 'current' WHERE "pinType" IS NULL;
