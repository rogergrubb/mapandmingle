import { Hono } from 'hono';
import { prisma } from '../index';
import { z } from 'zod';
import { authMiddleware, getUserId } from '../middleware/auth';

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
    
    const now = new Date();
    
    let where: any = {
      startTime: { gte: now },
    };
    
    if (category && category !== 'all') {
      where.category = category;
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

// GET /api/events/:id/comments - Get event comments
eventRoutes.get('/:id/comments', async (c) => {
  // Comments feature not yet implemented - return empty array
  return c.json([]);
});

// POST /api/events/:id/comments - Add comment to event
eventRoutes.post('/:id/comments', authMiddleware, async (c) => {
  // Comments feature not yet implemented
  return c.json({ error: 'Comments feature coming soon' }, 501);
});
