import { Hono } from 'hono';
import { prisma } from '../index';

export const savedPinsRoutes = new Hono();

// GET /api/saved-pins - Get saved pins
savedPinsRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const saved = await prisma.savedPin.findMany({
      where: { userId },
      include: {
        pin: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return c.json(saved.map(s => ({
      id: s.id,
      savedAt: s.createdAt.toISOString(),
      pin: {
        id: s.pin.id,
        latitude: s.pin.latitude,
        longitude: s.pin.longitude,
        description: s.pin.description,
        image: s.pin.image,
        likesCount: s.pin.likesCount,
        createdAt: s.pin.createdAt.toISOString(),
        createdBy: s.pin.user,
      },
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch saved pins' }, 500);
  }
});

// POST /api/saved-pins/:pinId/toggle - Save/unsave pin
savedPinsRoutes.post('/:pinId/toggle', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const pinId = c.req.param('pinId');
    
    const existing = await prisma.savedPin.findUnique({
      where: { userId_pinId: { userId, pinId } },
    });
    
    if (existing) {
      await prisma.savedPin.delete({ where: { id: existing.id } });
      return c.json({ saved: false });
    } else {
      await prisma.savedPin.create({ data: { userId, pinId } });
      return c.json({ saved: true });
    }
  } catch (error) {
    return c.json({ error: 'Failed to toggle save' }, 500);
  }
});

// POST /api/saved-pins/check - Check if pins are saved
savedPinsRoutes.post('/check', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const { pinIds } = body;
    
    const saved = await prisma.savedPin.findMany({
      where: { userId, pinId: { in: pinIds } },
      select: { pinId: true },
    });
    
    const savedSet = new Set(saved.map(s => s.pinId));
    
    return c.json(pinIds.reduce((acc: any, id: string) => {
      acc[id] = savedSet.has(id);
      return acc;
    }, {}));
  } catch (error) {
    return c.json({ error: 'Failed to check saved pins' }, 500);
  }
});
