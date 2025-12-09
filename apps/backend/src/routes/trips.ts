import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const tripRoutes = new Hono();

// Helper function to calculate distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/trips - Get user's trips
tripRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const status = c.req.query('status'); // 'active', 'arrived', 'all'

    const where: any = { userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        circle: {
          select: { id: true, name: true, emoji: true },
        },
      },
    });

    return c.json({
      trips: trips.map(t => ({
        id: t.id,
        name: t.name,
        origin: {
          lat: t.originLat,
          lng: t.originLng,
          name: t.originName,
        },
        destination: {
          lat: t.destLat,
          lng: t.destLng,
          name: t.destName,
        },
        status: t.status,
        startedAt: t.startedAt.toISOString(),
        arrivedAt: t.arrivedAt?.toISOString(),
        expectedArrival: t.expectedArrival?.toISOString(),
        currentLocation: t.currentLat && t.currentLng ? {
          lat: t.currentLat,
          lng: t.currentLng,
          updatedAt: t.lastUpdatedAt?.toISOString(),
        } : null,
        batteryLevel: t.batterySharing ? t.batteryLevel : null,
        updateInterval: t.updateInterval,
        circle: t.circle,
      })),
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return c.json({ error: 'Failed to fetch trips' }, 500);
  }
});

// GET /api/trips/active - Get user's active trip
tripRoutes.get('/active', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const trip = await prisma.trip.findFirst({
      where: { userId, status: 'active' },
      include: {
        circle: {
          select: { id: true, name: true, emoji: true },
        },
      },
    });

    if (!trip) {
      return c.json({ trip: null });
    }

    return c.json({
      trip: {
        id: trip.id,
        name: trip.name,
        origin: {
          lat: trip.originLat,
          lng: trip.originLng,
          name: trip.originName,
        },
        destination: {
          lat: trip.destLat,
          lng: trip.destLng,
          name: trip.destName,
        },
        status: trip.status,
        startedAt: trip.startedAt.toISOString(),
        expectedArrival: trip.expectedArrival?.toISOString(),
        currentLocation: trip.currentLat && trip.currentLng ? {
          lat: trip.currentLat,
          lng: trip.currentLng,
          updatedAt: trip.lastUpdatedAt?.toISOString(),
        } : null,
        batteryLevel: trip.batterySharing ? trip.batteryLevel : null,
        batterySharing: trip.batterySharing,
        updateInterval: trip.updateInterval,
        circle: trip.circle,
      },
    });
  } catch (error) {
    console.error('Error fetching active trip:', error);
    return c.json({ error: 'Failed to fetch active trip' }, 500);
  }
});

// POST /api/trips - Start a new trip
tripRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const {
      name,
      originLat,
      originLng,
      originName,
      destLat,
      destLng,
      destName,
      circleId,
      expectedArrival,
      updateInterval,
      batterySharing,
      batteryLevel,
    } = body;

    if (!originLat || !originLng || !destLat || !destLng) {
      return c.json({ error: 'Origin and destination coordinates required' }, 400);
    }

    // Cancel any existing active trips
    await prisma.trip.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled' },
    });

    // Create new trip
    const trip = await prisma.trip.create({
      data: {
        userId,
        name: name || 'Trip',
        originLat,
        originLng,
        originName,
        destLat,
        destLng,
        destName,
        circleId,
        expectedArrival: expectedArrival ? new Date(expectedArrival) : null,
        updateInterval: updateInterval || 60,
        batterySharing: batterySharing || false,
        batteryLevel: batteryLevel || null,
        currentLat: originLat,
        currentLng: originLng,
        lastUpdatedAt: new Date(),
      },
      include: {
        circle: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    // Get user info for notifications
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, displayName: true, image: true },
    });

    // Notify circle members
    if (trip.circle) {
      for (const member of trip.circle.members) {
        if (member.userId !== userId) {
          broadcastToUser(member.userId, {
            type: 'trip_started',
            tripId: trip.id,
            user: {
              id: userId,
              name: user?.displayName || user?.name,
              image: user?.image,
            },
            destination: destName || 'Unknown destination',
            expectedArrival: trip.expectedArrival?.toISOString(),
          });
        }
      }
    }

    return c.json({
      id: trip.id,
      status: trip.status,
      startedAt: trip.startedAt.toISOString(),
    }, 201);
  } catch (error) {
    console.error('Error creating trip:', error);
    return c.json({ error: 'Failed to create trip' }, 500);
  }
});

// PUT /api/trips/:id/location - Update trip location
tripRoutes.put('/:id/location', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const tripId = c.req.param('id');
    const { latitude, longitude, batteryLevel } = await c.req.json();

    // Get trip and verify ownership
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId, status: 'active' },
      include: {
        circle: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
        arrivalAlerts: {
          where: { status: 'active' },
        },
      },
    });

    if (!trip) {
      return c.json({ error: 'Trip not found or not active' }, 404);
    }

    // Check if arrived (within 100m of destination)
    const distanceToDest = calculateDistance(latitude, longitude, trip.destLat, trip.destLng);
    const hasArrived = distanceToDest < 100;

    // Update trip
    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        batteryLevel: trip.batterySharing ? batteryLevel : null,
        lastUpdatedAt: new Date(),
        status: hasArrived ? 'arrived' : 'active',
        arrivedAt: hasArrived ? new Date() : null,
      },
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, displayName: true, image: true },
    });

    // Broadcast location update to circle members
    if (trip.circle) {
      for (const member of trip.circle.members) {
        if (member.userId !== userId) {
          broadcastToUser(member.userId, {
            type: hasArrived ? 'trip_arrived' : 'trip_location_update',
            tripId: trip.id,
            user: {
              id: userId,
              name: user?.displayName || user?.name,
              image: user?.image,
            },
            location: {
              lat: latitude,
              lng: longitude,
              timestamp: new Date().toISOString(),
            },
            batteryLevel: trip.batterySharing ? batteryLevel : null,
            distanceToDestination: Math.round(distanceToDest),
            destination: trip.destName,
          });
        }
      }
    }

    // Check arrival alerts
    if (hasArrived) {
      for (const alert of trip.arrivalAlerts) {
        await prisma.arrivalAlert.update({
          where: { id: alert.id },
          data: {
            status: 'triggered',
            triggeredAt: new Date(),
          },
        });

        // Notify alert creator
        broadcastToUser(alert.creatorId, {
          type: 'arrival_alert_triggered',
          alertId: alert.id,
          user: {
            id: userId,
            name: user?.displayName || user?.name,
            image: user?.image,
          },
          destination: trip.destName,
          arrivedAt: new Date().toISOString(),
        });
      }
    }

    return c.json({
      success: true,
      arrived: hasArrived,
      distanceToDestination: Math.round(distanceToDest),
    });
  } catch (error) {
    console.error('Error updating trip location:', error);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

// PUT /api/trips/:id/pause - Pause trip
tripRoutes.put('/:id/pause', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const tripId = c.req.param('id');

    await prisma.trip.updateMany({
      where: { id: tripId, userId, status: 'active' },
      data: { status: 'paused' },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error pausing trip:', error);
    return c.json({ error: 'Failed to pause trip' }, 500);
  }
});

// PUT /api/trips/:id/resume - Resume trip
tripRoutes.put('/:id/resume', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const tripId = c.req.param('id');

    await prisma.trip.updateMany({
      where: { id: tripId, userId, status: 'paused' },
      data: { status: 'active' },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error resuming trip:', error);
    return c.json({ error: 'Failed to resume trip' }, 500);
  }
});

// DELETE /api/trips/:id - End/cancel trip
tripRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const tripId = c.req.param('id');

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: {
        circle: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!trip) {
      return c.json({ error: 'Trip not found' }, 404);
    }

    await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'cancelled' },
    });

    // Notify circle members
    if (trip.circle) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, displayName: true },
      });

      for (const member of trip.circle.members) {
        if (member.userId !== userId) {
          broadcastToUser(member.userId, {
            type: 'trip_ended',
            tripId: trip.id,
            userName: user?.displayName || user?.name,
          });
        }
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error cancelling trip:', error);
    return c.json({ error: 'Failed to cancel trip' }, 500);
  }
});

// PUT /api/trips/:id/settings - Update trip settings (interval, battery sharing)
tripRoutes.put('/:id/settings', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const tripId = c.req.param('id');
    const { updateInterval, batterySharing } = await c.req.json();

    await prisma.trip.updateMany({
      where: { id: tripId, userId },
      data: {
        updateInterval: updateInterval !== undefined ? updateInterval : undefined,
        batterySharing: batterySharing !== undefined ? batterySharing : undefined,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating trip settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// GET /api/trips/watching - Get trips user is watching (from their circles)
tripRoutes.get('/watching', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get user's circle memberships
    const memberships = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });

    const circleIds = memberships.map(m => m.circleId);

    // Get active trips from those circles (excluding user's own)
    const trips = await prisma.trip.findMany({
      where: {
        circleId: { in: circleIds },
        userId: { not: userId },
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        circle: {
          select: { id: true, name: true, emoji: true },
        },
      },
    });

    return c.json({
      trips: trips.map(t => ({
        id: t.id,
        name: t.name,
        user: {
          id: t.user.id,
          name: t.user.displayName || t.user.name,
          image: t.user.image,
        },
        destination: {
          lat: t.destLat,
          lng: t.destLng,
          name: t.destName,
        },
        currentLocation: t.currentLat && t.currentLng ? {
          lat: t.currentLat,
          lng: t.currentLng,
          updatedAt: t.lastUpdatedAt?.toISOString(),
        } : null,
        expectedArrival: t.expectedArrival?.toISOString(),
        batteryLevel: t.batterySharing ? t.batteryLevel : null,
        circle: t.circle,
      })),
    });
  } catch (error) {
    console.error('Error fetching watched trips:', error);
    return c.json({ error: 'Failed to fetch trips' }, 500);
  }
});
