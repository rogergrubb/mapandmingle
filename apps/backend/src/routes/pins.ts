import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { broadcastToAll } from '../lib/websocket';
import { z } from 'zod';

export const pinRoutes = new Hono();

// Validation schemas
const createPinSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().min(1).max(500),
  image: z.string().optional(),
});

const getPinsSchema = z.object({
  north: z.coerce.number(),
  south: z.coerce.number(),
  east: z.coerce.number(),
  west: z.coerce.number(),
  filter: z.enum(['all', '24h', 'week']).optional(),
});

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Check if viewer can see a pin based on selective visibility
async function canViewPin(pin: any, viewerId: string | null): Promise<boolean> {
  // If no viewer (anonymous), they can see public pins only
  if (!viewerId) return true;
  
  // Get pin creator's profile
  const creatorProfile = await prisma.profile.findUnique({
    where: { userId: pin.userId },
  });
  
  if (!creatorProfile) return true;
  
  // Check ghost mode
  if (creatorProfile.ghostMode) return false;
  
  // Check selective visibility
  if (!creatorProfile.selectiveVisibilityEnabled) return true;
  
  // Get viewer's profile
  const viewerProfile = await prisma.profile.findUnique({
    where: { userId: viewerId },
  });
  
  if (!viewerProfile) return false;
  
  // Check if blocked
  if (creatorProfile.visibilityHideFromBlocked) {
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: pin.userId, blockedUserId: viewerId },
          { blockerId: viewerId, blockedUserId: pin.userId },
        ],
      },
    });
    if (isBlocked) return false;
  }
  
  // Check age range
  if (creatorProfile.visibilityMinAge && viewerProfile.age) {
    if (viewerProfile.age < creatorProfile.visibilityMinAge) return false;
  }
  if (creatorProfile.visibilityMaxAge && viewerProfile.age) {
    if (viewerProfile.age > creatorProfile.visibilityMaxAge) return false;
  }
  
  // Check shared interests
  if (creatorProfile.visibilityRequireInterests && creatorProfile.visibilityMinSharedInterests) {
    const creatorInterests = JSON.parse(creatorProfile.interests || '[]');
    const viewerInterests = JSON.parse(viewerProfile.interests || '[]');
    const sharedCount = creatorInterests.filter((i: string) => viewerInterests.includes(i)).length;
    if (sharedCount < creatorProfile.visibilityMinSharedInterests) return false;
  }
  
  // Check distance
  if (creatorProfile.visibilityMaxDistance && viewerProfile.currentLocationLat && viewerProfile.currentLocationLng) {
    const distance = calculateDistance(
      pin.latitude, pin.longitude,
      viewerProfile.currentLocationLat, viewerProfile.currentLocationLng
    );
    if (distance > creatorProfile.visibilityMaxDistance) return false;
  }
  
  // Check reputation
  if (creatorProfile.visibilityMinReputation && viewerProfile.trustScore < creatorProfile.visibilityMinReputation) {
    return false;
  }
  
  // Check premium only
  if (creatorProfile.visibilityPremiumOnly) {
    if (viewerProfile.subscriptionStatus !== 'active' && viewerProfile.subscriptionStatus !== 'trial') {
      return false;
    }
  }
  
  return true;
}

// GET /api/pins - Get pins in a bounding box
pinRoutes.get('/', async (c) => {
  try {
    const query = c.req.query();
    const parsed = getPinsSchema.safeParse(query);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid parameters', details: parsed.error.errors }, 400);
    }
    
    const { north, south, east, west, filter } = parsed.data;
    
    // Build date filter
    let dateFilter = {};
    if (filter === '24h') {
      dateFilter = { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
    } else if (filter === 'week') {
      dateFilter = { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    }
    
    const pins = await prisma.pin.findMany({
      where: {
        latitude: { gte: south, lte: north },
        longitude: { gte: west, lte: east },
        ...dateFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: { avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    // Get viewer ID from auth header (if present)
    const authHeader = c.req.header('Authorization');
    let viewerId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      // In a real app, verify the token and get user ID
      // For now, we'll pass user ID directly in header for simplicity
      viewerId = c.req.header('X-User-Id') || null;
    }
    
    // Filter based on visibility rules
    const visiblePins = [];
    for (const pin of pins) {
      if (await canViewPin(pin, viewerId)) {
        visiblePins.push({
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          description: pin.description,
          image: pin.image,
          likesCount: pin.likesCount,
          createdAt: pin.createdAt.toISOString(),
          updatedAt: pin.updatedAt.toISOString(),
          createdBy: {
            id: pin.user.id,
            name: pin.user.name,
            image: pin.user.image,
            avatar: pin.user.profile?.avatar,
          },
        });
      }
    }
    
    return c.json(visiblePins);
  } catch (error) {
    console.error('Error fetching pins:', error);
    return c.json({ error: 'Failed to fetch pins' }, 500);
  }
});

// GET /api/pins/:id - Get single pin
pinRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const pin = await prisma.pin.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: { avatar: true, bio: true },
            },
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });
    
    if (!pin) {
      return c.json({ error: 'Pin not found' }, 404);
    }
    
    return c.json({
      id: pin.id,
      latitude: pin.latitude,
      longitude: pin.longitude,
      description: pin.description,
      image: pin.image,
      likesCount: pin.likesCount,
      likedByUser: false, // Would check against authenticated user
      createdAt: pin.createdAt.toISOString(),
      createdBy: {
        id: pin.user.id,
        name: pin.user.name,
        image: pin.user.image,
        avatar: pin.user.profile?.avatar,
        bio: pin.user.profile?.bio,
      },
    });
  } catch (error) {
    console.error('Error fetching pin:', error);
    return c.json({ error: 'Failed to fetch pin' }, 500);
  }
});

// POST /api/pins - Create a new pin
pinRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const parsed = createPinSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid data', details: parsed.error.errors }, 400);
    }
    
    const { latitude, longitude, description, image } = parsed.data;
    
    const pin = await prisma.pin.create({
      data: {
        userId,
        latitude,
        longitude,
        description,
        image,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: { avatar: true },
            },
          },
        },
      },
    });
    
    // Update user's pin count
    await prisma.profile.update({
      where: { userId },
      data: { pinsCreated: { increment: 1 } },
    });
    
    // Broadcast new pin to all connected users
    broadcastToAll({
      type: 'new_pin',
      pin: {
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        description: pin.description,
        image: pin.image,
        likesCount: 0,
        createdAt: pin.createdAt.toISOString(),
        createdBy: {
          id: pin.user.id,
          name: pin.user.name,
          image: pin.user.image,
          avatar: pin.user.profile?.avatar,
        },
      },
    });
    
    return c.json({
      id: pin.id,
      latitude: pin.latitude,
      longitude: pin.longitude,
      description: pin.description,
      image: pin.image,
      likesCount: 0,
      createdAt: pin.createdAt.toISOString(),
      createdBy: {
        id: pin.user.id,
        name: pin.user.name,
        image: pin.user.image,
        avatar: pin.user.profile?.avatar,
      },
    }, 201);
  } catch (error) {
    console.error('Error creating pin:', error);
    return c.json({ error: 'Failed to create pin' }, 500);
  }
});

// POST /api/pins/:id/like - Like/unlike a pin
pinRoutes.post('/:id/like', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const pinId = c.req.param('id');
    
    // Check if pin exists
    const pin = await prisma.pin.findUnique({ where: { id: pinId } });
    if (!pin) {
      return c.json({ error: 'Pin not found' }, 404);
    }
    
    // Check if already liked
    const existingLike = await prisma.pinLike.findUnique({
      where: { pinId_userId: { pinId, userId } },
    });
    
    if (existingLike) {
      // Unlike
      await prisma.pinLike.delete({
        where: { id: existingLike.id },
      });
      await prisma.pin.update({
        where: { id: pinId },
        data: { likesCount: { decrement: 1 } },
      });
      
      return c.json({ liked: false, likesCount: pin.likesCount - 1 });
    } else {
      // Like
      await prisma.pinLike.create({
        data: { pinId, userId },
      });
      await prisma.pin.update({
        where: { id: pinId },
        data: { likesCount: { increment: 1 } },
      });
      
      // Update pin creator's likes received count
      await prisma.profile.update({
        where: { userId: pin.userId },
        data: { 
          likesReceived: { increment: 1 },
          positiveInteractions: { increment: 1 },
        },
      });
      
      return c.json({ liked: true, likesCount: pin.likesCount + 1 });
    }
  } catch (error) {
    console.error('Error liking pin:', error);
    return c.json({ error: 'Failed to like pin' }, 500);
  }
});

// DELETE /api/pins/:id - Delete a pin
pinRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const pinId = c.req.param('id');
    
    // Check ownership
    const pin = await prisma.pin.findUnique({ where: { id: pinId } });
    if (!pin) {
      return c.json({ error: 'Pin not found' }, 404);
    }
    if (pin.userId !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    await prisma.pin.delete({ where: { id: pinId } });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting pin:', error);
    return c.json({ error: 'Failed to delete pin' }, 500);
  }
});
