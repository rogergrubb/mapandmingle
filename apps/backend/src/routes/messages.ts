import { Hono } from 'hono';
import { prisma } from '../index';
import { z } from 'zod';

export const messagesRoutes = new Hono();

const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(5000),
});

const markReadSchema = z.object({
  messageId: z.string(),
});

const editMessageSchema = z.object({
  messageId: z.string(),
  content: z.string().min(1).max(5000),
});

// POST /api/messages - Send a message
messagesRoutes.post('/', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body: any = await c.req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid message data' }, 400);

    const { receiverId, content } = parsed.data;

    // Check if sender is blocked by receiver
    const isBlocked = await prisma.blockedUser.findFirst({
      where: { blockerId: receiverId, blockedId: userId },
    });
    if (isBlocked) return c.json({ error: 'You are blocked by this user' }, 403);

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    // Create in-app notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'message',
        title: 'New Message',
        body: `${message.sender.name}: ${content.substring(0, 50)}...`,
        fromUserId: userId,
        data: JSON.stringify({ messageId: message.id }),
      },
    });

    return c.json({ success: true, message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// GET /api/messages/conversation/:userId - Get conversation with user
messagesRoutes.get('/conversation/:userId', async (c: any) => {
  try {
    const currentUserId = c.req.header('X-User-Id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const { userId } = c.req.param();
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')) : 0;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            profile: { select: { avatar: true, displayName: true } }
          } 
        },
        receiver: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            profile: { select: { avatar: true, displayName: true } }
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Transform to include avatar and displayName
    const transformedMessages = messages.map(msg => ({
      ...msg,
      sender: {
        id: msg.sender.id,
        name: msg.sender.profile?.displayName || msg.sender.name,
        email: msg.sender.email,
        avatar: msg.sender.profile?.avatar || null,
      },
      receiver: {
        id: msg.receiver.id,
        name: msg.receiver.profile?.displayName || msg.receiver.name,
        email: msg.receiver.email,
        avatar: msg.receiver.profile?.avatar || null,
      },
    }));

    return c.json(transformedMessages.reverse());
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

// GET /api/messages/conversations - Get all conversations (latest message with each user)
messagesRoutes.get('/conversations', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    // Get all unique users we have messages with
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            profile: { select: { avatar: true, displayName: true } }
          } 
        },
        receiver: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            profile: { select: { avatar: true, displayName: true } }
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversations: Record<string, any> = {};
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations[partnerId]) {
        const partnerData = msg.senderId === userId ? msg.receiver : msg.sender;
        conversations[partnerId] = {
          partnerId,
          partner: {
            id: partnerData.id,
            name: partnerData.profile?.displayName || partnerData.name,
            email: partnerData.email,
            avatar: partnerData.profile?.avatar || null,
          },
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: msg.senderId !== userId && !msg.isRead ? 1 : 0,
        };
      } else if (msg.senderId !== userId && !msg.isRead) {
        conversations[partnerId].unreadCount += 1;
      }
    }

    return c.json(Object.values(conversations));
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// GET /api/messages/unread-count - Get total unread message count
messagesRoutes.get('/unread-count', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return c.json({ unreadCount });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return c.json({ error: 'Failed to get unread count' }, 500);
  }
});

// PUT /api/messages/conversation/:userId/read - Mark all messages from user as read
messagesRoutes.put('/conversation/:userId/read', async (c: any) => {
  try {
    const currentUserId = c.req.header('X-User-Id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const otherUserId = c.req.param('userId');
    
    // Mark all unread messages from the other user as read
    const result = await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return c.json({ marked: result.count });
  } catch (error) {
    console.error('Failed to mark conversation as read:', error);
    return c.json({ error: 'Failed to mark conversation as read' }, 500);
  }
});

// PUT /api/messages/:id/read - Mark message as read
messagesRoutes.put('/:id/read', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id } = c.req.param();

    const message = await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return c.json(message);
  } catch (error: any) {
    return c.json({ error: 'Failed to mark message as read' }, 500);
  }
});

// PUT /api/messages/:id - Edit message
messagesRoutes.put('/:id', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id } = c.req.param();
    const body: any = await c.req.json();
    const parsed = editMessageSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid message data' }, 400);

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return c.json({ error: 'Message not found' }, 404);
    if (message.senderId !== userId) return c.json({ error: 'Unauthorized' }, 403);

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content: parsed.data.content,
        editedAt: new Date(),
      },
    });

    return c.json(updated);
  } catch (error: any) {
    return c.json({ error: 'Failed to edit message' }, 500);
  }
});

// DELETE /api/messages/:id - Delete message
messagesRoutes.delete('/:id', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id } = c.req.param();

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return c.json({ error: 'Message not found' }, 404);
    if (message.senderId !== userId) return c.json({ error: 'Unauthorized' }, 403);

    await prisma.message.delete({ where: { id } });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

export default messagesRoutes;
