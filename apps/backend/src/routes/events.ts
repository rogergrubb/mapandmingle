import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const events = new Hono();

// Helper function to safely parse array
function ensureArray(value: any): string[] {
  if (!value) return ['social'];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return [value];
  return ['social'];
}

// Helper function to safely parse number
function safeParseNumber(value: any): number {
  const num = parseFloat(String(value));
  return isNaN(num) ? 0 : num;
}

// Helper function to safely parse integer
function safeParseInt(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseInt(String(value));
  return isNaN(num) ? null : num;
}

// POST /api/events - Create new event
events.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    
    console.log('📝 Event creation request:', JSON.stringify(body, null, 2));
    
    // Extract and validate required fields
    const title = body.title;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return c.json({ error: 'Title is required' }, 400);
    }
    
    // Extract all fields with safe defaults
    const description = body.description || '';
    const categories = ensureArray(body.categories);
    const latitude = safeParseNumber(body.latitude);
    const longitude = safeParseNumber(body.longitude);
    const venueName = body.venueName || 'Location to be announced';
    const address = body.address || null;
    const isPublic = body.isPublic !== false; // Default to true
    const image = body.image || null;
    const schoolAffiliation = body.schoolAffiliation || null;
    const maxAttendees = safeParseInt(body.maxAttendees);
    
    // Parse and validate dates
    if (!body.startTime) {
      return c.json({ error: 'Start time is required' }, 400);
    }
    
    const startTime = new Date(body.startTime);
    if (isNaN(startTime.getTime())) {
      return c.json({ 
        error: 'Invalid start time format',
        received: body.startTime
      }, 400);
    }
    
    let endTime = null;
    if (body.endTime) {
      endTime = new Date(body.endTime);
      if (isNaN(endTime.getTime())) {
        console.warn('Invalid end time, setting to null:', body.endTime);
        endTime = null;
      }
    }
    
    console.log('✅ Validated data:', {
      title,
      description,
      categories,
      latitude,
      longitude,
      venueName,
      address,
      startTime: startTime.toISOString(),
      endTime: endTime?.toISOString(),
      maxAttendees,
      isPublic,
    });
    
    // Create event with fully validated data
    const event = await prisma.event.create({
      data: {
        userId,
        title: title.trim(),
        description: description.trim(),
        categories,
        latitude,
        longitude,
        venueName,
        address,
        startTime,
        endTime,
        maxAttendees,
        isPublic,
        image,
        schoolAffiliation,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true,
            isPremium: true,
            isVerified: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
    
    console.log('🎉 Event created successfully:', event.id);
    
    return c.json(event, 201);
  } catch (error: any) {
    console.error('❌ Event creation error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Return detailed error for debugging
    return c.json({ 
      error: 'Failed to create event',
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, 500);
  }
});

// GET /api/events - Get all events
events.get('/', async (c) => {
  try {
    const { schoolAffiliation, upcoming, limit = '50' } = c.req.query();
    
    const where: any = {};
    
    if (schoolAffiliation) {
      where.schoolAffiliation = schoolAffiliation;
    }
    
    if (upcoming) {
      where.startTime = {
        gte: new Date(),
      };
    }
    
    const events = await prisma.event.findMany({
      where,
      take: parseInt(limit),
      orderBy: {
        startTime: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true,
            isPremium: true,
            isVerified: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            attendees: true,
            comments: true,
          },
        },
      },
    });
    
    // Add attendeeCount to each event
    const eventsWithCount = events.map(event => ({
      ...event,
      attendeeCount: event._count.attendees,
    }));
    
    return c.json(eventsWithCount);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

export default events;
