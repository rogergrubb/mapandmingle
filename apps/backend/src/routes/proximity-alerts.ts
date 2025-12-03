import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';
// import { sendProximityNotification } from './notifications';

export const proximityAlertRoutes = new Hono();

// GET /api/proximity-alerts - Get user's alerts
proximityAlertRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const alerts = await prisma.proximityAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    return c.json({
      alerts: alerts.map(a => ({
        id: a.id,
        name: a.name,
        latitude: a.latitude,
        longitude: a.longitude,
        radiusMeters: a.radiusMeters,
        isActive: a.isActive,
        minAge: a.minAge,
        maxAge: a.maxAge,
        gender: a.gender,
        interests: a.interests ? JSON.parse(a.interests) : [],
        activityIntent: a.activityIntent,
        minTrustScore: a.minTrustScore,
        cooldownMinutes: a.cooldownMinutes,
        maxAlertsPerDay: a.maxAlertsPerDay,
        alertsToday: a.alertsToday,
        lastTriggeredAt: a.lastTriggeredAt?.toISOString(),
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});

// POST /api/proximity-alerts - Create alert
proximityAlertRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    // Check premium status
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile || (profile.subscriptionStatus !== 'active' && profile.subscriptionStatus !== 'trial')) {
      return c.json({ error: 'Premium required' }, 403);
    }
    
    // Check limit
    const count = await prisma.proximityAlert.count({ where: { userId } });
    if (count >= 5) return c.json({ error: 'Maximum 5 alerts allowed' }, 400);
    
    const body = await c.req.json();
    
    const alert = await prisma.proximityAlert.create({
      data: {
        userId,
        name: body.name,
        latitude: body.latitude,
        longitude: body.longitude,
        radiusMeters: body.radiusMeters || 1000,
        minAge: body.minAge,
        maxAge: body.maxAge,
        gender: body.gender,
        interests: body.interests ? JSON.stringify(body.interests) : null,
        activityIntent: body.activityIntent,
        minTrustScore: body.minTrustScore,
        cooldownMinutes: body.cooldownMinutes || 60,
        maxAlertsPerDay: body.maxAlertsPerDay || 10,
      },
    });
    
    return c.json({ id: alert.id }, 201);
  } catch (error) {
    console.error('Error creating alert:', error);
    return c.json({ error: 'Failed to create alert' }, 500);
  }
});

// DELETE /api/proximity-alerts/:id
proximityAlertRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    
    await prisma.proximityAlert.deleteMany({
      where: { id, userId },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete alert' }, 500);
  }
});

// PUT /api/proximity-alerts/:id
proximityAlertRoutes.put('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    const body = await c.req.json();
    
    await prisma.proximityAlert.updateMany({
      where: { id, userId },
      data: {
        name: body.name,
        isActive: body.isActive,
        radiusMeters: body.radiusMeters,
        minAge: body.minAge,
        maxAge: body.maxAge,
        cooldownMinutes: body.cooldownMinutes,
        maxAlertsPerDay: body.maxAlertsPerDay,
      },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update alert' }, 500);
  }
});

// POST /api/proximity-alerts/check - Check alerts for current location
proximityAlertRoutes.post('/check', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const { latitude, longitude } = await c.req.json();
    
    if (!latitude || !longitude) {
      return c.json({ error: 'Location required' }, 400);
    }
    
    // Update user's location
    await prisma.profile.update({
      where: { userId },
      data: {
        currentLocationLat: latitude,
        currentLocationLng: longitude,
        lastActiveAt: new Date(),
      },
    });
    
    // Get user's interests for matching
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { interests: true },
    });
    let userInterests: string[] = [];
    if (userProfile?.interests) {
      try {
        userInterests = JSON.parse(userProfile.interests);
      } catch {}
    }
    
    // Get all active alerts from OTHER users where this user might match
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const alerts = await prisma.proximityAlert.findMany({
      where: {
        isActive: true,
        userId: { not: userId },
        alertsToday: { lt: prisma.proximityAlert.fields.maxAlertsPerDay },
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });
    
    const triggeredAlerts: string[] = [];
    
    for (const alert of alerts) {
      // Check cooldown
      if (alert.lastTriggeredAt) {
        const cooldownMs = alert.cooldownMinutes * 60 * 1000;
        if (now.getTime() - alert.lastTriggeredAt.getTime() < cooldownMs) {
          continue;
        }
      }
      
      // Check distance
      const distance = calculateDistance(
        latitude,
        longitude,
        alert.latitude,
        alert.longitude
      );
      
      if (distance > alert.radiusMeters) {
        continue;
      }
      
      // Check if already matched recently
      const recentMatch = await prisma.proximityAlertMatch.findFirst({
        where: {
          alertId: alert.id,
          matchedUserId: userId,
          matchedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });
      
      if (recentMatch) {
        continue;
      }
      
      // Check criteria
      const currentUserProfile = await prisma.profile.findUnique({
        where: { userId },
      });
      
      if (!currentUserProfile) continue;
      
      // Age check
      if (alert.minAge && currentUserProfile.age && currentUserProfile.age < alert.minAge) continue;
      if (alert.maxAge && currentUserProfile.age && currentUserProfile.age > alert.maxAge) continue;
      
      // Gender check
      if (alert.gender && currentUserProfile.gender !== alert.gender) continue;
      
      // Trust score check
      if (alert.minTrustScore && currentUserProfile.trustScore < alert.minTrustScore) continue;
      
      // Activity intent check
      if (alert.activityIntent && currentUserProfile.activityIntent !== alert.activityIntent) continue;
      
      // Interest check
      if (alert.interests) {
        try {
          const requiredInterests = JSON.parse(alert.interests);
          const hasMatchingInterest = requiredInterests.some((i: string) => userInterests.includes(i));
          if (!hasMatchingInterest) continue;
        } catch {}
      }
      
      // All checks passed - trigger alert!
      triggeredAlerts.push(alert.id);
      
      // Record match
      await prisma.proximityAlertMatch.create({
        data: {
          alertId: alert.id,
          matchedUserId: userId,
          distance,
          notified: true,
        },
      });
      
      // Update alert stats
      await prisma.proximityAlert.update({
        where: { id: alert.id },
        data: {
          lastTriggeredAt: now,
          alertsToday: { increment: 1 },
        },
      });
      
      // Calculate shared interests
      let alertOwnerInterests: string[] = [];
      if (alert.user.profile?.interests) {
        try {
          alertOwnerInterests = JSON.parse(alert.user.profile.interests);
        } catch {}
      }
      const sharedInterests = userInterests.filter(i => alertOwnerInterests.includes(i));
      
      // TODO: Send push notification to alert owner when implemented
      // sendProximityNotification(alert.userId, {
      //   id: userId,
      //   displayName: currentUserProfile.displayName || 'Someone',
      //   sharedInterests,
      // });
      
      // Send WebSocket notification
      broadcastToUser(alert.userId, {
        type: 'proximity_alert',
        alertId: alert.id,
        alertName: alert.name,
        matchedUser: {
          id: userId,
          displayName: currentUserProfile.displayName,
          avatar: currentUserProfile.avatar,
          trustScore: currentUserProfile.trustScore,
          chatReadiness: currentUserProfile.chatReadiness,
          sharedInterests,
        },
        distance: Math.round(distance),
      });
    }
    
    return c.json({
      success: true,
      triggeredAlerts: triggeredAlerts.length,
    });
  } catch (error) {
    console.error('Error checking proximity:', error);
    return c.json({ error: 'Failed to check proximity' }, 500);
  }
});

// GET /api/proximity-alerts/:id/matches - Get alert matches
proximityAlertRoutes.get('/:id/matches', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const alertId = c.req.param('id');
    
    // Verify ownership
    const alert = await prisma.proximityAlert.findFirst({
      where: { id: alertId, userId },
    });
    
    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404);
    }
    
    const matches = await prisma.proximityAlertMatch.findMany({
      where: { alertId },
      orderBy: { matchedAt: 'desc' },
      take: 50,
      include: {
        matchedUser: {
          include: { profile: true },
        },
      },
    });
    
    return c.json({
      matches: matches.map(m => ({
        id: m.id,
        matchedAt: m.matchedAt.toISOString(),
        distance: Math.round(m.distance),
        user: {
          id: m.matchedUser.id,
          displayName: m.matchedUser.profile?.displayName || m.matchedUser.name,
          avatar: m.matchedUser.profile?.avatar || m.matchedUser.image,
          trustScore: m.matchedUser.profile?.trustScore || 50,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return c.json({ error: 'Failed to fetch matches' }, 500);
  }
});

// POST /api/proximity-alerts/reset-daily - Reset daily alert counts (call via cron)
proximityAlertRoutes.post('/reset-daily', async (c) => {
    // TODO: implement
  try {
    // This should be called by a cron job at midnight
    await prisma.proximityAlert.updateMany({
      data: { alertsToday: 0 },
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error resetting daily counts:', error);
    return c.json({ error: 'Failed to reset' }, 500);
  }
});

// Helper function
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

