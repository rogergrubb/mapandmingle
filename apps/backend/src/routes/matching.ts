import { Hono } from 'hono';
import { prisma } from '../lib/prisma';

export const matchingRoutes = new Hono();

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/matches/smart - Smart matching algorithm
matchingRoutes.get('/smart', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const userProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!userProfile) return c.json({ error: 'Profile not found' }, 404);
    
    const userInterests = userProfile.interests ? JSON.parse(userProfile.interests) : [];
    const maxDistance = userProfile.maxDistance || 50;
    const minAge = userProfile.minAge;
    const maxAge = userProfile.maxAge;
    
    // Get recent pins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pins = await prisma.pin.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        userId: { not: userId },
        user: {
          profile: {
            ghostMode: false,
          },
        },
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
                interests: true,
                age: true,
                trustScore: true,
                lookingFor: true,
                boostActive: true,
              },
            },
          },
        },
      },
      take: 100,
    });
    
    // Calculate match scores
    const matches = pins.map((pin) => {
      let score = 0;
      const pinInterests = pin.user.profile?.interests 
        ? JSON.parse(pin.user.profile.interests) 
        : [];
      
      // Interest matching (40 points max)
      const commonInterests = userInterests.filter((i: string) => pinInterests.includes(i));
      score += Math.min(commonInterests.length * 10, 40);
      
      // Trust score bonus (20 points max)
      if (pin.user.profile?.trustScore) {
        score += Math.min(pin.user.profile.trustScore / 5, 20);
      }
      
      // Recency bonus (20 points max)
      const ageInDays = (Date.now() - pin.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 20 - ageInDays);
      
      // Boost bonus
      if (pin.user.profile?.boostActive) {
        score += 20;
      }
      
      // Popularity bonus (likes)
      score += Math.min(pin.likesCount * 2, 20);
      
      return {
        pin: {
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          description: pin.description,
          image: pin.image,
          likesCount: pin.likesCount,
          createdAt: pin.createdAt.toISOString(),
          createdBy: {
            id: pin.user.id,
            name: pin.user.name,
            image: pin.user.image,
            avatar: pin.user.profile?.avatar,
          },
        },
        matchScore: Math.round(score),
        commonInterests,
        distance: null,
      };
    });
    
    // Sort by score and filter
    const filteredMatches = matches
      .filter((m) => m.matchScore > 15)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50);
    
    return c.json(filteredMatches);
  } catch (error) {
    console.error('Error getting smart matches:', error);
    return c.json({ error: 'Failed to get matches' }, 500);
  }
});

// GET /api/matches/second-chances - Pins you liked but didn't message
matchingRoutes.get('/second-chances', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const likedPins = await prisma.pinLike.findMany({
      where: { userId },
      include: {
        pin: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                profile: { select: { avatar: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    // Filter out pins where user already started a conversation
    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversation: { select: { participants: true } } },
    });
    
    const conversationPartners = new Set(
      userConversations.flatMap((c) => 
        c.conversation.participants.map((p) => p.userId)
      )
    );
    
    const secondChances = likedPins
      .filter((like) => !conversationPartners.has(like.pin.userId))
      .map((like) => ({
        pin: {
          id: like.pin.id,
          latitude: like.pin.latitude,
          longitude: like.pin.longitude,
          description: like.pin.description,
          image: like.pin.image,
          likesCount: like.pin.likesCount,
          createdAt: like.pin.createdAt.toISOString(),
          createdBy: {
            id: like.pin.user.id,
            name: like.pin.user.name,
            image: like.pin.user.image,
            avatar: like.pin.user.profile?.avatar,
          },
        },
        likedAt: like.createdAt.toISOString(),
      }));
    
    return c.json(secondChances);
  } catch (error) {
    return c.json({ error: 'Failed to get second chances' }, 500);
  }
});
