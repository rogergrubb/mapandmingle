import { Hono } from 'hono';
import { prisma } from '../lib/prisma';

export const videoRoomRoutes = new Hono();

// GET /api/video-rooms - List active rooms
videoRoomRoutes.get('/', async (c) => {
  try {
    const rooms = await prisma.videoRoom.findMany({
      where: { status: { in: ['waiting', 'active'] } },
      include: {
        host: { select: { id: true, name: true, image: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return c.json(rooms.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      maxParticipants: r.maxParticipants,
      participantCount: r._count.participants,
      isPremiumOnly: r.isPremiumOnly,
      host: r.host,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch rooms' }, 500);
  }
});

// POST /api/video-rooms - Create room
videoRoomRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    
    const room = await prisma.videoRoom.create({
      data: {
        hostId: userId,
        title: body.title,
        description: body.description,
        maxParticipants: body.maxParticipants || 10,
        isPremiumOnly: body.isPremiumOnly || false,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });
    
    // Host auto-joins
    await prisma.roomParticipant.create({
      data: { roomId: room.id, userId },
    });
    
    return c.json({ id: room.id }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create room' }, 500);
  }
});

// POST /api/video-rooms/:id/join
videoRoomRoutes.post('/:id/join', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const roomId = c.req.param('id');
    
    await prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId },
      update: { leftAt: null },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to join room' }, 500);
  }
});

// POST /api/video-rooms/:id/leave
videoRoomRoutes.post('/:id/leave', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const roomId = c.req.param('id');
    
    await prisma.roomParticipant.update({
      where: { roomId_userId: { roomId, userId } },
      data: { leftAt: new Date() },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to leave room' }, 500);
  }
});
