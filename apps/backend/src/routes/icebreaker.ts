import { Hono } from 'hono';
import { prisma } from '../index';
import Anthropic from '@anthropic-ai/sdk';

export const icebreakerRoutes = new Hono();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// POST /api/icebreaker/generate - Generate AI icebreaker
icebreakerRoutes.post('/generate', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const { targetUserId, context } = body;
    
    // Get both profiles
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });
    const targetProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: { user: { select: { name: true } } },
    });
    
    if (!userProfile || !targetProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    const userInterests = userProfile.interests ? JSON.parse(userProfile.interests) : [];
    const targetInterests = targetProfile.interests ? JSON.parse(targetProfile.interests) : [];
    const commonInterests = userInterests.filter((i: string) => targetInterests.includes(i));
    
    const prompt = `Generate a friendly, natural conversation opener for a social/dating app called Map Mingle.

CONTEXT:
- You're helping someone start a conversation with a person they noticed on the app
- This should feel natural, not creepy or over-the-top
- Be warm but not too familiar since they haven't met yet

SENDER INFO:
- Interests: ${userInterests.join(', ') || 'Not specified'}
- Looking for: ${userProfile.lookingFor || 'Not specified'}

RECIPIENT INFO:
- Name: ${targetProfile.displayName || targetProfile.user.name || 'Someone'}
- Interests: ${targetInterests.join(', ') || 'Not specified'}
- Activity status: ${targetProfile.activityIntent || 'Not specified'}

COMMON INTERESTS: ${commonInterests.join(', ') || 'None detected'}

LOCATION CONTEXT: ${context?.location || 'Not specified'}

Generate ONE short, friendly icebreaker message (1-2 sentences max). Make it:
- Casual and genuine
- Reference a common interest if any
- Location-aware if location was provided
- Not cheesy or pickup line-y

Just output the message, nothing else.`;

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback without AI
      const fallbacks = [
        `Hey! I noticed we both like ${commonInterests[0] || 'meeting new people'}. What brings you to Map Mingle?`,
        `Hi there! Your profile caught my eye. Would love to chat if you're up for it!`,
        `Hey! Always cool to meet someone in the area. What's your favorite spot around here?`,
      ];
      return c.json({
        icebreaker: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        commonInterests,
        isLocationAware: !!context?.location,
        isPersonalized: commonInterests.length > 0,
      });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const icebreaker = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : 'Hey! Would love to chat if you have a moment!';

    return c.json({
      icebreaker,
      commonInterests,
      isLocationAware: !!context?.location,
      isPersonalized: true,
    });
  } catch (error) {
    console.error('Icebreaker error:', error);
    return c.json({ 
      icebreaker: "Hey! I noticed your profile and thought I'd say hi. What brings you to Map Mingle?",
      commonInterests: [],
      isLocationAware: false,
      isPersonalized: false,
    });
  }
});
