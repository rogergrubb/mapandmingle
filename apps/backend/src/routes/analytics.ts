import { Hono } from 'hono';
import { AnalyticsService } from '../services/analytics';
import { requireUserId } from '../middleware/auth';

const analytics = new Hono();

/**
 * Track a custom event
 */
analytics.post('/track', async (c) => {
  const userId = requireUserId(c);
  const { eventType, eventData, metadata } = await c.req.json();

  await AnalyticsService.trackEvent({
    userId,
    eventType,
    eventData,
    metadata,
  });

  return c.json({ success: true });
});

/**
 * Get dashboard metrics (admin only)
 */
analytics.get('/dashboard', async (c) => {
  // TODO: Add admin check middleware
  const userId = requireUserId(c);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [mrr, conversionRate, churnRate, revenueByTier] = await Promise.all([
    AnalyticsService.getMRR(),
    AnalyticsService.getConversionRate(thirtyDaysAgo, now),
    AnalyticsService.getChurnRate(thirtyDaysAgo, now),
    AnalyticsService.getRevenueByTier(),
  ]);

  return c.json({
    mrr,
    conversionRate,
    churnRate,
    revenue: revenueByTier,
    period: {
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString(),
    },
  });
});

/**
 * Get retention metrics
 */
analytics.get('/retention', async (c) => {
  // TODO: Add admin check middleware
  const userId = requireUserId(c);

  const cohortDate = new Date();
  cohortDate.setDate(cohortDate.getDate() - 30);

  const retention = await Promise.all([
    AnalyticsService.getRetentionRate(cohortDate, 1),
    AnalyticsService.getRetentionRate(cohortDate, 7),
    AnalyticsService.getRetentionRate(cohortDate, 14),
    AnalyticsService.getRetentionRate(cohortDate, 30),
  ]);

  return c.json({
    cohortDate: cohortDate.toISOString(),
    retention: {
      day1: retention[0],
      day7: retention[1],
      day14: retention[2],
      day30: retention[3],
    },
  });
});

/**
 * Get top events
 */
analytics.get('/top-events', async (c) => {
  const userId = requireUserId(c);
  const limit = parseInt(c.req.query('limit') || '10');

  const topEvents = await AnalyticsService.getTopEvents(limit);

  return c.json({ events: topEvents });
});

/**
 * Get user LTV
 */
analytics.get('/ltv/:userId', async (c) => {
  // TODO: Add admin check middleware
  const requestingUserId = requireUserId(c);
  const targetUserId = c.req.param('userId');

  const ltv = await AnalyticsService.getUserLTV(targetUserId);

  return c.json({ userId: targetUserId, ltv });
});

export { analytics };
