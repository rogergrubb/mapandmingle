import { Hono } from 'hono';
import { prisma } from '../lib/prisma';

export const trustScoreRoutes = new Hono();

function calculateTrustLevel(score: number): string {
  if (score >= 80) return 'vip';
  if (score >= 60) return 'verified';
  if (score >= 40) return 'trusted';
  if (score >= 20) return 'new';
  if (score >= 10) return 'flagged';
  return 'restricted';
}

// GET /api/trust-score - Get user's trust score
trustScoreRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return c.json({ error: 'Profile not found' }, 404);
    
    const visibilityMultiplier = profile.trustScore >= 70 ? 1.5 :
                                 profile.trustScore >= 50 ? 1.0 :
                                 profile.trustScore >= 30 ? 0.5 : 0.1;
    
    return c.json({
      trustScore: profile.trustScore,
      trustLevel: profile.trustLevel,
      positiveInteractions: profile.positiveInteractions,
      negativeInteractions: profile.negativeInteractions,
      spamReports: profile.spamReports,
      behaviorFlags: profile.behaviorFlags,
      benefits: {
        visibilityMultiplier,
        priorityPlacement: profile.trustScore >= 70,
        featuresAccess: profile.trustScore >= 50 
          ? ['video_calls', 'group_rooms', 'priority_support']
          : ['basic_messaging'],
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch trust score' }, 500);
  }
});

// POST /api/trust-score/recalculate - Recalculate trust score
trustScoreRoutes.post('/recalculate', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return c.json({ error: 'Profile not found' }, 404);
    
    // Calculate score based on various factors
    let score = 50; // Base score
    
    // Positive factors
    score += Math.min(profile.pinsCreated * 2, 10);
    score += Math.min(profile.likesReceived, 15);
    score += Math.min(profile.messagesSent / 10, 10);
    score += Math.min(profile.eventsAttended * 3, 15);
    
    // Negative factors
    score -= profile.spamReports * 10;
    score -= profile.behaviorFlags * 5;
    score -= profile.negativeInteractions * 2;
    
    // Clamp to 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    const trustLevel = calculateTrustLevel(score);
    
    await prisma.profile.update({
      where: { userId },
      data: { trustScore: score, trustLevel },
    });
    
    return c.json({ trustScore: score, trustLevel });
  } catch (error) {
    return c.json({ error: 'Failed to recalculate trust score' }, 500);
  }
});
