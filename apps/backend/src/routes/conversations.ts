import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';
import { z } from 'zod';

export const conversationRoutes = new Hono();

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

const createConversationSchema = z.object({
  participantId: z.string(),
  message: z.string().optional(),
});

// GET /api/conversations - Get all conversations for current user
conversationRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    profile: { select: { avatar: true } },
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });
    
    const conversations = participations.map((p) => {
      const otherParticipants = p.conversation.participants
        .filter((part) => part.userId !== userId)
        .map((part) => ({
          id: part.user.id,
          name: part.user.name,
          image: part.user.image,
          avatar: part.user.profile?.avatar,
        }));
      
      const lastMessage = p.conversation.messages[0];
      
      // Count unread messages
      const unreadCount = p.conversation.messages.filter(
        (m) => m.senderId !== userId && (!m.readAt || m.createdAt > (p.lastReadAt || new Date(0)))
      ).length;
      
      return {
        id: p.conversation.id,
        participants: otherParticipants,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt.toISOString(),
        } : null,
        unreadCount,
        createdAt: p.conversation.createdAt.toISOString(),
        updatedAt: p.conversation.updatedAt.toISOString(),
      };
    });
    
    return c.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// GET /api/conversations/:id/messages - Get messages in a conversation
conversationRoutes.get('/:id/messages', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const conversationId = c.req.param('id');
    
    // Verify user is a participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    
    if (!participation) {
      return c.json({ error: 'Not a participant' }, 403);
    }
    
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: { select: { avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    
    // Update last read timestamp
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    
    return c.json(messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      readAt: m.readAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
      sender: {
        id: m.sender.id,
        name: m.sender.name,
        image: m.sender.image,
        avatar: m.sender.profile?.avatar,
      },
    })));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// POST /api/conversations/:id/messages - Send a message
conversationRoutes.post('/:id/messages', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const conversationId = c.req.param('id');
    const body = await c.req.json();
    const parsed = sendMessageSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid message' }, 400);
    }
    
    // Verify user is a participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    
    if (!participation) {
      return c.json({ error: 'Not a participant' }, 403);
    }
    
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: parsed.data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: { select: { avatar: true } },
          },
        },
      },
    });
    
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    
    // Update sender's message count
    await prisma.profile.update({
      where: { userId },
      data: { messagesSent: { increment: 1 } },
    });
    
    // Notify other participants via WebSocket
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    });
    
    const messageData = {
      type: 'new_message',
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          image: message.sender.image,
          avatar: message.sender.profile?.avatar,
        },
      },
    };
    
    participants.forEach((p) => {
      broadcastToUser(p.userId, messageData);
    });
    
    return c.json({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      readAt: null,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        image: message.sender.image,
        avatar: message.sender.profile?.avatar,
      },
    }, 201);
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// POST /api/conversations - Create new conversation
conversationRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const parsed = createConversationSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid data' }, 400);
    }
    
    const { participantId, message } = parsed.data;
    
    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
    });
    
    if (existingConversation) {
      return c.json({ id: existingConversation.id, exists: true });
    }
    
    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: participantId },
          ],
        },
      },
    });
    
    // Send initial message if provided
    if (message) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: message,
        },
      });
    }
    
    return c.json({ id: conversation.id, exists: false }, 201);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

// POST /api/conversations/:id/mark-read - Mark all messages as read
conversationRoutes.post('/:id/mark-read', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const conversationId = c.req.param('id');
    
    // Mark all unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    
    // Update last read timestamp
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    
    // Notify sender that messages were read
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    });
    
    participants.forEach((p) => {
      broadcastToUser(p.userId, {
        type: 'messages_read',
        conversationId,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});
