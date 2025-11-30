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
  
  // Check if user has admin role
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });
  
  // Check if email matches admin email from env
  const isAdmin = dbUser?.email === process.env.ADMIN_EMAIL;
  
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

    // Get subscription stats from User model
    const totalSubscriptions = await prisma.user.count({
      where: {
        subscriptionStatus: {
          in: ['active', 'trialing']
        }
      }
    });

    const basicSubscriptions = await prisma.user.count({
      where: {
        subscriptionTier: 'basic',
        subscriptionStatus: {
          in: ['active', 'trialing']
        }
      }
    });

    const premiumSubscriptions = await prisma.user.count({
      where: {
        subscriptionTier: 'premium',
        subscriptionStatus: {
          in: ['active', 'trialing']
        }
      }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const basicMRR = basicSubscriptions * 0.99;
    const premiumMRR = premiumSubscriptions * 4.99;
    const totalMRR = basicMRR + premiumMRR;

    // Analytics events placeholder
    const totalEvents = 0;
    const recentEvents = 0;

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
        { name: { contains: search, mode: 'insensitive' } }
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
          name: true,
          createdAt: true,
          lastActiveAt: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          profile: {
            select: {
              handle: true,
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transform to expected format
    const transformedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.profile?.handle || u.email.split('@')[0],
      displayName: u.profile?.displayName || u.name || u.email,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: u.lastActiveAt?.toISOString() || u.createdAt.toISOString(),
      subscriptionTier: u.subscriptionTier || 'free',
      subscriptionStatus: u.subscriptionStatus || 'free'
    }));

    return c.json({
      users: transformedUsers,
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
        profile: true
      }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      ...user,
      stats: {
        eventsCount: 0
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

    const where: any = {
      subscriptionStatus: { not: null }
    };
    
    if (status) {
      where.subscriptionStatus = status;
    }
    if (tier) {
      where.subscriptionTier = tier;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          subscriptionEnd: true,
          createdAt: true,
          profile: {
            select: {
              handle: true,
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transform to subscription format
    const subscriptions = users.map(user => ({
      id: user.stripeSubscriptionId || user.id,
      userId: user.id,
      tier: user.subscriptionTier || 'free',
      status: user.subscriptionStatus || 'free',
      stripeCustomerId: user.stripeCustomerId || '',
      stripeSubscriptionId: user.stripeSubscriptionId || '',
      currentPeriodStart: user.createdAt.toISOString(),
      currentPeriodEnd: user.subscriptionEnd?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: user.createdAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.handle || user.email.split('@')[0],
        displayName: user.profile?.displayName || user.name || user.email
      }
    }));

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

    // Placeholder data - analytics_events table doesn't exist
    const eventsByType: any[] = [];
    const dailyActiveUsers: any[] = [];

    // Get conversion funnel from User model
    const signups = await prisma.user.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const subscriptions = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
        subscriptionStatus: { in: ['active', 'trialing'] }
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

    // Simplified daily revenue
    const dailyRevenue: Record<string, number> = {};

    // Get current MRR breakdown from User model
    const users = await prisma.user.findMany({
      where: {
        subscriptionStatus: {
          in: ['active', 'trialing']
        }
      },
      select: {
        subscriptionTier: true,
        createdAt: true
      }
    });

    const mrrByTier = users.reduce((acc: any, user) => {
      const tier = user.subscriptionTier || 'free';
      const amount = tier === 'premium' ? 4.99 : tier === 'basic' ? 0.99 : 0;
      if (!acc[tier]) {
        acc[tier] = { count: 0, mrr: 0 };
      }
      acc[tier].count++;
      acc[tier].mrr += amount;
      return acc;
    }, {});

    const totalMRR = Object.values(mrrByTier).reduce((sum: number, tier: any) => sum + tier.mrr, 0);

    return c.json({
      dailyRevenue,
      mrrByTier,
      totalMRR
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
    const { action, tier } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (action === 'cancel') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'cancelled'
        }
      });

      return c.json({ message: 'Subscription cancelled successfully' });
    }

    if ((action === 'upgrade' || action === 'downgrade') && tier) {
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

// Get all reports
admin.get('/reports', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, name: true, email: true, image: true }
          },
          reportedUser: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    // Fetch event comment details if present
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      let eventDetails = null;
      let commentDetails = null;

      if (report.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: report.eventId },
          select: { id: true, title: true }
        });
        eventDetails = event;
      }

      if (report.eventCommentId) {
        const comment = await prisma.eventComment.findUnique({
          where: { id: report.eventCommentId },
          select: { id: true, text: true, createdAt: true }
        });
        commentDetails = comment;
      }

      return {
        ...report,
        event: eventDetails,
        comment: commentDetails
      };
    }));

    return c.json({
      reports: enrichedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// Update report status
admin.patch('/reports/:id', async (c) => {
  try {
    const reportId = c.req.param('id');
    const body = await c.req.json();
    const { status, adminNotes } = body;

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes,
        reviewedAt: new Date()
      }
    });

    return c.json({ success: true, report });
  } catch (error) {
    console.error('Error updating report:', error);
    return c.json({ error: 'Failed to update report' }, 500);
  }
});

// Ban/suspend user
admin.post('/users/:id/ban', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { reason, duration } = body; // duration in days, null = permanent

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: false // Using emailVerified as ban flag for now
      }
    });

    return c.json({ success: true, message: `User ${userId} has been banned` });
  } catch (error) {
    console.error('Error banning user:', error);
    return c.json({ error: 'Failed to ban user' }, 500);
  }
});

export default admin;
