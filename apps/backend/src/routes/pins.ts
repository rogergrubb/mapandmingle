import { Hono } from 'hono';
import { prisma, broadcastToAll } from '../index';
import { z } from 'zod';


// Helper to extract userId from JWT token
function extractUserIdFromToken(authHeader: string | undefined): string | undefined {
  if (!authHeader) return undefined;
  
  const token = authHeader.replace('Bearer ', '');
  if (!token) return undefined;
  
  try {
    const JWT = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = JWT.verify(token, JWT_SECRET) as any;
    return decoded.userId || undefined;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return undefined;
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
  lookingFor: z.string().optional(), // Filter by connection type: dating, friends, networking, events, travel
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
    
    const { north, south, east, west, filter, lookingFor } = parsed.data;
    
    // Build date filter
    let dateFilter = {};
    if (filter === '24h') {
      dateFilter = { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
    } else if (filter === 'week') {
      dateFilter = { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    }
    
    // Get pins within viewport bounds only (limit to 1000 most recent)
    // Include pins from users active within the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
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
              select: { 
                avatar: true,
                lookingFor: true,
                displayName: true,
                lastActiveAt: true, // For ghost pin opacity
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 most recent pins for performance
    });
    
    // Get viewer ID from header
    const viewerId = c.req.header('X-User-Id') || null;
    
    // Get viewer's connections if logged in
    let viewerConnections: Map<string, { status: string; connectionId: string; isRequester: boolean }> = new Map();
    if (viewerId) {
      const connections = await prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: viewerId },
            { addresseeId: viewerId },
          ],
        },
        select: {
          id: true,
          requesterId: true,
          addresseeId: true,
          status: true,
        },
      });
      
      for (const conn of connections) {
        const otherUserId = conn.requesterId === viewerId ? conn.addresseeId : conn.requesterId;
        viewerConnections.set(otherUserId, {
          status: conn.status,
          connectionId: conn.id,
          isRequester: conn.requesterId === viewerId,
        });
      }
    }
    
    // Filter based on visibility rules and lookingFor filter
    const visiblePins = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    for (const pin of pins) {
      // Check if user has been active within 30 days
      const lastActive = pin.user.profile?.lastActiveAt;
      if (lastActive) {
        const timeSinceActive = now - new Date(lastActive).getTime();
        if (timeSinceActive > thirtyDaysMs) {
          continue; // Skip pins from users inactive for 30+ days
        }
      }
      
      // Check lookingFor filter if specified (skip 'everybody' mode)
      if (lookingFor && lookingFor !== 'everybody') {
        const userLookingFor = pin.user.profile?.lookingFor;
        if (userLookingFor) {
          try {
            const lookingForArray = JSON.parse(userLookingFor);
            if (!lookingForArray.includes(lookingFor)) {
              continue; // Skip this pin - user not looking for this type
            }
          } catch {
            continue; // Skip if can't parse
          }
        } else {
          continue; // Skip if no lookingFor set
        }
      }
      
      if (await canViewPin(pin, viewerId)) {
        // Calculate if user is "active" (within 24h) or "ghost" (1-30 days)
        const lastActiveTime = pin.user.profile?.lastActiveAt 
          ? new Date(pin.user.profile.lastActiveAt).getTime() 
          : new Date(pin.createdAt).getTime();
        const timeSinceActive = now - lastActiveTime;
        const isActive = timeSinceActive < oneDayMs;
        
        // Get connection status for this pin's creator
        const connectionInfo = viewerConnections.get(pin.user.id);
        const isFriend = connectionInfo?.status === 'accepted';
        
        visiblePins.push({
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          description: pin.description,
          image: pin.image,
          likesCount: pin.likesCount,
          createdAt: pin.createdAt.toISOString(),
          updatedAt: pin.updatedAt.toISOString(),
          isActive, // true if logged in within 24h
          lastActiveAt: pin.user.profile?.lastActiveAt?.toISOString() || pin.createdAt.toISOString(),
          isFriend, // true if connected
          connectionStatus: connectionInfo?.status || 'none',
          connectionId: connectionInfo?.connectionId || null,
          isRequester: connectionInfo?.isRequester || false,
          createdBy: {
            id: pin.user.id,
            name: pin.user.profile?.displayName || pin.user.name,
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

// GET /api/pins/nearby - Get pins within radius for auto-zoom algorithm
// Returns counts at different radii to help frontend determine optimal zoom
pinRoutes.get('/nearby', async (c) => {
  try {
    const lat = parseFloat(c.req.query('lat') || '0');
    const lng = parseFloat(c.req.query('lng') || '0');
    
    if (!lat || !lng) {
      return c.json({ error: 'lat and lng required' }, 400);
    }
    
    // Define search radii in km (2km, 5km, 10km, 25km)
    const radii = [2, 5, 10, 25];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    // Helper to calculate distance in km using Haversine formula
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    // Get all pins within the largest radius (25km ≈ 0.25 degrees)
    const maxRadiusDegrees = 0.3; // Slightly larger than 25km to be safe
    const pins = await prisma.pin.findMany({
      where: {
        latitude: { gte: lat - maxRadiusDegrees, lte: lat + maxRadiusDegrees },
        longitude: { gte: lng - maxRadiusDegrees, lte: lng + maxRadiusDegrees },
      },
      include: {
        user: {
          select: {
            profile: {
              select: { lastActiveAt: true, ghostMode: true },
            },
          },
        },
      },
    });
    
    // Calculate counts for each radius
    const radiusCounts = radii.map(radius => {
      let liveNow = 0;      // Active within 24h
      let activeToday = 0;  // Active within 24h (same as liveNow for now)
      let activeWeek = 0;   // Active within 7 days
      let total = 0;        // Active within 30 days
      
      pins.forEach(pin => {
        // Skip ghost mode users
        if (pin.user.profile?.ghostMode) return;
        
        const distance = haversineDistance(lat, lng, pin.latitude, pin.longitude);
        if (distance > radius) return;
        
        const lastActive = pin.user.profile?.lastActiveAt 
          ? new Date(pin.user.profile.lastActiveAt).getTime()
          : new Date(pin.createdAt).getTime();
        const timeSince = now - lastActive;
        
        if (timeSince > thirtyDaysMs) return; // Skip 30+ day old pins
        
        total++;
        if (timeSince <= sevenDaysMs) activeWeek++;
        if (timeSince <= oneDayMs) {
          liveNow++;
          activeToday++;
        }
      });
      
      return { radius, liveNow, activeToday, activeWeek, total };
    });
    
    // Find optimal radius (smallest with at least 5 pins)
    const minClusterSize = 5;
    let optimalRadius = radii[radii.length - 1]; // Default to largest
    let optimalZoom = 11; // Default zoom for 25km
    
    // Radius to zoom level mapping
    const radiusToZoom: Record<number, number> = {
      2: 15,   // ~2km view
      5: 14,   // ~5km view
      10: 13,  // ~10km view
      25: 11,  // ~25km view
    };
    
    for (const rc of radiusCounts) {
      if (rc.total >= minClusterSize) {
        optimalRadius = rc.radius;
        optimalZoom = radiusToZoom[rc.radius];
        break;
      }
    }
    
    // Get the counts for the optimal radius
    const optimal = radiusCounts.find(r => r.radius === optimalRadius) || radiusCounts[radiusCounts.length - 1];
    
    return c.json({
      radiusCounts,
      optimal: {
        radius: optimalRadius,
        zoom: optimalZoom,
        liveNow: optimal.liveNow,
        activeToday: optimal.activeToday,
        activeWeek: optimal.activeWeek,
        total: optimal.total,
      },
      isEmpty: optimal.total === 0,
    });
  } catch (error) {
    console.error('Error fetching nearby pins:', error);
    return c.json({ error: 'Failed to fetch nearby pins' }, 500);
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
    
    // Check if user already has a pin - if so, update it
    const existingPin = await prisma.pin.findFirst({
      where: { userId },
    });
    
    let pin;
    let isUpdate = false;
    
    if (existingPin) {
      // Update existing pin's location
      pin = await prisma.pin.update({
        where: { id: existingPin.id },
        data: {
          latitude,
          longitude,
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
      isUpdate = true;
    } else {
      // Create new pin with generic description
      pin = await prisma.pin.create({
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
      
      // Update user's pin count only for new pins
      await prisma.profile.update({
        where: { userId },
        data: { pinsCreated: { increment: 1 } },
      });
    }
    
    // Broadcast new/updated pin to all connected users
    broadcastToAll({
      type: isUpdate ? 'pin_updated' : 'new_pin',
      pin: {
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        description: pin.description,
        likesCount: pin.likesCount,
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
      likesCount: pin.likesCount,
      createdAt: pin.createdAt.toISOString(),
      createdBy: {
        id: pin.user.id,
        name: pin.user.name,
        image: pin.user.image,
        avatar: pin.user.profile?.avatar,
      },
      updated: isUpdate,
    }, isUpdate ? 200 : 201);
  } catch (error) {
    console.error('Error auto-creating pin:', error);
    return c.json({ error: 'Failed to create pin' }, 500);
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

// GET /api/pins/:id - Get single pin with full user profile
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
            email: true,
            image: true,
            profile: {
              select: {
                avatar: true,
                bio: true,
                displayName: true,
                age: true,
                gender: true,
                interests: true,
                lookingFor: true,
                occupation: true,
                education: true,
                location: true,
                languages: true,
                lastActiveAt: true,
                // Privacy controls
                hideBio: true,
                hideAge: true,
                hideInterests: true,
                hideLookingFor: true,
                hideOccupation: true,
                hideEducation: true,
                hideLocation: true,
                hideLanguages: true,
              },
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
    
    // Parse JSON fields and respect privacy settings
    const profile = pin.user.profile;
    let interests: string[] = [];
    let lookingFor: string[] = [];
    let languages: string[] = [];
    
    if (profile) {
      try {
        if (profile.interests && !profile.hideInterests) {
          interests = JSON.parse(profile.interests);
        }
      } catch {}
      
      try {
        if (profile.lookingFor && !profile.hideLookingFor) {
          lookingFor = JSON.parse(profile.lookingFor);
        }
      } catch {}
      
      try {
        if (profile.languages && !profile.hideLanguages) {
          languages = JSON.parse(profile.languages);
        }
      } catch {}
    }
    
    return c.json({
      id: pin.id,
      userId: pin.userId,
      latitude: pin.latitude,
      longitude: pin.longitude,
      description: pin.description,
      image: pin.image,
      photoUrl: pin.image,
      likesCount: pin.likesCount,
      likedByUser: false,
      createdAt: pin.createdAt.toISOString(),
      user: {
        id: pin.user.id,
        name: pin.user.name,
        image: pin.user.image,
        avatar: profile?.avatar,
        displayName: profile?.displayName,
        bio: profile?.hideBio ? null : profile?.bio,
        age: profile?.hideAge ? null : profile?.age,
        gender: profile?.gender,
        interests: profile?.hideInterests ? null : interests,
        lookingFor: profile?.hideLookingFor ? null : lookingFor,
        occupation: profile?.hideOccupation ? null : profile?.occupation,
        education: profile?.hideEducation ? null : profile?.education,
        location: profile?.hideLocation ? null : profile?.location,
        languages: profile?.hideLanguages ? null : languages,
        lastActiveAt: profile?.lastActiveAt,
        // Include privacy flags so frontend knows if hidden vs just empty
        privacy: {
          hideBio: profile?.hideBio || false,
          hideAge: profile?.hideAge || false,
          hideInterests: profile?.hideInterests || false,
          hideLookingFor: profile?.hideLookingFor || false,
          hideOccupation: profile?.hideOccupation || false,
          hideEducation: profile?.hideEducation || false,
          hideLocation: profile?.hideLocation || false,
          hideLanguages: profile?.hideLanguages || false,
        },
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
