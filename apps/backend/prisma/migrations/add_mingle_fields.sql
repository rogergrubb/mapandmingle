-- CreateIndex
CREATE INDEX "MingleEvent_status_idx" ON "MingleEvent"("status");

-- CreateIndex  
CREATE INDEX "MingleEvent_isActive_idx" ON "MingleEvent"("isActive");

-- AlterTable
ALTER TABLE "MingleEvent" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MingleEvent" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MingleEvent" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "MingleEvent" ADD COLUMN "privacy" VARCHAR(255) DEFAULT 'public';
ALTER TABLE "MingleEvent" ADD COLUMN "tags" TEXT;