import { Hono } from 'hono';
import { prisma } from '../index';

export const activityIntentRoutes = new Hono();

const ACTIVITY_INTENTS = [
  { id: 'walk_and_talk', label: 'Walk and talk', emoji: '🚶' },
  { id: 'dog_owners', label: 'Dog owners welcome', emoji: '🐕' },
  { id: 'coffee_chat', label: 'Coffee chat', emoji: '☕' },
  { id: 'workout_buddy', label: 'Workout buddy', emoji: '💪' },
  { id: 'brainstorm', label: 'Brainstorm session', emoji: '💡' },
  { id: 'deep_conversation', label: 'Deep conversation only', emoji: '🧠' },
  { id: 'casual_hangout', label: 'Casual hangout', emoji: '😎' },
  { id: 'food', label: 'Looking for food', emoji: '🍕' },
  { id: 'study', label: 'Study session', emoji: '📚' },
  { id: 'photography', label: 'Photography walk', emoji: '📷' },
  { id: 'music', label: 'Live music', emoji: '🎵' },
  { id: 'bar_hopping', label: 'Bar hopping', emoji: '🍻' },
  { id: 'creative', label: 'Creative collaboration', emoji: '🎨' },
  { id: 'exploring', label: 'Just exploring', emoji: '🗺️' },
  { id: 'networking', label: 'Professional networking', emoji: '💼' },
  { id: 'language', label: 'Language exchange', emoji: '🗣️' },
  { id: 'gaming', label: 'Gaming meetup', emoji: '🎮' },
  { id: 'art_culture', label: 'Art and culture', emoji: '🏛️' },
];

// GET /api/activity-intents/options
activityIntentRoutes.get('/options', (c) => c.json(ACTIVITY_INTENTS));

// GET /api/activity-intents - Get current user's intent
activityIntentRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { activityIntent: true, activityIntentActive: true, activityIntentSetAt: true },
    });
    
    if (!profile) return c.json({ error: 'Profile not found' }, 404);
    
    return c.json({
      intent: profile.activityIntent,
      isActive: profile.activityIntentActive,
      setAt: profile.activityIntentSetAt?.toISOString(),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch intent' }, 500);
  }
});

// POST /api/activity-intents/set - Set activity intent
activityIntentRoutes.post('/set', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const { intent } = body;
    
    await prisma.profile.update({
      where: { userId },
      data: {
        activityIntent: intent,
        activityIntentActive: true,
        activityIntentSetAt: new Date(),
      },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to set intent' }, 500);
  }
});

// POST /api/activity-intents/clear - Clear activity intent
activityIntentRoutes.post('/clear', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    await prisma.profile.update({
      where: { userId },
      data: { activityIntentActive: false },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to clear intent' }, 500);
  }
});
