import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const admin = new Hono();

// Middleware to check if user is admin
const requireAdmin = async (c: any, next: any) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Check if user has admin role (you can customize this logic)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });
  
  // For now, check if email contains 'admin' or matches specific admin emails
  // TODO: Add proper admin role field to User model
  const isAdmin = dbUser?.email?.includes('admin') || dbUser?.email === process.env.ADMIN_EMAIL;
  
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  
  await next();
};

// Apply auth middleware to all admin routes
admin.use('*', authMiddleware, requireAdmin);

// Dashboard overview statistics
admin.get('/dashboard/stats', async (c) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get new users (last 30 days)
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get active users (last 7 days)
    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get subscription stats
    const totalSubscriptions = await prisma.subscription.count({
      where: {
        status: {
          in: ['active', 'trialing']
        }
      }
    });

    const basicSubscriptions = await prisma.subscription.count({
      where: {
        tier: 'basic',
        status: {
          in: ['active', 'trialing']
        }
      }
    });

    const premiumSubscriptions = await prisma.subscription.count({
      where: {
        tier: 'premium',
        status: {
          in: ['active', 'trialing']
        }
      }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const basicMRR = basicSubscriptions * 0.99;
    const premiumMRR = premiumSubscriptions * 4.99;
    const totalMRR = basicMRR + premiumMRR;

    // Get analytics events count
    const totalEvents = await prisma.analyticsEvent.count();
    
    const recentEvents = await prisma.analyticsEvent.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    return c.json({
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers
      },
      subscriptions: {
        total: totalSubscriptions,
        basic: basicSubscriptions,
        premium: premiumSubscriptions
      },
      revenue: {
        mrr: totalMRR,
        basicMRR,
        premiumMRR
      },
      analytics: {
        totalEvents,
        recentEvents
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return c.json({ error: 'Failed to fetch dashboard statistics' }, 500);
  }
});

// Get user list with pagination
admin.get('/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          createdAt: true,
          lastActiveAt: true,
          subscriptionTier: true,
          subscriptionStatus: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    return c.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get user details
admin.get('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true
      }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get user's activity stats
    const eventsCount = await prisma.analyticsEvent.count({
      where: { userId }
    });

    return c.json({
      ...user,
      stats: {
        eventsCount
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return c.json({ error: 'Failed to fetch user details' }, 500);
  }
});

// Get subscription list
admin.get('/subscriptions', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const tier = c.req.query('tier');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (tier) {
      where.tier = tier;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.subscription.count({ where })
    ]);

    return c.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});

// Get analytics overview
admin.get('/analytics/overview', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get events by type
    const eventsByType = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get daily active users
    const dailyActiveUsers = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as count
      FROM analytics_events
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get conversion funnel
    const signups = await prisma.analyticsEvent.count({
      where: {
        eventType: 'signup',
        createdAt: { gte: startDate }
      }
    });

    const subscriptions = await prisma.analyticsEvent.count({
      where: {
        eventType: 'subscription_created',
        createdAt: { gte: startDate }
      }
    });

    const conversionRate = signups > 0 ? (subscriptions / signups * 100).toFixed(2) : '0.00';

    return c.json({
      eventsByType,
      dailyActiveUsers,
      funnel: {
        signups,
        subscriptions,
        conversionRate: parseFloat(conversionRate)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Get revenue metrics
admin.get('/analytics/revenue', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get subscription events
    const subscriptionEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: {
          in: ['subscription_created', 'subscription_renewed', 'subscription_cancelled']
        },
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Calculate daily revenue
    const dailyRevenue: Record<string, number> = {};
    subscriptionEvents.forEach(event => {
      const date = event.createdAt.toISOString().split('T')[0];
      const metadata = event.metadata as any;
      const amount = metadata?.amount || 0;
      
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      
      if (event.eventType === 'subscription_created' || event.eventType === 'subscription_renewed') {
        dailyRevenue[date] += amount;
      }
    });

    // Get current MRR breakdown
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: ['active', 'trialing']
        }
      },
      select: {
        tier: true,
        createdAt: true
      }
    });

    const mrrByTier = subscriptions.reduce((acc: any, sub) => {
      const amount = sub.tier === 'premium' ? 4.99 : 0.99;
      if (!acc[sub.tier]) {
        acc[sub.tier] = { count: 0, mrr: 0 };
      }
      acc[sub.tier].count++;
      acc[sub.tier].mrr += amount;
      return acc;
    }, {});

    return c.json({
      dailyRevenue,
      mrrByTier,
      totalMRR: Object.values(mrrByTier).reduce((sum: number, tier: any) => sum + tier.mrr, 0)
    });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    return c.json({ error: 'Failed to fetch revenue metrics' }, 500);
  }
});

// Update user subscription
admin.post('/users/:id/subscription', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { action, tier } = body; // action: 'upgrade', 'downgrade', 'cancel'

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (action === 'cancel' && user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date()
        }
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'cancelled'
        }
      });

      return c.json({ message: 'Subscription cancelled successfully' });
    }

    if ((action === 'upgrade' || action === 'downgrade') && tier) {
      if (user.subscription) {
        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: { tier }
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: tier
        }
      });

      return c.json({ message: `Subscription ${action}d to ${tier} successfully` });
    }

    return c.json({ error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return c.json({ error: 'Failed to update subscription' }, 500);
  }
});

export default admin;
