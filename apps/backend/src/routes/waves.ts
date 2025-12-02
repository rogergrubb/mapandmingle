import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';
// import { sendWaveNotification } from './notifications';

export const waveRoutes = new Hono();

// POST /api/waves/:userId - Wave at a user
waveRoutes.post('/:userId', async (c) => {
  try {
    const fromUserId = c.req.header('x-user-id');
    if (!fromUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const toUserId = c.req.param('userId');
    
    if (fromUserId === toUserId) {
      return c.json({ error: 'Cannot wave at yourself' }, 400);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
    });

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if already waved (within last 24 hours)
    const existingWave = await prisma.wave.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });

    if (existingWave) {
      const hoursSinceWave = (Date.now() - existingWave.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceWave < 24) {
        return c.json({ 
          error: 'Already waved at this user recently',
          canWaveAgainAt: new Date(existingWave.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        }, 429);
      }

      // Update existing wave
      await prisma.wave.update({
        where: { id: existingWave.id },
        data: {
          status: 'sent',
          createdAt: new Date(),
          seenAt: null,
        },
      });
    } else {
      // Create new wave
      await prisma.wave.create({
        data: {
          fromUserId,
          toUserId,
          status: 'sent',
        },
      });
    }

    // Send push notification

    // Send real-time WebSocket notification
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      include: { profile: true },
    });

    broadcastToUser(toUserId, {
      type: 'wave_received',
      fromUser: {
        id: fromUserId,
        name: fromUser?.name,
        displayName: fromUser?.profile?.displayName || fromUser?.name,
        avatar: fromUser?.profile?.avatar,
      },
    });

    return c.json({ success: true, message: 'Wave sent!' });
  } catch (error) {
    console.error('Error sending wave:', error);
    return c.json({ error: 'Failed to send wave' }, 500);
  }
});

// POST /api/waves/:userId/wave-back - Wave back at a user
waveRoutes.post('/:userId/wave-back', async (c) => {
  try {
    const fromUserId = c.req.header('x-user-id');
    if (!fromUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const toUserId = c.req.param('userId');

    // Find their wave to us
    const incomingWave = await prisma.wave.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
    });

    if (!incomingWave) {
      return c.json({ error: 'No wave to respond to' }, 404);
    }

    // Update their wave status
    await prisma.wave.update({
      where: { id: incomingWave.id },
      data: { status: 'waved_back' },
    });

    // Create our wave back
    await prisma.wave.upsert({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
      update: {
        status: 'sent',
        createdAt: new Date(),
      },
      create: {
        fromUserId,
        toUserId,
        status: 'sent',
      },
    });

    // Send push notification

    // Send real-time WebSocket notification
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      include: { profile: true },
    });

    broadcastToUser(toUserId, {
      type: 'wave_back_received',
      fromUser: {
        id: fromUserId,
        name: fromUser?.name,
        displayName: fromUser?.profile?.displayName || fromUser?.name,
        avatar: fromUser?.profile?.avatar,
      },
    });

    return c.json({ success: true, message: 'Waved back!' });
  } catch (error) {
    console.error('Error waving back:', error);
    return c.json({ error: 'Failed to wave back' }, 500);
  }
});

// GET /api/waves/received - Get waves received
waveRoutes.get('/received', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const waves = await prisma.wave.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Mark as seen
    await prisma.wave.updateMany({
      where: {
        toUserId: userId,
        seenAt: null,
      },
      data: { seenAt: new Date() },
    });

    return c.json({
      waves: waves.map((w) => ({
        id: w.id,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
        fromUser: {
          id: w.fromUser.id,
          name: w.fromUser.name,
          displayName: w.fromUser.profile?.displayName || w.fromUser.name,
          avatar: w.fromUser.profile?.avatar,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching received waves:', error);
    return c.json({ error: 'Failed to fetch waves' }, 500);
  }
});

// GET /api/waves/sent - Get waves sent
waveRoutes.get('/sent', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const waves = await prisma.wave.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return c.json({
      waves: waves.map((w) => ({
        id: w.id,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
        toUser: {
          id: w.toUser.id,
          name: w.toUser.name,
          displayName: w.toUser.profile?.displayName || w.toUser.name,
          avatar: w.toUser.profile?.avatar,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching sent waves:', error);
    return c.json({ error: 'Failed to fetch waves' }, 500);
  }
});

// GET /api/waves/mutual - Get mutual waves (both waved at each other)
waveRoutes.get('/mutual', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get waves I've sent
    const sentWaves = await prisma.wave.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });
    const sentToIds = sentWaves.map((w) => w.toUserId);

    // Get waves I've received from users I've waved at
    const mutualWaves = await prisma.wave.findMany({
      where: {
        toUserId: userId,
        fromUserId: { in: sentToIds },
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return c.json({
      matches: mutualWaves.map((w) => ({
        id: w.fromUser.id,
        name: w.fromUser.name,
        displayName: w.fromUser.profile?.displayName || w.fromUser.name,
        avatar: w.fromUser.profile?.avatar,
        matchedAt: w.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching mutual waves:', error);
    return c.json({ error: 'Failed to fetch matches' }, 500);
  }
});

// GET /api/waves/status/:userId - Check wave status with a user
waveRoutes.get('/status/:userId', async (c) => {
  try {
    const fromUserId = c.req.header('x-user-id');
    if (!fromUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const toUserId = c.req.param('userId');

    // Check if I waved at them
    const sentWave = await prisma.wave.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });

    // Check if they waved at me
    const receivedWave = await prisma.wave.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
    });

    const canWave = !sentWave || 
      (Date.now() - sentWave.createdAt.getTime()) > 24 * 60 * 60 * 1000;

    return c.json({
      hasWavedAtThem: !!sentWave,
      hasReceivedWaveFromThem: !!receivedWave,
      isMutual: !!sentWave && !!receivedWave,
      canWave,
      sentWave: sentWave ? {
        status: sentWave.status,
        createdAt: sentWave.createdAt.toISOString(),
      } : null,
      receivedWave: receivedWave ? {
        status: receivedWave.status,
        createdAt: receivedWave.createdAt.toISOString(),
      } : null,
    });
  } catch (error) {
    console.error('Error checking wave status:', error);
    return c.json({ error: 'Failed to check wave status' }, 500);
  }
});

// DELETE /api/waves/:userId - Remove wave
waveRoutes.delete('/:userId', async (c) => {
  try {
    const fromUserId = c.req.header('x-user-id');
    if (!fromUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const toUserId = c.req.param('userId');

    await prisma.wave.delete({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing wave:', error);
    return c.json({ error: 'Failed to remove wave' }, 500);
  }
});

// GET /api/waves/count - Get unread wave count
waveRoutes.get('/count', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const count = await prisma.wave.count({
      where: {
        toUserId: userId,
        seenAt: null,
      },
    });

    return c.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching wave count:', error);
    return c.json({ error: 'Failed to fetch count' }, 500);
  }
});
