import { Hono } from 'hono';
import { prisma } from '../index';
import { z } from 'zod';
import { authMiddleware, getUserId } from '../middleware/auth';
import { notifyAboutEventComment } from '../services/notificationService';

export const eventRoutes = new Hono();

const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  category: z.string().min(1),
  image: z.string().optional(),
  // Support both venueName and address
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  maxAttendees: z.number().min(2).max(500).optional().nullable(),
  capacity: z.number().optional().nullable(),
  // Campus Layer
  schoolAffiliation: z.string().optional().nullable(),
  // Additional fields from frontend
  locationType: z.string().optional(),
  virtualLink: z.string().optional(),
  visibility: z.string().optional(),
  price: z.number().optional(),
  isFree: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  recurrence: z.string().optional(),
  requireApproval: z.boolean().optional(),
  allowWaitlist: z.boolean().optional(),
  allowGuests: z.boolean().optional(),
  sendReminders: z.boolean().optional(),
});

// GET /api/events - Get events near location
eventRoutes.get('/', async (c) => {
  try {
    const lat = parseFloat(c.req.query('latitude') || '0');
    const lng = parseFloat(c.req.query('longitude') || '0');
    const radius = parseFloat(c.req.query('radius') || '50');
    const category = c.req.query('category');
    const school = c.req.query('school'); // Campus filter
    
    const now = new Date();
    
    let where: any = {
      startTime: { gte: now },
    };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    // Campus filter: show only events from user's school
    if (school && school !== 'all') {
      where.schoolAffiliation = school;
    }
    
    const events = await prisma.event.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, image: true },
        },
        _count: { select: { attendees: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 50,
    });
    
    return c.json(events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      image: e.image,
      venueName: e.venueName,
      venueAddress: e.venueAddress,
      latitude: e.latitude,
      longitude: e.longitude,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString(),
      maxAttendees: e.maxAttendees,
      schoolAffiliation: e.schoolAffiliation,
      attendeeCount: e._count.attendees,
      host: e.host,
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// POST /api/events - Create new event
eventRoutes.post('/', authMiddleware, async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const parsed = createEventSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid data', details: parsed.error.errors }, 400);
    }
    
    const data = parsed.data;
    
    const event = await prisma.event.create({
      data: {
        hostId: userId,
        title: data.title,
        description: data.description,
        category: data.category?.toLowerCase() || 'social',
        image: data.image,
        venueName: data.venueName || data.address || 'TBD',
        venueAddress: data.venueAddress || data.address,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        maxAttendees: data.maxAttendees || data.capacity || null,
        schoolAffiliation: data.schoolAffiliation || null,
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    });
    
    // Auto-RSVP host as going
    await prisma.eventAttendee.create({
      data: {
        eventId: event.id,
        userId,
        status: 'going',
      },
    });
    
    return c.json({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      venueName: event.venueName,
      latitude: event.latitude,
      longitude: event.longitude,
      startTime: event.startTime.toISOString(),
      host: event.host,
      createdAt: event.createdAt.toISOString(),
    }, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// GET /api/events/:id - Get event details
eventRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, image: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    return c.json({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      image: event.image,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      latitude: event.latitude,
      longitude: event.longitude,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime?.toISOString(),
      maxAttendees: event.maxAttendees,
      schoolAffiliation: event.schoolAffiliation,
      host: event.host,
      attendees: event.attendees.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        image: a.user.image,
        status: a.status,
      })),
      createdAt: event.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return c.json({ error: 'Failed to fetch event' }, 500);
  }
});

// POST /api/events/:id/rsvp - RSVP to event
eventRoutes.post('/:id/rsvp', authMiddleware, async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const eventId = c.req.param('id');
    const body = await c.req.json();
    const status = body.status || 'going';
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { attendees: true } } },
    });
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    // Check capacity
    if (event.maxAttendees && event._count.attendees >= event.maxAttendees && status === 'going') {
      return c.json({ error: 'Event is full' }, 400);
    }
    
    // Upsert RSVP
    const rsvp = await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status },
    });
    
    return c.json({ success: true, status: rsvp.status });
  } catch (error) {
    console.error('Error RSVPing to event:', error);
    return c.json({ error: 'Failed to RSVP' }, 500);
  }
});

// DELETE /api/events/:id - Delete event (host only)
eventRoutes.delete('/:id', authMiddleware, async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    
    // Verify user is the host
    const event = await prisma.event.findUnique({
      where: { id },
      select: { hostId: true },
    });
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    if (event.hostId !== userId) {
      return c.json({ error: 'Only the host can delete this event' }, 403);
    }
    
    // Delete attendees first (foreign key constraint)
    await prisma.eventAttendee.deleteMany({
      where: { eventId: id },
    });
    
    // Delete the event
    await prisma.event.delete({
      where: { id },
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

// PUT /api/events/:id - Update event (host only)
eventRoutes.put('/:id', authMiddleware, async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Verify user is the host
    const event = await prisma.event.findUnique({
      where: { id },
      select: { hostId: true },
    });
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    if (event.hostId !== userId) {
      return c.json({ error: 'Only the host can edit this event' }, 403);
    }
    
    // Update the event
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category?.toLowerCase(),
        image: body.image,
        venueName: body.venueName || body.address,
        venueAddress: body.venueAddress || body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        maxAttendees: body.maxAttendees || body.capacity,
        schoolAffiliation: body.schoolAffiliation,
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    });
    
    return c.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      venueName: updated.venueName,
      startTime: updated.startTime.toISOString(),
      host: updated.host,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// GET /api/events/:id/comments - Get event comments
eventRoutes.get('/:id/comments', async (c) => {
  try {
    const eventId = c.req.param('id');
    
    const comments = await prisma.eventComment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });
    
    return c.json(comments.map(comment => ({
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.name,
      userAvatar: comment.user.image,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return c.json([]);
  }
});

// POST /api/events/:id/comments - Add comment to event
eventRoutes.post('/:id/comments', authMiddleware, async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const eventId = c.req.param('id');
    const { text } = await c.req.json();
    
    if (!text?.trim()) {
      return c.json({ error: 'Comment text is required' }, 400);
    }
    
    // Get event for host notification
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true, title: true },
    });
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    const comment = await prisma.eventComment.create({
      data: {
        eventId,
        userId,
        text: text.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, profile: { select: { displayName: true } } },
        },
      },
    });
    
    // Notify event host (if commenter is not the host)
    if (event.hostId !== userId) {
      const commenterName = comment.user.profile?.displayName || comment.user.name || 'Someone';
      notifyAboutEventComment(
        event.hostId,
        userId,
        commenterName,
        eventId,
        event.title,
        text.trim()
      ).catch(err => console.error('Comment notification error:', err));
    }
    
    return c.json({
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.name,
      userAvatar: comment.user.image,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
});

// DELETE /api/events/:eventId/comments/:commentId - Delete comment (author or host only)
eventRoutes.delete('/:eventId/comments/:commentId', authMiddleware, async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const eventId = c.req.param('eventId');
    const commentId = c.req.param('commentId');
    
    // Get comment and event
    const comment = await prisma.eventComment.findUnique({
      where: { id: commentId },
    });
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true },
    });
    
    if (!comment || !event) {
      return c.json({ error: 'Not found' }, 404);
    }
    
    // Only comment author or event host can delete
    if (comment.userId !== userId && event.hostId !== userId) {
      return c.json({ error: 'Not authorized to delete this comment' }, 403);
    }
    
    await prisma.eventComment.delete({
      where: { id: commentId },
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }
});

// POST /api/events/:eventId/comments/:commentId/report - Report a comment
eventRoutes.post('/:eventId/comments/:commentId/report', authMiddleware, async (c) => {
  try {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const eventId = c.req.param('eventId');
    const commentId = c.req.param('commentId');
    const { reason, description } = await c.req.json();
    
    // Get the comment to find the reported user
    const comment = await prisma.eventComment.findUnique({
      where: { id: commentId },
      include: {
        user: { select: { id: true, name: true } },
        event: { select: { title: true, hostId: true } },
      },
    });
    
    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }
    
    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportedUserId: comment.userId,
        reason: reason || 'inappropriate',
        description: description || `Comment on event "${comment.event.title}": "${comment.text}"`,
        eventId,
        eventCommentId: commentId,
      },
    });
    
    // Create notification for admin (you can change this to a specific admin user ID)
    // For now, we'll just log it and the admin page will query reports
    console.log('New report created:', {
      reportId: report.id,
      reporter: userId,
      reportedUser: comment.user.name,
      eventTitle: comment.event.title,
      commentText: comment.text,
    });
    
    return c.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error('Error reporting comment:', error);
    return c.json({ error: 'Failed to submit report' }, 500);
  }
});
