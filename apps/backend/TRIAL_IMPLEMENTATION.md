# Trial System Implementation Guide

## Overview

This document describes the complete trial system implementation for MapMingle, including user trials, usage limits, rate limiting, and admin utilities.

## Architecture

### Components

1. **TrialService** - Core trial management logic
2. **Rate Limiting Middleware** - API request rate limiting
3. **Usage Limits Middleware** - Feature usage limit enforcement
4. **Subscription Routes** - REST API endpoints
5. **Admin Utilities** - Scheduled task helpers
6. **Database Models** - UsageMetrics and RateLimitLog

## Features

### 1. Trial Initialization

**File**: `apps/backend/src/services/trial.service.ts`

- 14-day free trial for new users
- Automatic conversion to free tier upon expiration
- Full premium access during trial period

**Usage**:
```typescript
import { TrialService } from '../services/trial.service';

// Initialize trial on user registration
await TrialService.initializeTrial(userId);
```

### 2. Usage Limits

**File**: `apps/backend/src/middleware/usageLimits.ts`

#### Free Tier Limits
- **Pins**: 3 per day, 50 per month
- **Mingles**: 2 per day, 20 per month
- **Messages**: 20 per day, 1000 per month
- **API Calls**: 30 requests per minute

#### Trial Tier Limits (First 14 Days)
- **Pins**: 50 per day, 500 per month
- **Mingles**: 20 per day, 200 per month
- **Messages**: 1000 per day, 10000 per month
- **API Calls**: 60 requests per minute

#### Premium Tier Limits
- Unlimited access to all features
- 200 requests per minute

**Usage**:
```typescript
import { checkUsageLimit } from '../middleware/usageLimits';

// Apply to pin creation route
pinRoutes.post('/', checkUsageLimit('pin'), async (c) => {
  // ... create pin logic
});

// Apply to mingle creation route
mingleRoutes.post('/', checkUsageLimit('mingle'), async (c) => {
  // ... create mingle logic
});
```

### 3. Rate Limiting

**File**: `apps/backend/src/middleware/rateLimit.ts`

- In-memory request tracking per minute
- Automatic cleanup of old entries
- Detailed logging of rate limit events
- Tier-based limits (free: 30/min, trial: 60/min, premium: 200/min)

**Usage**:
```typescript
import { rateLimitMiddleware } from '../middleware/rateLimit';

// Apply globally in index.ts
app.use('*', rateLimitMiddleware);

// Check status
const status = await getRateLimitStatus(userId);
console.log(status.remaining); // requests remaining
```

### 4. API Endpoints

**File**: `apps/backend/src/routes/subscription-trial.ts`

#### GET /api/subscription/info
Complete subscription and usage information
```json
{
  "subscription": {
    "tier": "free|trial|premium",
    "status": "trialing|active|expired|canceled",
    "trialEndsAt": "2024-12-15T00:00:00Z",
    "subscriptionEnd": "2024-12-31T00:00:00Z"
  },
  "usage": {
    "pins": { "today": 2, "thisMonth": 15, ... },
    "mingles": { "today": 1, "thisMonth": 5, ... },
    "messages": { "today": 10, "thisMonth": 250, ... }
  },
  "trialDaysRemaining": 5
}
```

#### GET /api/subscription/status
Basic subscription status

#### GET /api/subscription/usage
Detailed usage statistics

#### POST /api/subscription/cancel
Cancel active subscription

## Database Schema

### UsageMetrics Model
Tracks daily and monthly usage for each user

```prisma
model UsageMetrics {
  id                  String   @id @default(cuid())
  userId              String   @unique
  pinsToday           Int      @default(0)
  pinsThisMonth       Int      @default(0)
  minglestoday        Int      @default(0)
  minglesThisMonth    Int      @default(0)
  messagesToday       Int      @default(0)
  messagesThisMonth   Int      @default(0)
  lastDailyReset      DateTime @default(now())
  lastMonthlyReset    DateTime @default(now())
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### RateLimitLog Model
Tracks all API requests for analytics

```prisma
model RateLimitLog {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String
  method    String
  timestamp DateTime @default(now())
  blocked   Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([timestamp])
}
```

## Admin Utilities

**File**: `apps/backend/src/utils/admin.utils.ts`

### Scheduled Tasks

These should be run via Cloud Scheduler or external cron:

#### Daily at UTC Midnight
```typescript
import { resetDailyLimitsForAllUsers } from './utils/admin.utils';

// Reset daily usage counters
await resetDailyLimitsForAllUsers();
```

#### Monthly on 1st
```typescript
import { resetMonthlyLimitsForAllUsers } from './utils/admin.utils';

// Reset monthly usage counters
await resetMonthlyLimitsForAllUsers();
```

#### Daily (Any Time)
```typescript
import { expireExpiredTrials } from './utils/admin.utils';

// Check and expire any trials that have ended
await expireExpiredTrials();
```

### Other Admin Functions

```typescript
// Initialize metrics for existing users (one-time)
await initializeUsageMetricsForExistingUsers();

// Get subscription statistics
const stats = await getAggregateSubscriptionStats();

// Clean up old logs
await cleanupRateLimitLogs();

// Get usage analytics for date range
const analytics = await getUsageAnalytics(startDate, endDate);
```

## Integration Points

### 1. User Registration

In `apps/backend/src/routes/auth.ts`:
```typescript
import { TrialService } from '../services/trial.service';

// After creating user
await TrialService.initializeTrial(user.id);
```

### 2. OAuth Callback

In `apps/backend/src/routes/auth.ts`:
```typescript
// When creating new OAuth user
await TrialService.initializeTrial(newUser.id);
```

### 3. Application Initialization

In `apps/backend/src/index.ts`:
```typescript
import { rateLimitMiddleware } from './middleware/rateLimit';
import { initializeUsageMetricsForExistingUsers } from './utils/admin.utils';

// Apply rate limiting globally
app.use('*', rateLimitMiddleware);

// Initialize metrics on startup (one-time)
initializeUsageMetricsForExistingUsers().catch(err => 
  console.warn('Could not initialize metrics:', err.message)
);
```

## Error Responses

### Limit Exceeded
```json
{
  "error": "Limit exceeded",
  "message": "Daily pin limit reached (3)",
  "action": "pin",
  "upgradeRequired": true
}
```
Status: 429 Too Many Requests

### Rate Limited
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Max 30 requests per minute.",
  "retryAfter": 15
}
```
Status: 429 Too Many Requests

### Trial Expired
Automatically handled - user converted to free tier with appropriate limits

## Performance Considerations

- **In-Memory Rate Limiting**: Uses in-memory Map, no database queries
- **Usage Metrics**: One database check per feature creation (cached after first check)
- **Auto-Reset**: Uses smart date comparison instead of cron jobs
- **Cleanup**: Periodic cleanup of rate limit map prevents memory bloat

## Testing

### Test New User Trial

```bash
# Register new user
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "password"
}

# Check subscription info
GET /api/subscription/info
# Should show subscriptionStatus: "trialing"

# Try creating pins (should succeed up to daily limit)
POST /api/pins
# Create 3 pins - should work
# Create 4th pin - should fail with 429
```

### Test Rate Limiting

```bash
# Make 30+ requests in one minute
# 31st request should fail with 429
```

### Test Monthly Limits

```bash
# Create max monthly pins (50)
# 51st should fail

# Wait for monthly reset or call admin endpoint
POST /api/admin/reset-monthly-limits
```

## Troubleshooting

### Issue: Users can't create content

**Check**:
1. Subscription status: `GET /api/subscription/info`
2. Usage limits: Check `usage` object
3. Rate limit status: `GET /api/subscription/info`
4. Trial expiration: Check `trialEndsAt`

### Issue: Rate limiting not working

**Check**:
1. Middleware is applied globally in `index.ts`
2. User ID header is being sent (`X-User-Id`)
3. Check `RateLimitLog` for blocked requests

### Issue: Limits not resetting

**Check**:
1. Scheduled tasks are running
2. Check `lastDailyReset` and `lastMonthlyReset` in database
3. Verify database connection works

## Security Notes

- All endpoints require `X-User-Id` header
- Rate limit checks happen before database queries
- Usage metrics are per-user isolated
- No sensitive data in logs

## Future Enhancements

1. Email notifications (7 days, 1 day before trial expires)
2. Premium upgrade prompts on limit exceeded
3. Custom limits per geographic region
4. Usage analytics dashboard
5. Migration discount codes
6. Family plan tier
