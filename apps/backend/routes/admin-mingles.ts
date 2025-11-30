import { Hono } from 'hono';
import { db } from '../db';
import { verifyAuth, requireAdmin } from '../middleware/auth';

const app = new Hono();

// GET /admin/mingles - Get all mingle records (admin only)
app.get('/mingles', verifyAuth, requireAdmin, async (c) => {
  try {
    const mingles = await db.mingleEvent.findMany({
      include: {
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // Format response for admin panel
    const records = mingles.map((m) => ({
      id: m.id,
      hostId: m.hostId,
      hostName: m.host.name || 'Unknown',
      hostUsername: m.host.username || 'unknown',
      title: m.title,
      description: m.description,
      photoUrl: m.photoUrl,
      latitude: m.latitude,
      longitude: m.longitude,
      locationName: m.locationName,
      maxParticipants: m.maxParticipants,
      privacy: m.privacy,
      tags: m.tags,
      status: m.status,
      isActive: m.isActive,
      isDraft: m.isDraft,
      startTime: m.startTime.toISOString(),
      endTime: m.endTime.toISOString(),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      participantCount: m.participants.length,
    }));

    return c.json(records);
  } catch (error) {
    console.error('Admin mingles error:', error);
    return c.json({ error: 'Failed to fetch mingles' }, 400);
  }
});

export default app;