import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const visibility = new Hono<{ Variables: { userId: string } }>();

// Apply auth to all routes
visibility.use('*', authMiddleware);

// GET /api/visibility - Get current visibility settings
visibility.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        visibilityLevel: true,
        beaconExpiresAt: true,
        beaconDuration: true,
        visibilityUpdatedAt: true,
        locationPrecision: true,
        allowDiscovery: true,
        showToCirclesOnly: true,
        // Legacy fields for backwards compat
        profileVisibility: true,
        showLocation: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if beacon has expired
    let visibilityLevel = user.visibilityLevel || 'circles';
    if (visibilityLevel === 'beacon' && user.beaconExpiresAt) {
      if (new Date() > new Date(user.beaconExpiresAt)) {
        // Beacon expired, revert to discoverable
        await prisma.user.update({
          where: { id: userId },
          data: { 
            visibilityLevel: 'discoverable',
            beaconExpiresAt: null,
          },
        });
        visibilityLevel = 'discoverable';
      }
    }

    return c.json({
      visibilityLevel,
      beaconExpiresAt: user.beaconExpiresAt,
      beaconDuration: user.beaconDuration || 60,
      locationPrecision: user.locationPrecision || 'precise',
      allowDiscovery: user.allowDiscovery ?? true,
      updatedAt: user.visibilityUpdatedAt,
      // Legacy fields
      profileVisibility: user.profileVisibility,
      showLocation: user.showLocation,
    });
  } catch (error) {
    console.error('Failed to get visibility:', error);
    return c.json({ error: 'Failed to get visibility settings' }, 500);
  }
});

// PUT /api/visibility - Update visibility settings
visibility.put('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { level, beaconDuration } = body;

  // Validate level
  const validLevels = ['ghost', 'circles', 'fuzzy', 'social', 'discoverable', 'beacon'];
  if (level && !validLevels.includes(level)) {
    return c.json({ error: 'Invalid visibility level' }, 400);
  }

  try {
    const updateData: Record<string, unknown> = {
      visibilityUpdatedAt: new Date(),
    };

    if (level) {
      updateData.visibilityLevel = level;
      
      // Handle beacon mode with duration
      if (level === 'beacon') {
        const duration = beaconDuration || 60; // Default 1 hour
        if (duration < 15 || duration > 480) {
          return c.json({ error: 'Beacon duration must be 15-480 minutes' }, 400);
        }
        updateData.beaconDuration = duration;
        updateData.beaconExpiresAt = new Date(Date.now() + duration * 60 * 1000);
      } else {
        // Clear beacon expiry if switching away from beacon
        updateData.beaconExpiresAt = null;
      }

      // Map to legacy fields for backwards compatibility
      if (level === 'ghost') {
        updateData.showLocation = false;
        updateData.profileVisibility = 'private';
        updateData.allowDiscovery = false;
      } else if (level === 'circles') {
        updateData.showLocation = true;
        updateData.profileVisibility = 'friends';
        updateData.allowDiscovery = false;
        updateData.showToCirclesOnly = true;
      } else if (level === 'fuzzy') {
        updateData.showLocation = true;
        updateData.profileVisibility = 'friends';
        updateData.locationPrecision = 'approximate';
        updateData.allowDiscovery = true;
      } else if (level === 'social') {
        updateData.showLocation = true;
        updateData.profileVisibility = 'friends';
        updateData.locationPrecision = 'precise';
        updateData.allowDiscovery = true;
      } else {
        // discoverable or beacon
        updateData.showLocation = true;
        updateData.profileVisibility = 'public';
        updateData.locationPrecision = 'precise';
        updateData.allowDiscovery = true;
        updateData.showToCirclesOnly = false;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        visibilityLevel: true,
        beaconExpiresAt: true,
        beaconDuration: true,
        visibilityUpdatedAt: true,
      },
    });

    return c.json(updated);
  } catch (error) {
    console.error('Failed to update visibility:', error);
    return c.json({ error: 'Failed to update visibility' }, 500);
  }
});

// POST /api/visibility/quick-toggle - Fast toggle for map UI
visibility.post('/quick-toggle', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { level } = body;

  const validLevels = ['ghost', 'circles', 'fuzzy', 'social', 'discoverable', 'beacon'];
  if (!validLevels.includes(level)) {
    return c.json({ error: 'Invalid visibility level' }, 400);
  }

  try {
    const updateData: Record<string, unknown> = {
      visibilityLevel: level,
      visibilityUpdatedAt: new Date(),
    };

    // Handle beacon mode
    if (level === 'beacon') {
      updateData.beaconDuration = 60; // Default 1 hour
      updateData.beaconExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else {
      updateData.beaconExpiresAt = null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return c.json({ success: true, level });
  } catch (error) {
    console.error('Failed to quick toggle visibility:', error);
    return c.json({ error: 'Failed to update' }, 500);
  }
});

// GET /api/visibility/visible-users - Get users visible to current user based on visibility rules
visibility.get('/visible-users', async (c) => {
  const userId = c.get('userId');
  const lat = parseFloat(c.req.query('lat') || '0');
  const lng = parseFloat(c.req.query('lng') || '0');
  const radiusKm = parseFloat(c.req.query('radiusKm') || '50');

  if (!lat || !lng) {
    return c.json({ error: 'lat and lng required' }, 400);
  }

  try {
    // Get user's circles
    const userCircles = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });
    const circleIds = userCircles.map(c => c.circleId);

    // Get circle members
    const circleMembers = await prisma.circleMember.findMany({
      where: { 
        circleId: { in: circleIds },
        userId: { not: userId },
      },
      select: { userId: true },
    });
    const circleMemberIds = new Set(circleMembers.map(m => m.userId));

    // Get user's connections (accepted)
    const connections = await prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    });
    const connectedIds = new Set(
      connections.map(c => c.requesterId === userId ? c.addresseeId : c.requesterId)
    );

    // Get all potentially visible users
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        visibilityLevel: { not: 'ghost' }, // Ghost users are never visible
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        visibilityLevel: true,
        locationPrecision: true,
        bio: true,
        interests: true,
      },
    });

    // Get user pins for location
    const userPins = await prisma.pin.findMany({
      where: {
        userId: { in: users.map(u => u.id) },
        type: 'live',
      },
      select: {
        userId: true,
        latitude: true,
        longitude: true,
      },
    });

    const pinsByUser = new Map<string, { lat: number; lng: number }>();
    for (const pin of userPins) {
      pinsByUser.set(pin.userId, { lat: pin.latitude, lng: pin.longitude });
    }

    // Filter users based on visibility rules
    const visibleUsers = [];
    
    for (const user of users) {
      const isCircleMember = circleMemberIds.has(user.id);
      const isConnected = connectedIds.has(user.id);
      const pin = pinsByUser.get(user.id);
      
      if (!pin) continue; // No location data

      // Calculate distance
      const dist = haversineDistance(lat, lng, pin.lat, pin.lng);
      if (dist > radiusKm) continue; // Too far

      let visible = false;
      let precision: 'precise' | 'approximate' = 'precise';
      let displayLat = pin.lat;
      let displayLng = pin.lng;

      switch (user.visibilityLevel) {
        case 'circles':
          // Only visible to circle members
          visible = isCircleMember;
          break;
        case 'fuzzy':
          // Visible to all, but location is blurred for non-circle members
          visible = true;
          if (!isCircleMember) {
            precision = 'approximate';
            // Blur location by 0.5-1.5km in random direction
            const blur = 0.005 + Math.random() * 0.01;
            const angle = Math.random() * 2 * Math.PI;
            displayLat += blur * Math.cos(angle);
            displayLng += blur * Math.sin(angle);
          }
          break;
        case 'social':
          // Visible to connections and their connections
          visible = isCircleMember || isConnected;
          break;
        case 'discoverable':
        case 'beacon':
          // Visible to everyone
          visible = true;
          break;
      }

      if (visible) {
        visibleUsers.push({
          id: user.id,
          name: user.displayName || user.name,
          image: user.image,
          bio: user.bio,
          interests: user.interests,
          visibilityLevel: user.visibilityLevel,
          latitude: displayLat,
          longitude: displayLng,
          precision,
          distance: Math.round(dist * 10) / 10,
          isCircleMember,
          isConnected,
        });
      }
    }

    return c.json({
      users: visibleUsers,
      total: visibleUsers.length,
    });
  } catch (error) {
    console.error('Failed to get visible users:', error);
    return c.json({ error: 'Failed to get visible users' }, 500);
  }
});

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default visibility;
