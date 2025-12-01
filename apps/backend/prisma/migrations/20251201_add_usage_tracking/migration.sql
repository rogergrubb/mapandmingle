-- CreateTable UsageMetrics
CREATE TABLE "UsageMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pinsToday" INTEGER NOT NULL DEFAULT 0,
    "pinsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "minglestoday" INTEGER NOT NULL DEFAULT 0,
    "minglesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "messagesToday" INTEGER NOT NULL DEFAULT 0,
    "messagesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastDailyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMonthlyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable RateLimitLog
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageMetrics_userId_key" ON "UsageMetrics"("userId");

-- CreateIndex
CREATE INDEX "RateLimitLog_userId_idx" ON "RateLimitLog"("userId");

-- CreateIndex
CREATE INDEX "RateLimitLog_timestamp_idx" ON "RateLimitLog"("timestamp");

-- AddForeignKey
ALTER TABLE "UsageMetrics" ADD CONSTRAINT "UsageMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimitLog" ADD CONSTRAINT "RateLimitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
