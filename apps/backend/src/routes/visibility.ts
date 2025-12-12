import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const visibility = new Hono();

// Visibility levels enum
export type VisibilityLevel = 'ghost' | 'circles' | 'fuzzy' | 'social' | 'discoverable' | 'beacon';

// Get current visibility settings
visibility.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        visibilityLevel: true,
        visibilityUpdatedAt: true,
        beaconExpiresAt: true,
        beaconDuration: true,
        locationPrecision: true,
        showToCirclesOnly: true,
        allowDiscovery: true,
        showOnlineStatus: true,
      }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if beacon has expired
    let currentLevel = user.visibilityLevel || 'circles';
    if (currentLevel === 'beacon' && user.beaconExpiresAt) {
      if (new Date() > user.beaconExpiresAt) {
        // Beacon expired, revert to discoverable
        await prisma.user.update({
          where: { id: userId },
          data: { 
            visibilityLevel: 'discoverable',
            beaconExpiresAt: null 
          }
        });
        currentLevel = 'discoverable';
      }
    }

    return c.json({
      visibilityLevel: currentLevel,
      beaconExpiresAt: user.beaconExpiresAt,
      beaconDuration: user.beaconDuration || 60,
      updatedAt: user.visibilityUpdatedAt,
      // Legacy compatibility
      locationPrecision: user.locationPrecision,
      showToCirclesOnly: user.showToCirclesOnly,
      allowDiscovery: user.allowDiscovery,
      showOnlineStatus: user.showOnlineStatus,
    });
  } catch (error) {
    console.error('Failed to get visibility settings:', error);
    return c.json({ error: 'Failed to get settings' }, 500);
  }
});

// Update visibility level
visibility.put('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { visibilityLevel, beaconDuration } = body as {
    visibilityLevel: VisibilityLevel;
    beaconDuration?: number;
  };

  // Validate level
  const validLevels: VisibilityLevel[] = ['ghost', 'circles', 'fuzzy', 'social', 'discoverable', 'beacon'];
  if (!validLevels.includes(visibilityLevel)) {
    return c.json({ error: 'Invalid visibility level' }, 400);
  }

  try {
    const updateData: any = {
      visibilityLevel,
      visibilityUpdatedAt: new Date(),
    };

    // Handle beacon mode
    if (visibilityLevel === 'beacon') {
      const duration = beaconDuration || 60; // default 60 minutes
      if (duration < 15 || duration > 480) {
        return c.json({ error: 'Beacon duration must be between 15 and 480 minutes' }, 400);
      }
      updateData.beaconExpiresAt = new Date(Date.now() + duration * 60 * 1000);
      updateData.beaconDuration = duration;
    } else {
      updateData.beaconExpiresAt = null;
    }

    // Map to legacy fields for backwards compatibility
    switch (visibilityLevel) {
      case 'ghost':
        updateData.showLocation = false;
        updateData.profileVisibility = 'private';
        updateData.allowDiscovery = false;
        updateData.showOnlineStatus = false;
        break;
      case 'circles':
        updateData.showLocation = true;
        updateData.profileVisibility = 'friends';
        updateData.allowDiscovery = false;
        updateData.showOnlineStatus = true;
        break;
      case 'fuzzy':
        updateData.showLocation = true;
        updateData.profileVisibility = 'friends';
        updateData.locationPrecision = 'approximate';
        updateData.allowDiscovery = true;
        updateData.showOnlineStatus = true;
        break;
      case 'social':
        updateData.showLocation = true;
        updateData.profileVisibility = 'public';
        updateData.locationPrecision = 'precise';
        updateData.allowDiscovery = true;
        updateData.showOnlineStatus = true;
        break;
      case 'discoverable':
      case 'beacon':
        updateData.showLocation = true;
        updateData.profileVisibility = 'public';
        updateData.locationPrecision = 'precise';
        updateData.allowDiscovery = true;
        updateData.showOnlineStatus = true;
        break;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        visibilityLevel: true,
        beaconExpiresAt: true,
        visibilityUpdatedAt: true,
      }
    });

    // If beacon mode, notify nearby users (optional enhancement)
    if (visibilityLevel === 'beacon') {
      // TODO: Trigger push notifications to nearby users
      console.log(`User ${userId} activated beacon mode for ${beaconDuration} minutes`);
    }

    return c.json({
      success: true,
      visibilityLevel: user.visibilityLevel,
      beaconExpiresAt: user.beaconExpiresAt,
      updatedAt: user.visibilityUpdatedAt,
    });
  } catch (error) {
    console.error('Failed to update visibility:', error);
    return c.json({ error: 'Failed to update visibility' }, 500);
  }
});

// Quick toggle endpoint for map UI
visibility.post('/quick-toggle', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { level } = body;

  const validLevels: VisibilityLevel[] = ['ghost', 'circles', 'fuzzy', 'social', 'discoverable', 'beacon'];
  if (!validLevels.includes(level)) {
    return c.json({ error: 'Invalid level' }, 400);
  }

  try {
    const updateData: any = {
      visibilityLevel: level,
      visibilityUpdatedAt: new Date(),
    };

    // If toggling to beacon, set default 60 min expiry
    if (level === 'beacon') {
      updateData.beaconExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      updateData.beaconDuration = 60;
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
    return c.json({ error: 'Failed to toggle' }, 500);
  }
});

// Get users visible to the current user based on visibility rules
visibility.get('/visible-users', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { lat, lng, radiusKm } = c.req.query();

  if (!lat || !lng) {
    return c.json({ error: 'lat and lng required' }, 400);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radius = parseFloat(radiusKm || '50');

  try {
    // Get current user's circles
    const userCircles = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true }
    });
    const circleIds = userCircles.map(c => c.circleId);

    // Get circle members
    const circleMembers = await prisma.circleMember.findMany({
      where: { 
        circleId: { in: circleIds },
        userId: { not: userId }
      },
      select: { userId: true }
    });
    const circleMemberIds = circleMembers.map(m => m.userId);

    // Get user's connections/friends
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { connectedUserId: userId, status: 'accepted' }
        ]
      },
      select: { userId: true, connectedUserId: true }
    });
    const friendIds = connections.map(c => 
      c.userId === userId ? c.connectedUserId : c.userId
    );

    // Query visible users based on their visibility settings
    const visibleUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          // Ghost users - never visible
          // Circles only - visible if in same circle
          {
            visibilityLevel: 'circles',
            id: { in: circleMemberIds }
          },
          // Fuzzy - visible to everyone (but with approximate location)
          { visibilityLevel: 'fuzzy' },
          // Social - visible to friends and friends-of-friends
          {
            visibilityLevel: 'social',
            id: { in: [...friendIds, ...circleMemberIds] }
          },
          // Discoverable - visible to everyone
          { visibilityLevel: 'discoverable' },
          // Beacon - visible to everyone with highlight
          { 
            visibilityLevel: 'beacon',
            beaconExpiresAt: { gt: new Date() }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        image: true,
        visibilityLevel: true,
        beaconExpiresAt: true,
        profile: {
          select: {
            currentLocationLat: true,
            currentLocationLng: true,
            displayName: true,
            avatar: true,
            bio: true,
          }
        }
      }
    });

    // Process results - blur location for fuzzy users
    const processedUsers = visibleUsers
      .filter(u => u.profile?.currentLocationLat && u.profile?.currentLocationLng)
      .map(user => {
        let userLat = user.profile!.currentLocationLat!;
        let userLng = user.profile!.currentLocationLng!;

        // For fuzzy visibility, add random offset (0.5-1.5km)
        if (user.visibilityLevel === 'fuzzy' && !circleMemberIds.includes(user.id)) {
          const offset = 0.01 + Math.random() * 0.01; // roughly 1-2km
          userLat += (Math.random() - 0.5) * offset;
          userLng += (Math.random() - 0.5) * offset;
        }

        // Calculate distance
        const distance = calculateDistance(latitude, longitude, userLat, userLng);
        
        if (distance > radius) return null;

        return {
          id: user.id,
          name: user.profile?.displayName || user.name,
          avatar: user.profile?.avatar || user.image,
          bio: user.profile?.bio,
          lat: userLat,
          lng: userLng,
          distance: Math.round(distance * 10) / 10,
          visibilityLevel: user.visibilityLevel,
          isBeacon: user.visibilityLevel === 'beacon' && user.beaconExpiresAt && new Date() < user.beaconExpiresAt,
          beaconExpiresAt: user.beaconExpiresAt,
          isCircleMember: circleMemberIds.includes(user.id),
          isFriend: friendIds.includes(user.id),
          locationPrecision: user.visibilityLevel === 'fuzzy' && !circleMemberIds.includes(user.id) 
            ? 'approximate' 
            : 'precise'
        };
      })
      .filter(Boolean);

    return c.json({
      users: processedUsers,
      count: processedUsers.length,
    });
  } catch (error) {
    console.error('Failed to get visible users:', error);
    return c.json({ error: 'Failed to get visible users' }, 500);
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default visibility;
