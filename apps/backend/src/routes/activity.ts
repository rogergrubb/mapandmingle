import { Hono } from 'hono';
import { prisma } from '../lib/prisma';

export const activityRoutes = new Hono();

// GET /api/activity/nearby - Get nearby activity for first impression
activityRoutes.get('/nearby', async (c) => {
  try {
    const lat = parseFloat(c.req.query('latitude') || '0');
    const lng = parseFloat(c.req.query('longitude') || '0');
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Get pins from different time windows
    const [pinsToday, pinsLastHour, pinsFiveMin] = await Promise.all([
      prisma.pin.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.pin.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.pin.count({ where: { createdAt: { gte: fiveMinAgo } } }),
    ]);
    
    // Get recent pins for display
    const recentPins = await prisma.pin.findMany({
      where: { createdAt: { gte: oneHourAgo } },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    // Get one "mystery" pin for teaser
    const mysteryPin = await prisma.pin.findFirst({
      where: { createdAt: { gte: oneDayAgo } },
      orderBy: { createdAt: 'desc' },
    });
    
    return c.json({
      stats: {
        pinsToday,
        pinsLastHour,
        pinsFiveMin,
      },
      recentPins: recentPins.map(p => ({
        id: p.id,
        description: p.description.substring(0, 100),
        image: p.image,
        createdAt: p.createdAt.toISOString(),
        user: { name: p.user.name },
      })),
      mysteryPin: mysteryPin ? {
        id: mysteryPin.id,
        latitude: mysteryPin.latitude,
        longitude: mysteryPin.longitude,
        description: mysteryPin.description.substring(0, 50) + '...',
        createdAt: mysteryPin.createdAt.toISOString(),
      } : null,
      justMissed: pinsFiveMin > 0 ? {
        count: pinsFiveMin,
        message: `${pinsFiveMin} ${pinsFiveMin === 1 ? 'person' : 'people'} dropped a pin nearby in the last 5 minutes!`,
      } : null,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch activity' }, 500);
  }
});

// GET /api/activity/feed - Activity feed
activityRoutes.get('/feed', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const pins = await prisma.pin.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        user: { profile: { ghostMode: false } },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    return c.json(pins.map(p => ({
      type: 'pin',
      id: p.id,
      description: p.description,
      image: p.image,
      likesCount: p.likesCount,
      createdAt: p.createdAt.toISOString(),
      user: {
        id: p.user.id,
        name: p.user.name,
        image: p.user.image,
      },
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch feed' }, 500);
  }
});
