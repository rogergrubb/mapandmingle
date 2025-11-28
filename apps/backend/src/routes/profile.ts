import { Hono } from 'hono';
import { prisma } from '../index';
import { z } from 'zod';

export const profileRoutes = new Hono();

// Update profile schema
const updateProfileSchema = z.object({
  handle: z.string().optional(),
  displayName: z.string().optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().optional(),
  age: z.number().min(18).max(99).optional(),
  gender: z.enum(['male', 'female', 'nonbinary', 'prefer_not']).optional(),
  relationshipStatus: z.enum(['single', 'dating', 'committed', 'married', 'open', 'complicated', 'prefer_not']).optional(),
  openness: z.enum(['monogamous', 'open', 'flexible', 'exploring', 'prefer_not']).optional(),
  interests: z.array(z.string()).max(15).optional(),
  lookingFor: z.string().optional(),
  chatReadiness: z.enum(['open_to_chat', 'open_to_meet', 'browsing_only', 'busy']).optional(),
  activityIntent: z.string().optional(),
  activityIntentActive: z.boolean().optional(),
  currentLocationLat: z.number().optional(),
  currentLocationLng: z.number().optional(),
  preferredAgeMin: z.number().min(18).max(99).optional(),
  preferredAgeMax: z.number().min(18).max(99).optional(),
  preferredDistanceKm: z.number().min(1).max(500).optional(),
  visibilityMode: z.enum(['public', 'friends_only', 'hidden']).optional(),
  whoCanMessage: z.enum(['everyone', 'verified', 'none']).optional(),
  whoCanSeePins: z.enum(['everyone', 'connections', 'none']).optional(),
  whoCanSeeProfile: z.enum(['everyone', 'connections', 'none']).optional(),
  showActivityStatus: z.boolean().optional(),
  hideLastOnline: z.boolean().optional(),
  ghostMode: z.boolean().optional(),
  incognitoMode: z.boolean().optional(),
  selectiveVisibilityEnabled: z.boolean().optional(),
  visibilityMinAge: z.number().optional(),
  visibilityMaxAge: z.number().optional(),
  visibilityRequireInterests: z.boolean().optional(),
  visibilityMinSharedInterests: z.number().optional(),
  visibilityMaxDistance: z.number().optional(),
  visibilityMinReputation: z.number().optional(),
  visibilityPremiumOnly: z.boolean().optional(),
  visibilityHideFromBlocked: z.boolean().optional(),
});

// GET /api/profile - Get current user's profile
profileRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
          },
        },
      },
    });
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    return c.json({
      id: profile.id,
      userId: profile.userId,
      user: profile.user,
      handle: profile.handle,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      age: profile.age,
      gender: profile.gender,
      relationshipStatus: profile.relationshipStatus,
      openness: profile.openness,
      interests: profile.interests ? JSON.parse(profile.interests) : [],
      lookingFor: profile.lookingFor,
      chatReadiness: profile.chatReadiness,
      activityIntent: profile.activityIntent,
      activityIntentActive: profile.activityIntentActive,
      currentLocationLat: profile.currentLocationLat,
      currentLocationLng: profile.currentLocationLng,
      preferredAgeMin: profile.preferredAgeMin,
      preferredAgeMax: profile.preferredAgeMax,
      preferredDistanceKm: profile.preferredDistanceKm,
      visibilityMode: profile.visibilityMode,
      whoCanMessage: profile.whoCanMessage,
      whoCanSeePins: profile.whoCanSeePins,
      whoCanSeeProfile: profile.whoCanSeeProfile,
      showActivityStatus: profile.showActivityStatus,
      hideLastOnline: profile.hideLastOnline,
      ghostMode: profile.ghostMode,
      incognitoMode: profile.incognitoMode,
      selectiveVisibilityEnabled: profile.selectiveVisibilityEnabled,
      visibilityMinAge: profile.visibilityMinAge,
      visibilityMaxAge: profile.visibilityMaxAge,
      visibilityRequireInterests: profile.visibilityRequireInterests,
      visibilityMinSharedInterests: profile.visibilityMinSharedInterests,
      visibilityMaxDistance: profile.visibilityMaxDistance,
      visibilityMinReputation: profile.visibilityMinReputation,
      visibilityPremiumOnly: profile.visibilityPremiumOnly,
      visibilityHideFromBlocked: profile.visibilityHideFromBlocked,
      trustScore: profile.trustScore,
      trustLevel: profile.trustLevel,
      subscriptionStatus: profile.subscriptionStatus,
      subscriptionExpiresAt: profile.subscriptionExpiresAt?.toISOString(),
      boostActive: profile.boostActive,
      featuredBadgeColor: profile.featuredBadgeColor,
      lastActiveAt: profile.lastActiveAt?.toISOString(),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// PUT /api/profile - Update current user's profile
profileRoutes.put('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const parsed = updateProfileSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid data', details: parsed.error.errors }, 400);
    }
    
    const data = parsed.data;
    
    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });
    
    if (!existingProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // Check premium status for certain features
    const isPremium = existingProfile.subscriptionStatus === 'active' || 
                      existingProfile.subscriptionStatus === 'trial';
    
    // Premium-only features
    if (!isPremium) {
      if (data.ghostMode || data.incognitoMode || data.selectiveVisibilityEnabled) {
        return c.json({ error: 'Premium subscription required for this feature' }, 403);
      }
    }
    
    // Build update data
    const updateData: any = {
      ...data,
      interests: data.interests ? JSON.stringify(data.interests) : undefined,
      lastActiveAt: new Date(),
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });
    
    const profile = await prisma.profile.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
          },
        },
      },
    });
    
    return c.json({
      id: profile.id,
      userId: profile.userId,
      user: profile.user,
      handle: profile.handle,
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar,
      age: profile.age,
      gender: profile.gender,
      relationshipStatus: profile.relationshipStatus,
      openness: profile.openness,
      interests: profile.interests ? JSON.parse(profile.interests) : [],
      lookingFor: profile.lookingFor,
      chatReadiness: profile.chatReadiness,
      trustScore: profile.trustScore,
      trustLevel: profile.trustLevel,
      subscriptionStatus: profile.subscriptionStatus,
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// GET /api/profile/:userId - Get another user's public profile
profileRoutes.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const viewerId = c.req.header('X-User-Id');
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            emailVerified: true,
          },
        },
      },
    });
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // Check visibility settings
    if (profile.whoCanSeeProfile === 'none') {
      return c.json({ error: 'Profile is private' }, 403);
    }
    
    // Check ghost mode
    if (profile.ghostMode && viewerId !== userId) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // Check if blocked
    if (viewerId) {
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedUserId: viewerId },
            { blockerId: viewerId, blockedUserId: userId },
          ],
        },
      });
      if (isBlocked) {
        return c.json({ error: 'Profile not available' }, 403);
      }
    }
    
    // Return public profile data
    return c.json({
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      displayName: profile.displayName,
      image: profile.user.image,
      avatar: profile.avatar,
      bio: profile.bio,
      age: profile.age,
      gender: profile.gender,
      relationshipStatus: profile.relationshipStatus,
      openness: profile.openness,
      interests: profile.interests ? JSON.parse(profile.interests) : [],
      lookingFor: profile.lookingFor,
      chatReadiness: profile.chatReadiness,
      activityIntent: profile.activityIntentActive ? profile.activityIntent : null,
      trustScore: profile.trustScore,
      trustLevel: profile.trustLevel,
      emailVerified: profile.user.emailVerified,
      subscriptionStatus: profile.subscriptionStatus,
      boostActive: profile.boostActive,
      featuredBadgeColor: profile.featuredBadgeColor,
      lastActiveAt: profile.showActivityStatus && !profile.hideLastOnline 
        ? profile.lastActiveAt?.toISOString() 
        : null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});
