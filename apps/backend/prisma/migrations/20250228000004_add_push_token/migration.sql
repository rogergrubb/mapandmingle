-- Add pushToken field to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS "User_pushToken_idx" ON "User"("pushToken");
