import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { AIService } from '../services/ai.service';

export const aiRoutes = new Hono();

/**
 * Moderate content before posting
 * POST /api/ai/moderate
 */
aiRoutes.post('/moderate', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { content } = await c.req.json();

    if (!content) {
      return c.json({ error: 'Missing content' }, 400);
    }

    const result = await AIService.moderateContent(content);

    return c.json(result);
  } catch (error) {
    console.error('Content moderation error:', error);
    return c.json({ error: 'Moderation failed' }, 500);
  }
});

/**
 * Get event recommendations
 * GET /api/ai/recommend-events
 */
aiRoutes.get('/recommend-events', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user interests and location
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get available events
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
      },
      take: 20,
      orderBy: {
        startTime: 'asc',
      },
    });

    const eventData = events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      category: e.category || 'general',
    }));

    const recommendations = await AIService.generateEventRecommendations(
      user.interests,
      user.location || 'Unknown',
      eventData
    );

    // Get full event details for recommended IDs
    const recommendedEvents = await prisma.event.findMany({
      where: {
        id: {
          in: recommendations,
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    // Sort by recommendation order
    const sortedEvents = recommendations
      .map(id => recommendedEvents.find(e => e.id === id))
      .filter(Boolean);

    return c.json({ events: sortedEvents });
  } catch (error) {
    console.error('Event recommendations error:', error);
    return c.json({ error: 'Failed to get recommendations' }, 500);
  }
});

/**
 * Get user match suggestions
 * GET /api/ai/suggest-matches
 */
aiRoutes.get('/suggest-matches', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get potential matches (users in similar location, not already following)
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        // Add location-based filtering here if needed
      },
      take: 20,
    });

    const matchData = potentialMatches.map(u => ({
      id: u.id,
      interests: u.interests,
      bio: u.bio || '',
      activityLevel: u.activityLevel || 'moderate',
    }));

    const matches = await AIService.generateUserMatches(
      {
        interests: currentUser.interests,
        bio: currentUser.bio || '',
        activityLevel: currentUser.activityLevel || 'moderate',
      },
      matchData
    );

    // Get full user details for matches
    const matchedUsers = await prisma.user.findMany({
      where: {
        id: {
          in: matches.map(m => m.userId),
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        interests: true,
      },
    });

    // Combine match scores with user data
    const results = matches.map(match => {
      const user = matchedUsers.find(u => u.id === match.userId);
      return {
        ...user,
        matchScore: match.score,
        matchReason: match.reason,
      };
    });

    return c.json({ matches: results });
  } catch (error) {
    console.error('User matching error:', error);
    return c.json({ error: 'Failed to get matches' }, 500);
  }
});

/**
 * Analyze message sentiment
 * POST /api/ai/sentiment
 */
aiRoutes.post('/sentiment', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { message } = await c.req.json();

    if (!message) {
      return c.json({ error: 'Missing message' }, 400);
    }

    const result = await AIService.analyzeSentiment(message);

    return c.json(result);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return c.json({ error: 'Sentiment analysis failed' }, 500);
  }
});

/**
 * Detect spam
 * POST /api/ai/detect-spam
 */
aiRoutes.post('/detect-spam', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { content, title } = await c.req.json();

    if (!content) {
      return c.json({ error: 'Missing content' }, 400);
    }

    const result = await AIService.detectSpam(content, title);

    return c.json(result);
  } catch (error) {
    console.error('Spam detection error:', error);
    return c.json({ error: 'Spam detection failed' }, 500);
  }
});

export default aiRoutes;
