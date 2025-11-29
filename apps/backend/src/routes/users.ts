import { Hono } from 'hono';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

export const userRoutes = new Hono();

// GET /api/users/me - Get current user's profile
userRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as string;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Parse interests
    let interests: string[] = [];
    if (user.profile?.interests) {
      try {
        interests = JSON.parse(user.profile.interests);
      } catch {}
    }

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      displayName: user.profile?.displayName || user.name || 'Anonymous',
      username: user.profile?.handle || user.id.slice(0, 8),
      avatar: user.profile?.avatar || user.image,
      bio: user.profile?.bio,
      interests,
      activityIntent: user.profile?.activityIntent,
      chatReadiness: user.profile?.chatReadiness || 'browsing_only',
      visibilityMode: user.profile?.visibilityMode || 'public',
      ghostMode: user.profile?.ghostMode || false,
      trustScore: user.profile?.trustScore || 50,
      trustLevel: user.profile?.trustLevel || 'new',
      subscriptionStatus: user.profile?.subscriptionStatus || 'trial',
      createdAt: user.createdAt.toISOString(),
      lastActive: user.profile?.lastActiveAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return c.json({ error: 'Failed to fetch user profile' }, 500);
  }
});

// PATCH /api/users/me - Update current user's profile
userRoutes.patch('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as string;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const {
      displayName,
      bio,
      avatar,
      interests,
      activityIntent,
      chatReadiness,
      visibilityMode,
      ghostMode,
    } = body;

    // Ensure user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Prepare profile update data
    const profileData: any = {};

    if (displayName !== undefined) profileData.displayName = displayName;
    if (bio !== undefined) profileData.bio = bio;
    if (avatar !== undefined) profileData.avatar = avatar;
    if (interests !== undefined) {
      // Convert array to JSON string for storage
      profileData.interests = JSON.stringify(interests);
    }
    if (activityIntent !== undefined) profileData.activityIntent = activityIntent;
    if (chatReadiness !== undefined) profileData.chatReadiness = chatReadiness;
    if (visibilityMode !== undefined) profileData.visibilityMode = visibilityMode;
    if (ghostMode !== undefined) profileData.ghostMode = ghostMode;

    // Update or create profile
    if (user.profile) {
      // Update existing profile
      await prisma.profile.update({
        where: { userId },
        data: profileData,
      });
    } else {
      // Create new profile
      await prisma.profile.create({
        data: {
          userId,
          ...profileData,
        },
      });
    }

    // Fetch updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Parse interests for response
    let parsedInterests: string[] = [];
    if (updatedUser?.profile?.interests) {
      try {
        parsedInterests = JSON.parse(updatedUser.profile.interests);
      } catch {}
    }

    return c.json({
      id: updatedUser!.id,
      email: updatedUser!.email,
      name: updatedUser!.name,
      image: updatedUser!.image,
      displayName: updatedUser!.profile?.displayName || updatedUser!.name || 'Anonymous',
      username: updatedUser!.profile?.handle || updatedUser!.id.slice(0, 8),
      avatar: updatedUser!.profile?.avatar || updatedUser!.image,
      bio: updatedUser!.profile?.bio,
      interests: parsedInterests,
      activityIntent: updatedUser!.profile?.activityIntent,
      chatReadiness: updatedUser!.profile?.chatReadiness || 'browsing_only',
      visibilityMode: updatedUser!.profile?.visibilityMode || 'public',
      ghostMode: updatedUser!.profile?.ghostMode || false,
      trustScore: updatedUser!.profile?.trustScore || 50,
      trustLevel: updatedUser!.profile?.trustLevel || 'new',
      subscriptionStatus: updatedUser!.profile?.subscriptionStatus || 'trial',
      createdAt: updatedUser!.createdAt.toISOString(),
      lastActive: updatedUser!.profile?.lastActiveAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// GET /api/users/search - Search users
userRoutes.get('/search', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const q = c.req.query('q') || '';
    const filter = c.req.query('filter') || 'all';
    const lat = c.req.query('lat') ? parseFloat(c.req.query('lat')!) : null;
    const lng = c.req.query('lng') ? parseFloat(c.req.query('lng')!) : null;
    const limit = parseInt(c.req.query('limit') || '20');

    if (!q || q.length < 1) {
      return c.json({ users: [] });
    }

    // Build where clause
    const where: any = {
      AND: [
        // Exclude self
        userId ? { id: { not: userId } } : {},
        // Search in name, displayName, or handle
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { profile: { displayName: { contains: q, mode: 'insensitive' } } },
            { profile: { handle: { contains: q, mode: 'insensitive' } } },
          ],
        },
        // Visibility filter
        { profile: { visibilityMode: { not: 'hidden' } } },
      ],
    };

    // Online filter - last active within 5 minutes
    if (filter === 'online') {
      where.AND.push({
        profile: {
          lastActiveAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });
    }

    // Get current user's interests for matching
    let currentUserInterests: string[] = [];
    if (userId) {
      const currentUser = await prisma.profile.findUnique({
        where: { userId },
        select: { interests: true },
      });
      if (currentUser?.interests) {
        try {
          currentUserInterests = JSON.parse(currentUser.interests);
        } catch {}
      }
    }

    // Get blocked user IDs
    let blockedIds: string[] = [];
    if (userId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedUserId: userId }],
        },
        select: { blockerId: true, blockedUserId: true },
      });
      blockedIds = blocks.map((b) =>
        b.blockerId === userId ? b.blockedUserId : b.blockerId
      );
    }

    // Query users
    const users = await prisma.user.findMany({
      where,
      take: limit,
      include: {
        profile: true,
      },
      orderBy: [
        { profile: { lastActiveAt: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    // Process results
    let results = users
      .filter((u) => !blockedIds.includes(u.id))
      .map((user) => {
        // Parse interests
        let userInterests: string[] = [];
        if (user.profile?.interests) {
          try {
            userInterests = JSON.parse(user.profile.interests);
          } catch {}
        }

        // Find shared interests
        const sharedInterests = currentUserInterests.filter((i) =>
          userInterests.includes(i)
        );

        // Calculate distance if coordinates provided
        let distance: number | undefined;
        if (lat && lng && user.profile?.currentLocationLat && user.profile?.currentLocationLng) {
          distance = calculateDistance(
            lat,
            lng,
            user.profile.currentLocationLat,
            user.profile.currentLocationLng
          );
        }

        return {
          id: user.id,
          displayName: user.profile?.displayName || user.name || 'Anonymous',
          username: user.profile?.handle || user.id.slice(0, 8),
          avatar: user.profile?.avatar || user.image,
          bio: user.profile?.bio,
          activityIntent: user.profile?.activityIntent,
          chatReadiness: user.profile?.chatReadiness || 'browsing_only',
          trustScore: user.profile?.trustScore || 50,
          interests: userInterests.slice(0, 5),
          sharedInterests,
          distance,
          isVerified: (user.profile?.trustLevel === 'verified' || user.profile?.trustLevel === 'vip'),
          lastActive: user.profile?.lastActiveAt?.toISOString(),
        };
      });

    // Sort by distance if nearby filter
    if (filter === 'nearby' && lat && lng) {
      results = results
        .filter((u) => u.distance !== undefined)
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return c.json({ users: results });
  } catch (error) {
    console.error('Error searching users:', error);
    return c.json({ error: 'Failed to search users' }, 500);
  }
});

// GET /api/users/nearby - Get nearby users
userRoutes.get('/nearby', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const lat = parseFloat(c.req.query('lat') || '0');
    const lng = parseFloat(c.req.query('lng') || '0');
    const radius = parseInt(c.req.query('radius') || '5000'); // meters
    const limit = parseInt(c.req.query('limit') || '50');

    if (!lat || !lng) {
      return c.json({ error: 'Latitude and longitude required' }, 400);
    }

    // Get users who have shared location recently (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const where: any = {
      AND: [
        userId ? { id: { not: userId } } : {},
        { profile: { ghostMode: false } },
        { profile: { visibilityMode: { not: 'hidden' } } },
        { profile: { currentLocationLat: { not: null } } },
        { profile: { currentLocationLng: { not: null } } },
        // Recent location update
        { profile: { lastActiveAt: { gte: oneHourAgo } } },
      ],
    };

    // Get blocked user IDs
    let blockedIds: string[] = [];
    if (userId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedUserId: userId }],
        },
        select: { blockerId: true, blockedUserId: true },
      });
      blockedIds = blocks.map((b) =>
        b.blockerId === userId ? b.blockedUserId : b.blockerId
      );
    }

    // Get current user's interests
    let currentUserInterests: string[] = [];
    if (userId) {
      const currentUser = await prisma.profile.findUnique({
        where: { userId },
        select: { interests: true },
      });
      if (currentUser?.interests) {
        try {
          currentUserInterests = JSON.parse(currentUser.interests);
        } catch {}
      }
    }

    const users = await prisma.user.findMany({
      where,
      take: limit * 2, // Get extra to account for distance filtering
      include: { profile: true },
    });

    // Filter by distance and format
    const nearbyUsers = users
      .filter((u) => !blockedIds.includes(u.id))
      .filter((user) => {
        if (!user.profile?.currentLocationLat || !user.profile?.currentLocationLng) return false;
        const distance = calculateDistance(
          lat,
          lng,
          user.profile.currentLocationLat,
          user.profile.currentLocationLng
        );
        return distance <= radius;
      })
      .map((user) => {
        const distance = calculateDistance(
          lat,
          lng,
          user.profile!.currentLocationLat!,
          user.profile!.currentLocationLng!
        );

        // Parse interests
        let userInterests: string[] = [];
        if (user.profile?.interests) {
          try {
            userInterests = JSON.parse(user.profile.interests);
          } catch {}
        }

        const sharedInterests = currentUserInterests.filter((i) =>
          userInterests.includes(i)
        );

        return {
          id: user.id,
          displayName: user.profile?.displayName || user.name || 'Anonymous',
          username: user.profile?.handle || user.id.slice(0, 8),
          avatar: user.profile?.avatar || user.image,
          bio: user.profile?.bio,
          activityIntent: user.profile?.activityIntent,
          chatReadiness: user.profile?.chatReadiness || 'browsing_only',
          trustScore: user.profile?.trustScore || 50,
          distance: Math.round(distance),
          interests: userInterests.slice(0, 5),
          sharedInterests,
          lastActive: user.profile?.lastActiveAt?.toISOString(),
          isVerified: (user.profile?.trustLevel === 'verified' || user.profile?.trustLevel === 'vip'),
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return c.json({ users: nearbyUsers });
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    return c.json({ error: 'Failed to fetch nearby users' }, 500);
  }
});

// GET /api/users/:id - Get user profile
userRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const targetId = c.req.param('id');

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: { profile: true },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if blocked
    if (userId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedUserId: targetId },
            { blockerId: targetId, blockedUserId: userId },
          ],
        },
      });

      if (block) {
        return c.json({ error: 'Unable to view this profile' }, 403);
      }
    }

    // Parse interests
    let interests: string[] = [];
    if (user.profile?.interests) {
      try {
        interests = JSON.parse(user.profile.interests);
      } catch {}
    }

    // Check if current user follows/has waved at this user
    let hasWaved = false;
    let hasReceivedWave = false;
    if (userId) {
      const sentWave = await prisma.wave.findUnique({
        where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetId } },
      });
      hasWaved = !!sentWave;

      const receivedWave = await prisma.wave.findUnique({
        where: { fromUserId_toUserId: { fromUserId: targetId, toUserId: userId } },
      });
      hasReceivedWave = !!receivedWave;
    }

    return c.json({
      user: {
        id: user.id,
        displayName: user.profile?.displayName || user.name || 'Anonymous',
        username: user.profile?.handle || user.id.slice(0, 8),
        avatar: user.profile?.avatar || user.image,
        bio: user.profile?.bio,
        age: user.profile?.age,
        activityIntent: user.profile?.activityIntent,
        chatReadiness: user.profile?.chatReadiness || 'browsing_only',
        trustScore: user.profile?.trustScore || 50,
        trustLevel: user.profile?.trustLevel || 'new',
        interests,
        lookingFor: user.profile?.lookingFor,
        isVerified: (user.profile?.trustLevel === 'verified' || user.profile?.trustLevel === 'vip'),
        hasWaved,
        hasReceivedWave,
        isMutualWave: hasWaved && hasReceivedWave,
        memberSince: user.createdAt.toISOString(),
        lastActive: user.profile?.lastActiveAt?.toISOString(),
        // Stats
        pinsCreated: user.profile?.pinsCreated || 0,
        eventsAttended: user.profile?.eventsAttended || 0,
        minglesAttended: user.profile?.minglesAttended || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// POST /api/users/:id/block - Block user
userRoutes.post('/:id/block', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetId = c.req.param('id');

    if (userId === targetId) {
      return c.json({ error: 'Cannot block yourself' }, 400);
    }

    // Check if already blocked
    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedUserId: { blockerId: userId, blockedUserId: targetId } },
    });

    if (existing) {
      return c.json({ error: 'User already blocked' }, 400);
    }

    await prisma.block.create({
      data: {
        blockerId: userId,
        blockedUserId: targetId,
      },
    });

    // Remove any waves between users
    await prisma.wave.deleteMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetId },
          { fromUserId: targetId, toUserId: userId },
        ],
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error blocking user:', error);
    return c.json({ error: 'Failed to block user' }, 500);
  }
});

// DELETE /api/users/:id/block - Unblock user
userRoutes.delete('/:id/block', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetId = c.req.param('id');

    await prisma.block.delete({
      where: { blockerId_blockedUserId: { blockerId: userId, blockedUserId: targetId } },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return c.json({ error: 'Failed to unblock user' }, 500);
  }
});

// PUT /api/users/location - Update current location
userRoutes.put('/location', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { latitude, longitude } = await c.req.json();

    await prisma.profile.update({
      where: { userId },
      data: {
        currentLocationLat: latitude,
        currentLocationLng: longitude,
        lastActiveAt: new Date(),
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

// POST /api/users/:id/wave - Wave at user (convenience endpoint)
userRoutes.post('/:id/wave', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetId = c.req.param('id');

    if (userId === targetId) {
      return c.json({ error: 'Cannot wave at yourself' }, 400);
    }

    // Check if already waved recently
    const existing = await prisma.wave.findUnique({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetId } },
    });

    if (existing) {
      const hoursSince = (Date.now() - existing.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return c.json({ error: 'Already waved recently', waved: true });
      }

      // Update existing wave
      await prisma.wave.update({
        where: { id: existing.id },
        data: { createdAt: new Date(), status: 'sent', seenAt: null },
      });
    } else {
      await prisma.wave.create({
        data: { fromUserId: userId, toUserId: targetId },
      });
    }

    return c.json({ success: true, waved: true });
  } catch (error) {
    console.error('Error waving:', error);
    return c.json({ error: 'Failed to wave' }, 500);
  }
});

// ============================================================================
// HELPERS
// ============================================================================

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
