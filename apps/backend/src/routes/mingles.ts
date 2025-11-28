import { Hono } from 'hono';
import { prisma } from '../index';

export const mingleRoutes = new Hono();

const INTENT_CARDS = [
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
];

// GET /api/mingles/intent-cards
mingleRoutes.get('/intent-cards', (c) => c.json(INTENT_CARDS));

// GET /api/mingles - Get nearby mingles
mingleRoutes.get('/', async (c) => {
  try {
    const lat = parseFloat(c.req.query('latitude') || '0');
    const lng = parseFloat(c.req.query('longitude') || '0');
    
    const mingles = await prisma.mingleEvent.findMany({
      where: {
        status: { in: ['scheduled', 'live'] },
        startTime: { gte: new Date() },
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 30,
    });
    
    return c.json(mingles.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      intentCard: m.intentCard,
      latitude: m.latitude,
      longitude: m.longitude,
      locationName: m.locationName,
      radius: m.radius,
      startTime: m.startTime.toISOString(),
      duration: m.duration,
      status: m.status,
      maxParticipants: m.maxParticipants,
      participantCount: m._count.participants,
      host: m.host,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch mingles' }, 500);
  }
});

// POST /api/mingles - Create mingle
mingleRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const startTime = new Date(body.startTime);
    const endTime = new Date(startTime.getTime() + body.duration * 60 * 1000);
    
    const mingle = await prisma.mingleEvent.create({
      data: {
        hostId: userId,
        title: body.title,
        description: body.description,
        intentCard: body.intentCard,
        latitude: body.latitude,
        longitude: body.longitude,
        locationName: body.locationName,
        radius: body.radius || 200,
        startTime,
        duration: body.duration || 30,
        endTime,
        maxParticipants: body.maxParticipants,
        isPremiumOnly: body.isPremiumOnly || false,
      },
    });
    
    // Auto-confirm host
    await prisma.mingleParticipant.create({
      data: { mingleId: mingle.id, userId, status: 'confirmed' },
    });
    
    return c.json({ id: mingle.id }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create mingle' }, 500);
  }
});

// POST /api/mingles/:id/rsvp
mingleRoutes.post('/:id/rsvp', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const mingleId = c.req.param('id');
    const body = await c.req.json();
    
    await prisma.mingleParticipant.upsert({
      where: { mingleId_userId: { mingleId, userId } },
      create: { mingleId, userId, status: body.status || 'interested' },
      update: { status: body.status || 'interested' },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to RSVP' }, 500);
  }
});

// GET /api/mingles/:id - Get mingle details
mingleRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const mingleId = c.req.param('id');
    
    const mingle = await prisma.mingleEvent.findUnique({
      where: { id: mingleId },
      include: {
        host: { 
          select: { 
            id: true, 
            name: true, 
            image: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
                trustScore: true,
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!mingle) {
      return c.json({ error: 'Mingle not found' }, 404);
    }

    // Check if user has RSVP'd
    let userRsvp = null;
    if (userId) {
      const participant = mingle.participants.find(p => p.userId === userId);
      userRsvp = participant?.status || null;
    }
    
    return c.json({
      mingle: {
        id: mingle.id,
        title: mingle.title,
        description: mingle.description,
        intentCard: mingle.intentCard,
        latitude: mingle.latitude,
        longitude: mingle.longitude,
        locationName: mingle.locationName,
        radius: mingle.radius,
        startTime: mingle.startTime.toISOString(),
        endTime: mingle.endTime.toISOString(),
        duration: mingle.duration,
        status: mingle.status,
        maxParticipants: mingle.maxParticipants,
        isPremiumOnly: mingle.isPremiumOnly,
        host: {
          id: mingle.host.id,
          name: mingle.host.name,
          displayName: mingle.host.profile?.displayName || mingle.host.name,
          avatar: mingle.host.profile?.avatar || mingle.host.image,
          trustScore: mingle.host.profile?.trustScore || 50,
        },
        participants: mingle.participants.map(p => ({
          id: p.user.id,
          name: p.user.name,
          displayName: p.user.profile?.displayName || p.user.name,
          avatar: p.user.profile?.avatar || p.user.image,
          status: p.status,
          joinedAt: p.joinedAt.toISOString(),
        })),
        userRsvp,
        isHost: mingle.hostId === userId,
        createdAt: mingle.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching mingle:', error);
    return c.json({ error: 'Failed to fetch mingle' }, 500);
  }
});

// POST /api/mingles/:id/join - Join mingle
mingleRoutes.post('/:id/join', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const mingleId = c.req.param('id');
    
    const mingle = await prisma.mingleEvent.findUnique({
      where: { id: mingleId },
      include: { _count: { select: { participants: true } } },
    });
    
    if (!mingle) {
      return c.json({ error: 'Mingle not found' }, 404);
    }
    
    // Check capacity
    if (mingle.maxParticipants && mingle._count.participants >= mingle.maxParticipants) {
      return c.json({ error: 'Mingle is full' }, 400);
    }
    
    await prisma.mingleParticipant.upsert({
      where: { mingleId_userId: { mingleId, userId } },
      create: { mingleId, userId, status: 'confirmed' },
      update: { status: 'confirmed' },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to join mingle' }, 500);
  }
});

// POST /api/mingles/:id/leave - Leave mingle
mingleRoutes.post('/:id/leave', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const mingleId = c.req.param('id');
    
    await prisma.mingleParticipant.delete({
      where: { mingleId_userId: { mingleId, userId } },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to leave mingle' }, 500);
  }
});

// DELETE /api/mingles/:id - Cancel mingle (host only)
mingleRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const mingleId = c.req.param('id');
    
    const mingle = await prisma.mingleEvent.findUnique({
      where: { id: mingleId },
    });
    
    if (!mingle) {
      return c.json({ error: 'Mingle not found' }, 404);
    }
    
    if (mingle.hostId !== userId) {
      return c.json({ error: 'Only the host can cancel this mingle' }, 403);
    }
    
    await prisma.mingleEvent.update({
      where: { id: mingleId },
      data: { status: 'cancelled' },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to cancel mingle' }, 500);
  }
});

// PUT /api/mingles/:id/status - Update mingle status (host only)
mingleRoutes.put('/:id/status', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const mingleId = c.req.param('id');
    const { status } = await c.req.json();
    
    if (!['scheduled', 'live', 'ended', 'cancelled'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }
    
    const mingle = await prisma.mingleEvent.findUnique({
      where: { id: mingleId },
    });
    
    if (!mingle) {
      return c.json({ error: 'Mingle not found' }, 404);
    }
    
    if (mingle.hostId !== userId) {
      return c.json({ error: 'Only the host can update status' }, 403);
    }
    
    await prisma.mingleEvent.update({
      where: { id: mingleId },
      data: { status },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update status' }, 500);
  }
});
