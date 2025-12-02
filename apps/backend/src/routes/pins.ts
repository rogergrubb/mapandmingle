import { Hono } from 'hono';
import { prisma, broadcastToAll } from '../index';
import { z } from 'zod';


// Helper to extract userId from JWT token
function extractUserIdFromToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const JWT = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = JWT.verify(token, JWT_SECRET) as any;
    return decoded.userId || null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

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

// GET /api/pins - Get pins in viewport bounds (shows all pins visible in current map view)
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
    
    // Get pins within viewport bounds only (limit to 1000 most recent)
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
      take: 100, // Limit to 100 most recent pins for performance
    });
    
    // Get viewer ID from header
    const viewerId = c.req.header('X-User-Id') || null;
    
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

// POST /api/pins/auto-create - Auto-create a pin at user's current location
pinRoutes.post('/auto-create', async (c) => {
  try {
    let userId = c.req.header('X-User-Id');
    if (!userId) {
      const authHeader = c.req.header('Authorization');
      userId = extractUserIdFromToken(authHeader);
    }
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { latitude, longitude } = await c.req.json();
    
    if (latitude === undefined || longitude === undefined) {
      return c.json({ error: 'latitude and longitude required' }, 400);
    }
    
    // Check if user already has a pin
    const existingPin = await prisma.pin.findFirst({
      where: { userId },
    });
    
    if (existingPin) {
      return c.json({ error: 'User already has a pin. Delete it first to create a new one.' }, 400);
    }
    
    // Create default pin with generic description
    const pin = await prisma.pin.create({
      data: {
        userId,
        latitude,
        longitude,
        description: 'Mingling here!',
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
    console.error('Error auto-creating pin:', error);
    return c.json({ error: 'Failed to create pin' }, 500);
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
      likedByUser: false,
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
    let userId = c.req.header('X-User-Id');
    if (!userId) {
      const authHeader = c.req.header('Authorization');
      userId = extractUserIdFromToken(authHeader);
    }
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const createSchema = z.object({
      latitude: z.number(),
      longitude: z.number(),
      description: z.string().min(1).max(500),
      image: z.string().optional(),
    });
    
    const parsed = createSchema.safeParse(body);
    
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
    let userId = c.req.header('X-User-Id');
    if (!userId) {
      const authHeader = c.req.header('Authorization');
      userId = extractUserIdFromToken(authHeader);
    }
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


// GET /api/pins/user/mine - Get current user's pins
pinRoutes.get('/user/mine', async (c) => {
  try {
    let userId = c.req.header('X-User-Id');
    if (!userId) {
      const authHeader = c.req.header('Authorization');
      userId = extractUserIdFromToken(authHeader);
    }
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userPins = await prisma.pin.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(userPins.map(pin => ({
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
      },
    })));
  } catch (error) {
    console.error('Error fetching user pins:', error);
    return c.json({ error: 'Failed to fetch pins' }, 500);
  }
});

// DELETE /api/pins/:id - Delete a pin
pinRoutes.delete('/:id', async (c) => {
  try {
    let userId = c.req.header('X-User-Id');
    if (!userId) {
      const authHeader = c.req.header('Authorization');
      userId = extractUserIdFromToken(authHeader);
    }
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
