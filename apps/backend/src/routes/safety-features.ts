import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const safetyRoutes = new Hono();

// ============================================================================
// CHECK-INS
// ============================================================================

// POST /api/safety/checkin - Create a check-in
safetyRoutes.post('/checkin', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { type, message, latitude, longitude, placeName, circleId } = await c.req.json();

    if (!type || !['home', 'arrived', 'safe', 'custom'].includes(type)) {
      return c.json({ error: 'Invalid check-in type' }, 400);
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        type,
        message,
        latitude,
        longitude,
        placeName,
        circleId,
      },
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, displayName: true, image: true },
    });

    // Notify relevant people
    let recipientIds: string[] = [];

    if (circleId) {
      // Notify specific circle
      const members = await prisma.circleMember.findMany({
        where: { circleId, userId: { not: userId } },
        select: { userId: true },
      });
      recipientIds = members.map(m => m.userId);
    } else {
      // Notify all circles user belongs to
      const memberships = await prisma.circleMember.findMany({
        where: { userId },
        select: { circleId: true },
      });
      
      const circleIds = memberships.map(m => m.circleId);
      
      const allMembers = await prisma.circleMember.findMany({
        where: {
          circleId: { in: circleIds },
          userId: { not: userId },
        },
        select: { userId: true },
      });
      
      recipientIds = [...new Set(allMembers.map(m => m.userId))];
    }

    // Build notification message
    const typeMessages: Record<string, string> = {
      home: 'is home',
      arrived: 'has arrived',
      safe: 'is safe',
      custom: message || 'checked in',
    };

    for (const recipientId of recipientIds) {
      broadcastToUser(recipientId, {
        type: 'check_in',
        checkInId: checkIn.id,
        checkInType: type,
        user: {
          id: userId,
          name: user?.displayName || user?.name,
          image: user?.image,
        },
        message: typeMessages[type],
        location: latitude && longitude ? {
          lat: latitude,
          lng: longitude,
          name: placeName,
        } : null,
        timestamp: checkIn.createdAt.toISOString(),
      });
    }

    return c.json({
      id: checkIn.id,
      type: checkIn.type,
      createdAt: checkIn.createdAt.toISOString(),
      notifiedCount: recipientIds.length,
    }, 201);
  } catch (error) {
    console.error('Error creating check-in:', error);
    return c.json({ error: 'Failed to check in' }, 500);
  }
});

// GET /api/safety/checkins - Get recent check-ins from circles
safetyRoutes.get('/checkins', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get user's circles
    const memberships = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });
    
    const circleIds = memberships.map(m => m.circleId);

    // Get all members of those circles
    const allMembers = await prisma.circleMember.findMany({
      where: { circleId: { in: circleIds } },
      select: { userId: true },
    });
    
    const memberIds = [...new Set(allMembers.map(m => m.userId))];

    // Get recent check-ins from those users (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: { in: memberIds },
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    return c.json({
      checkIns: checkIns.map(ci => ({
        id: ci.id,
        type: ci.type,
        message: ci.message,
        user: {
          id: ci.user.id,
          name: ci.user.displayName || ci.user.name,
          image: ci.user.image,
        },
        location: ci.latitude && ci.longitude ? {
          lat: ci.latitude,
          lng: ci.longitude,
          name: ci.placeName,
        } : null,
        createdAt: ci.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return c.json({ error: 'Failed to fetch check-ins' }, 500);
  }
});

// ============================================================================
// EMERGENCY ALERTS (PANIC BUTTON)
// ============================================================================

// POST /api/safety/emergency - Trigger emergency alert
safetyRoutes.post('/emergency', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { latitude, longitude, batteryLevel, message, voiceNoteUrl } = await c.req.json();

    if (!latitude || !longitude) {
      return c.json({ error: 'Location is required for emergency alerts' }, 400);
    }

    // Create emergency alert
    const alert = await prisma.emergencyAlert.create({
      data: {
        userId,
        latitude,
        longitude,
        batteryLevel,
        message,
        voiceNoteUrl,
      },
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, displayName: true, image: true, phone: true },
    });

    // Get all people who should be notified (all circle members)
    const memberships = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });
    
    const circleIds = memberships.map(m => m.circleId);

    const allMembers = await prisma.circleMember.findMany({
      where: {
        circleId: { in: circleIds },
        userId: { not: userId },
      },
      select: { 
        userId: true,
        circle: {
          select: { name: true },
        },
      },
    });

    const recipientIds = [...new Set(allMembers.map(m => m.userId))];

    // Send emergency notification to all circle members
    for (const recipientId of recipientIds) {
      broadcastToUser(recipientId, {
        type: 'emergency_alert',
        alertId: alert.id,
        user: {
          id: userId,
          name: user?.displayName || user?.name,
          image: user?.image,
          phone: user?.phone,
        },
        location: {
          lat: latitude,
          lng: longitude,
        },
        batteryLevel,
        message,
        timestamp: alert.createdAt.toISOString(),
        // High priority flag for push notifications
        priority: 'critical',
      });
    }

    // TODO: Send SMS to emergency contacts
    // TODO: Send push notification with critical priority

    return c.json({
      id: alert.id,
      status: alert.status,
      notifiedCount: recipientIds.length,
      createdAt: alert.createdAt.toISOString(),
    }, 201);
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    return c.json({ error: 'Failed to create emergency alert' }, 500);
  }
});

// PUT /api/safety/emergency/:id/resolve - Resolve emergency (mark as safe)
safetyRoutes.put('/emergency/:id/resolve', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const alertId = c.req.param('id');
    const { resolution } = await c.req.json(); // 'resolved', 'false_alarm'

    const alert = await prisma.emergencyAlert.findFirst({
      where: { id: alertId },
    });

    if (!alert) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    // Only the person who created it or someone in their circles can resolve
    let canResolve = alert.userId === userId;

    if (!canResolve) {
      // Check if resolver is in same circle
      const alertUserCircles = await prisma.circleMember.findMany({
        where: { userId: alert.userId },
        select: { circleId: true },
      });
      
      const resolverMembership = await prisma.circleMember.findFirst({
        where: {
          userId,
          circleId: { in: alertUserCircles.map(c => c.circleId) },
        },
      });
      
      canResolve = !!resolverMembership;
    }

    if (!canResolve) {
      return c.json({ error: 'Not authorized to resolve this alert' }, 403);
    }

    await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: {
        status: resolution === 'false_alarm' ? 'false_alarm' : 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });

    // Notify everyone who was notified about the resolution
    const alertUserMemberships = await prisma.circleMember.findMany({
      where: { userId: alert.userId },
      select: { circleId: true },
    });
    
    const allMembers = await prisma.circleMember.findMany({
      where: {
        circleId: { in: alertUserMemberships.map(m => m.circleId) },
        userId: { not: alert.userId },
      },
      select: { userId: true },
    });

    const alertUser = await prisma.user.findUnique({
      where: { id: alert.userId },
      select: { name: true, displayName: true },
    });

    for (const member of allMembers) {
      broadcastToUser(member.userId, {
        type: 'emergency_resolved',
        alertId,
        userName: alertUser?.displayName || alertUser?.name,
        resolution: resolution === 'false_alarm' ? 'false_alarm' : 'resolved',
        timestamp: new Date().toISOString(),
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error resolving emergency:', error);
    return c.json({ error: 'Failed to resolve emergency' }, 500);
  }
});

// GET /api/safety/emergency/active - Get active emergencies from circles
safetyRoutes.get('/emergency/active', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get user's circles
    const memberships = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });
    
    const circleIds = memberships.map(m => m.circleId);

    // Get all members of those circles
    const allMembers = await prisma.circleMember.findMany({
      where: { circleId: { in: circleIds } },
      select: { userId: true },
    });
    
    const memberIds = [...new Set(allMembers.map(m => m.userId))];

    // Get active emergencies
    const emergencies = await prisma.emergencyAlert.findMany({
      where: {
        userId: { in: memberIds },
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({
      emergencies: emergencies.map(e => ({
        id: e.id,
        user: {
          id: e.user.id,
          name: e.user.displayName || e.user.name,
          image: e.user.image,
          phone: e.user.phone,
        },
        location: {
          lat: e.latitude,
          lng: e.longitude,
        },
        batteryLevel: e.batteryLevel,
        message: e.message,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    return c.json({ error: 'Failed to fetch emergencies' }, 500);
  }
});

// ============================================================================
// ARRIVAL ALERTS
// ============================================================================

// POST /api/safety/arrival-alert - Create arrival alert
safetyRoutes.post('/arrival-alert', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const {
      watchedUserId,
      tripId,
      circleId,
      destLat,
      destLng,
      destName,
      radiusMeters,
      expectedBy,
      notifyOnArrival,
      notifyIfLate,
      lateThresholdMin,
      expiresAt,
    } = await c.req.json();

    if (!watchedUserId || !destLat || !destLng) {
      return c.json({ error: 'Watched user and destination required' }, 400);
    }

    // Verify the creator can watch this user (must be in same circle)
    const creatorCircles = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });
    
    const watchedUserInCircle = await prisma.circleMember.findFirst({
      where: {
        userId: watchedUserId,
        circleId: { in: creatorCircles.map(c => c.circleId) },
      },
    });

    if (!watchedUserInCircle) {
      return c.json({ error: 'You can only create alerts for people in your circles' }, 403);
    }

    const alert = await prisma.arrivalAlert.create({
      data: {
        creatorId: userId,
        watchedUserId,
        tripId,
        circleId,
        destLat,
        destLng,
        destName,
        radiusMeters: radiusMeters || 100,
        expectedBy: expectedBy ? new Date(expectedBy) : null,
        notifyOnArrival: notifyOnArrival !== false,
        notifyIfLate: notifyIfLate !== false,
        lateThresholdMin: lateThresholdMin || 15,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return c.json({
      id: alert.id,
      createdAt: alert.createdAt.toISOString(),
    }, 201);
  } catch (error) {
    console.error('Error creating arrival alert:', error);
    return c.json({ error: 'Failed to create arrival alert' }, 500);
  }
});

// DELETE /api/safety/arrival-alert/:id - Cancel arrival alert
safetyRoutes.delete('/arrival-alert/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const alertId = c.req.param('id');

    await prisma.arrivalAlert.deleteMany({
      where: { id: alertId, creatorId: userId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error cancelling arrival alert:', error);
    return c.json({ error: 'Failed to cancel alert' }, 500);
  }
});

// GET /api/safety/arrival-alerts - Get user's active arrival alerts
safetyRoutes.get('/arrival-alerts', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const alerts = await prisma.arrivalAlert.findMany({
      where: {
        creatorId: userId,
        status: 'active',
      },
      include: {
        watchedUser: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    return c.json({
      alerts: alerts.map(a => ({
        id: a.id,
        watchedUser: {
          id: a.watchedUser.id,
          name: a.watchedUser.displayName || a.watchedUser.name,
          image: a.watchedUser.image,
        },
        destination: {
          lat: a.destLat,
          lng: a.destLng,
          name: a.destName,
        },
        expectedBy: a.expectedBy?.toISOString(),
        notifyOnArrival: a.notifyOnArrival,
        notifyIfLate: a.notifyIfLate,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching arrival alerts:', error);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});
