import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';

export const locationRoutes = new Hono();

// In-memory store for live location shares (use Redis in production)
const liveShares = new Map<string, {
  shareId: string;
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  expiresAt: Date;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}>();

// POST /api/location/share - Start sharing location
locationRoutes.post('/share', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { conversationId, type, durationMinutes, latitude, longitude, address } = body;

    // Verify user is part of conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      return c.json({ error: 'Not a participant of this conversation' }, 403);
    }

    // Get the other participant
    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: { 
        conversationId,
        userId: { not: userId },
      },
    });

    if (!otherParticipant) {
      return c.json({ error: 'No other participant found' }, 404);
    }

    if (type === 'current' || type === 'custom') {
      // One-time location share - create a message
      const message = await prisma.message.create({
        data: {
          senderId: userId,
          receiverId: otherParticipant.userId,
          content: JSON.stringify({
            type: 'location',
            shareType: type,
            latitude,
            longitude,
            address,
          }),
        },
      });

      // Notify recipient via WebSocket
      broadcastToUser(otherParticipant.userId, {
        type: 'new_message',
        message: {
          id: message.id,
          conversationId,
          senderId: userId,
          type: 'location',
          location: { latitude, longitude, address },
          createdAt: message.createdAt.toISOString(),
        },
      });

      return c.json({ 
        success: true,
        messageId: message.id,
      });
    } else if (type === 'live') {
      // Live location sharing
      const shareId = `live_${userId}_${conversationId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + (durationMinutes || 30) * 60 * 1000);

      // Store in memory (use Redis in production)
      liveShares.set(shareId, {
        shareId,
        fromUserId: userId,
        toUserId: otherParticipant.userId,
        conversationId,
        expiresAt,
        lastLocation: latitude && longitude ? {
          latitude,
          longitude,
          timestamp: new Date(),
        } : undefined,
      });

      // Create initial message
      const message = await prisma.message.create({
        data: {
          senderId: userId,
          receiverId: otherParticipant.userId,
          content: JSON.stringify({
            type: 'location',
            shareType: 'live',
            shareId,
            latitude,
            longitude,
            address,
            expiresAt: expiresAt.toISOString(),
          }),
        },
      });

      // Notify recipient
      broadcastToUser(otherParticipant.userId, {
        type: 'live_location_started',
        shareId,
        fromUserId: userId,
        conversationId,
        expiresAt: expiresAt.toISOString(),
        location: latitude && longitude ? { latitude, longitude, address } : null,
      });

      return c.json({
        success: true,
        shareId,
        messageId: message.id,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return c.json({ error: 'Invalid share type' }, 400);
  } catch (error) {
    console.error('Error sharing location:', error);
    return c.json({ error: 'Failed to share location' }, 500);
  }
});

// PUT /api/location/live/:shareId - Update live location
locationRoutes.put('/live/:shareId', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const shareId = c.req.param('shareId');
    const { latitude, longitude } = await c.req.json();

    const share = liveShares.get(shareId);

    if (!share) {
      return c.json({ error: 'Live share not found or expired' }, 404);
    }

    if (share.fromUserId !== userId) {
      return c.json({ error: 'Not authorized to update this share' }, 403);
    }

    if (new Date() > share.expiresAt) {
      liveShares.delete(shareId);
      return c.json({ error: 'Live share has expired' }, 410);
    }

    // Update location
    share.lastLocation = {
      latitude,
      longitude,
      timestamp: new Date(),
    };

    // Broadcast to recipient
    broadcastToUser(share.toUserId, {
      type: 'live_location_update',
      shareId,
      fromUserId: userId,
      location: {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating live location:', error);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

// DELETE /api/location/live/:shareId - Stop live sharing
locationRoutes.delete('/live/:shareId', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const shareId = c.req.param('shareId');
    const share = liveShares.get(shareId);

    if (!share) {
      return c.json({ error: 'Live share not found' }, 404);
    }

    if (share.fromUserId !== userId) {
      return c.json({ error: 'Not authorized to stop this share' }, 403);
    }

    // Notify recipient
    broadcastToUser(share.toUserId, {
      type: 'live_location_ended',
      shareId,
      fromUserId: userId,
    });

    liveShares.delete(shareId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error stopping live share:', error);
    return c.json({ error: 'Failed to stop live share' }, 500);
  }
});

// GET /api/location/live/:shareId - Get live share status
locationRoutes.get('/live/:shareId', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const shareId = c.req.param('shareId');
    const share = liveShares.get(shareId);

    if (!share) {
      return c.json({ error: 'Live share not found or expired' }, 404);
    }

    // Must be sender or recipient
    if (share.fromUserId !== userId && share.toUserId !== userId) {
      return c.json({ error: 'Not authorized to view this share' }, 403);
    }

    const isExpired = new Date() > share.expiresAt;

    if (isExpired) {
      liveShares.delete(shareId);
      return c.json({ 
        isActive: false,
        expired: true,
      });
    }

    return c.json({
      isActive: true,
      expired: false,
      fromUserId: share.fromUserId,
      expiresAt: share.expiresAt.toISOString(),
      lastLocation: share.lastLocation ? {
        latitude: share.lastLocation.latitude,
        longitude: share.lastLocation.longitude,
        timestamp: share.lastLocation.timestamp.toISOString(),
      } : null,
    });
  } catch (error) {
    console.error('Error getting live share:', error);
    return c.json({ error: 'Failed to get live share' }, 500);
  }
});

// GET /api/location/active - Get all active live shares for user
locationRoutes.get('/active', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const now = new Date();
    const activeShares: any[] = [];

    // Clean up expired and collect active
    for (const [shareId, share] of liveShares.entries()) {
      if (now > share.expiresAt) {
        liveShares.delete(shareId);
        continue;
      }

      if (share.fromUserId === userId || share.toUserId === userId) {
        activeShares.push({
          shareId,
          fromUserId: share.fromUserId,
          toUserId: share.toUserId,
          conversationId: share.conversationId,
          expiresAt: share.expiresAt.toISOString(),
          isSharing: share.fromUserId === userId,
          lastLocation: share.lastLocation,
        });
      }
    }

    return c.json({ activeShares });
  } catch (error) {
    console.error('Error getting active shares:', error);
    return c.json({ error: 'Failed to get active shares' }, 500);
  }
});

// Cleanup expired shares periodically
setInterval(() => {
  const now = new Date();
  for (const [shareId, share] of liveShares.entries()) {
    if (now > share.expiresAt) {
      // Notify recipient that share expired
      broadcastToUser(share.toUserId, {
        type: 'live_location_ended',
        shareId,
        fromUserId: share.fromUserId,
        reason: 'expired',
      });
      liveShares.delete(shareId);
    }
  }
}, 60 * 1000); // Check every minute

