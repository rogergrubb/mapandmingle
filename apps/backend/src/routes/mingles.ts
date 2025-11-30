import { Hono } from 'hono';
import { prisma } from '../index';
import { uploadToS3 } from '../lib/s3';

export const mingleRoutes = new Hono();

const INTENT_CARDS = [
  { id: 'walk_and_talk', label: 'Walk and talk', emoji: '🚶' },
  { id: 'dog_owners', label: 'Dog owners welcome', emoji: '🐕' },
  { id: 'coffee_chat', label: 'Coffee chat', emoji: '☕' },
  { id: 'workout_buddy', label: 'Workout buddy', emoji: '💪' },
  { id: 'brainstorm', label: 'Brainstorm session', emoji: '💡' },
  { id: 'deep_conversation', label: 'Deep conversation only', emoji: '🧠' },
  { id: 'casual_hangout', label: 'Casual hangout', emoji: '😎' },
  { id: 'food', label: 'Looking for food', emoji: '🍕' },
  { id: 'study', label: 'Study session', emoji: '📚' },
  { id: 'photography', label: 'Photography walk', emoji: '📷' },
  { id: 'music', label: 'Live music', emoji: '🎵' },
  { id: 'bar_hopping', label: 'Bar hopping', emoji: '🍻' },
  { id: 'creative', label: 'Creative collaboration', emoji: '🎨' },
  { id: 'exploring', label: 'Just exploring', emoji: '🗺️' },
];


// Helper function for distance calculation (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// GET /api/mingles/search - Advanced search with filters by tags, location, privacy
mingleRoutes.get('/search', async (c) => {
  try {
    const latitude = parseFloat(c.req.query('latitude') || '37.7749');
    const longitude = parseFloat(c.req.query('longitude') || '-122.4194');
    const radius = parseFloat(c.req.query('radius') || '50');
    const tags = c.req.query('tags')?.split(',').filter(t => t.trim()) || [];
    const privacy = c.req.query('privacy');
    const sortBy = c.req.query('sort') || 'distance';
    
    const whereConditions: any = {
      isDraft: false,
      isActive: true,
      status: { in: ['scheduled', 'live'] },
      startTime: { gte: new Date() },
    };
    
    // Only show public mingles by default, or user's own private mingles
    if (privacy === 'all') {
      // Show all
    } else if (privacy === 'friends') {
      whereConditions.privacy = { in: ['public', 'friends'] };
    } else {
      whereConditions.privacy = 'public';
    }
    
    // Filter by tags if provided
    if (tags.length > 0) {
      whereConditions.tags = { hasSome: tags };
    }
    
    const mingles = await prisma.mingleEvent.findMany({
      where: whereConditions,
      include: {
        host: { 
          select: { 
            id: true, 
            name: true, 
            image: true,
            username: true,
            profile: { select: { displayName: true, bio: true, avatar: true } }
          },
        },
        _count: { select: { participants: true } },
      },
      take: 100,
    });
    
    // Calculate distances and filter by radius
    const withDistance = mingles
      .map(m => ({
        ...m,
        distance: calculateDistance(latitude, longitude, m.latitude, m.longitude)
      }))
      .filter(m => m.distance <= radius);
    
    // Sort
    const sorted = withDistance.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'recent') return b.startTime.getTime() - a.startTime.getTime();
      if (sortBy === 'popular') return b._count.participants - a._count.participants;
      return 0;
    });
    
    return c.json(sorted.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      latitude: m.latitude,
      longitude: m.longitude,
      locationName: m.locationName,
      tags: m.tags,
      privacy: m.privacy,
      startTime: m.startTime.toISOString(),
      maxParticipants: m.maxParticipants,
      participantCount: m._count.participants,
      distance: m.distance,
      photoUrl: m.photoUrl,
      host: {
        id: m.host.id,
        name: m.host.name,
        image: m.host.image,
        username: m.host.username,
        displayName: m.host.profile?.displayName,
        bio: m.host.profile?.bio,
        avatar: m.host.profile?.avatar,
      },
    })));
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// GET /api/mingles/intent-cards
mingleRoutes.get('/intent-cards', (c) => c.json(INTENT_CARDS));

// GET /api/mingles - Get nearby mingles (only active, non-draft)
mingleRoutes.get('/', async (c) => {
  try {
    const lat = parseFloat(c.req.query('latitude') || '0');
    const lng = parseFloat(c.req.query('longitude') || '0');
    
    const mingles = await prisma.mingleEvent.findMany({
      where: {
        isDraft: false, // Only show published mingles
        isActive: true, // Only show active mingles
        status: { in: ['scheduled', 'live'] },
        startTime: { gte: new Date() },
      },
      include: {
        host: { select: { id: true, name: true, image: true, profile: { select: { displayName: true } } } },
        _count: { select: { participants: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 30,
    });
    
    return c.json(mingles.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      intentCard: m.intentCard,
      latitude: m.latitude,
      longitude: m.longitude,
      locationName: m.locationName,
      radius: m.radius,
      startTime: m.startTime.toISOString(),
      duration: m.duration,
      status: m.status,
      maxParticipants: m.maxParticipants,
      participantCount: m._count.participants,
      photoUrl: m.photoUrl,
      privacy: m.privacy,
      tags: m.tags,
      host: m.host,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch mingles' }, 500);
  }
});

// POST /api/mingles/draft - Save mingle as draft
mingleRoutes.post('/draft', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const formData = await c.req.formData();
    const description = formData.get('description') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const locationName = formData.get('locationName') as string;
    const maxParticipants = formData.get('maxParticipants') as string;
    const privacy = (formData.get('privacy') as string) || 'public';
    const tags = (formData.get('tags') as string || '').split(' ').filter(t => t);
    const photoFile = formData.get('photo') as File | null;

    let photoUrl = null;
    if (photoFile) {
      const buffer = await photoFile.arrayBuffer();
      photoUrl = await uploadToS3(buffer, `mingles/${userId}/${Date.now()}.jpg`);
    }

    const mingle = await prisma.mingleEvent.create({
      data: {
        hostId: userId,
        title: 'Ready to Mingle',
        description,
        latitude,
        longitude,
        locationName,
        maxParticipants: parseInt(maxParticipants) || null,
        privacy,
        tags,
        photoUrl,
        isDraft: true, // This is a draft
        isActive: true,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60000),
        duration: 30,
        status: 'live',
        intentCard: 'spontaneous_mingle',
      },
    });

    // Log to admin tracking (invisible to users)
    await prisma.report.create({
      data: {
        type: 'mingle_draft_created',
        initiatorId: userId,
        targetId: mingle.id,
        reason: `Draft mingle created: ${description?.substring(0, 100)}`,
        status: 'open',
        adminNotes: `User: ${userId}, Location: ${locationName}, Privacy: ${privacy}, Tags: ${tags.join(', ')}, Photo: ${photoUrl ? 'Yes' : 'No'}`,
      },
    });

    return c.json({ id: mingle.id, isDraft: true }, 201);
  } catch (error: any) {
    console.error('Draft creation error:', error);
    return c.json({ error: 'Failed to save draft' }, 500);
  }
});

// POST /api/mingles - Create/publish mingle from draft or new
mingleRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const formData = await c.req.formData();
    const description = formData.get('description') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const locationName = formData.get('locationName') as string;
    const maxParticipants = formData.get('maxParticipants') as string;
    const privacy = (formData.get('privacy') as string) || 'public';
    const tags = (formData.get('tags') as string || '').split(' ').filter(t => t);
    const photoFile = formData.get('photo') as File | null;

    if (!description || description.trim().length === 0) {
      return c.json({ error: 'Description is required' }, 400);
    }

    let photoUrl = null;
    if (photoFile) {
      const buffer = await photoFile.arrayBuffer();
      photoUrl = await uploadToS3(buffer, `mingles/${userId}/${Date.now()}.jpg`);
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    const mingle = await prisma.mingleEvent.create({
      data: {
        hostId: userId,
        title: 'Ready to Mingle',
        description,
        latitude,
        longitude,
        locationName,
        maxParticipants: parseInt(maxParticipants) || null,
        privacy,
        tags,
        photoUrl,
        isDraft: false, // Published
        isActive: true,
        startTime,
        endTime,
        duration: 30,
        status: 'live',
        intentCard: 'spontaneous_mingle',
      },
    });

    // Auto-confirm host as participant
    await prisma.mingleParticipant.create({
      data: { mingleId: mingle.id, userId, status: 'confirmed' },
    });

    // Get user info for admin tracking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, name: true, email: true },
    });

    // Log to admin tracking (invisible to users) - comprehensive data recording
    await prisma.report.create({
      data: {
        type: 'mingle_published',
        initiatorId: userId,
        targetId: mingle.id,
        reason: `Spontaneous mingle published: ${description?.substring(0, 100)}`,
        status: 'open',
        adminNotes: `
Username: ${user?.username || 'N/A'}
Name: ${user?.name || 'N/A'}
Email: ${user?.email || 'N/A'}
Mingle ID: ${mingle.id}
Description: ${description}
Location: ${locationName}
Coordinates: ${latitude}, ${longitude}
Privacy: ${privacy}
Tags: ${tags.join(', ')}
Max Participants: ${maxParticipants || 'Unlimited'}
Photo: ${photoUrl ? 'Yes - ' + photoUrl : 'No'}
Start Time: ${startTime.toISOString()}
End Time: ${endTime.toISOString()}
Status: Live
Created At: ${new Date().toISOString()}
        `.trim(),
      },
    });

    return c.json({ 
      id: mingle.id, 
      isDraft: false,
      message: 'Your mingle is now live! 🔥'
    }, 201);
  } catch (error: any) {
    console.error('Mingle creation error:', error);
    return c.json({ error: 'Failed to create mingle' }, 500);
  }
});

// GET /api/mingles/user/drafts - Get user's draft mingles
mingleRoutes.get('/user/drafts', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const drafts = await prisma.mingleEvent.findMany({
      where: {
        hostId: userId,
        isDraft: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(drafts);
  } catch (error) {
    return c.json({ error: 'Failed to fetch drafts' }, 500);
  }
});

// GET /api/mingles/:id - Get mingle details
mingleRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    const mingleId = c.req.param('id');
    
    const mingle = await prisma.mingleEvent.findUnique({
      where: { id: mingleId },
      include: {
        host: { 
          select: { 
            id: true, 
            name: true, 
            image: true,
            username: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });
    
    if (!mingle) {
      return c.json({ error: 'Mingle not found' }, 404);
    }

    // Check if user has RSVP'd
    let userRsvp = null;
    if (userId) {
      const participant = mingle.participants.find(p => p.userId === userId);
      userRsvp = participant?.status || null;
    }

    // Record view for admin tracking
    if (userId && userId !== mingle.hostId) {
      await prisma.mingleView.create({
        data: {
          mingleId,
          visitorId: userId,
        },
      });
    }
    
    return c.json({
      mingle: {
        id: mingle.id,
        title: mingle.title,
        description: mingle.description,
        intentCard: mingle.intentCard,
        latitude: mingle.latitude,
        longitude: mingle.longitude,
        locationName: mingle.locationName,
        radius: mingle.radius,
        startTime: mingle.startTime.toISOString(),
        endTime: mingle.endTime.toISOString(),
        duration: mingle.duration,
        status: mingle.status,
        maxParticipants: mingle.maxParticipants,
        photoUrl: mingle.photoUrl,
        privacy: mingle.privacy,
        tags: mingle.tags,
        isDraft: mingle.isDraft,
        isActive: mingle.isActive,
        participantCount: mingle.participants.length,
        participants: mingle.participants.map(p => ({
          userId: p.userId,
          status: p.status,
          user: p.user,
        })),
        host: {
          id: mingle.host.id,
          name: mingle.host.name,
          username: mingle.host.username,
          image: mingle.host.image,
        },
        userRsvp,
        createdAt: mingle.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching mingle:', error);
    return c.json({ error: 'Failed to fetch mingle' }, 500);
  }
});

// POST /api/mingles/:id/rsvp - RSVP to mingle
mingleRoutes.post('/:id/rsvp', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const mingleId = c.req.param('id');
    const body = await c.req.json();
    
    await prisma.mingleParticipant.upsert({
      where: { mingleId_userId: { mingleId, userId } },
      create: { mingleId, userId, status: body.status || 'interested' },
      update: { status: body.status || 'interested' },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to RSVP' }, 500);
  }
});

// PUT /api/mingles/:id - Update mingle (only drafts)
mingleRoutes.put('/:id', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const mingleId = c.req.param('id');
    
    // Check ownership
    const mingle = await prisma.mingleEvent.findUnique({
      where: { id: mingleId },
    });

    if (!mingle || mingle.hostId !== userId) {
      return c.json({ error: 'Not authorized to update this mingle' }, 403);
    }

    if (!mingle.isDraft) {
      return c.json({ error: 'Can only update draft mingles' }, 400);
    }

    const formData = await c.req.formData();
    const description = formData.get('description') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const locationName = formData.get('locationName') as string;
    const maxParticipants = formData.get('maxParticipants') as string;
    const privacy = (formData.get('privacy') as string) || mingle.privacy;
    const tags = (formData.get('tags') as string || '').split(' ').filter(t => t);
    const photoFile = formData.get('photo') as File | null;

    let photoUrl = mingle.photoUrl;
    if (photoFile) {
      const buffer = await photoFile.arrayBuffer();
      photoUrl = await uploadToS3(buffer, `mingles/${userId}/${Date.now()}.jpg`);
    }

    const updated = await prisma.mingleEvent.update({
      where: { id: mingleId },
      data: {
        description,
        latitude,
        longitude,
        locationName,
        maxParticipants: parseInt(maxParticipants) || null,
        privacy,
        tags,
        photoUrl,
      },
    });

    return c.json({ success: true, mingle: updated });
  } catch (error) {
    return c.json({ error: 'Failed to update mingle' }, 500);
  }
});

// DELETE /api/mingles/:id - Delete mingle (only drafts or by host)
mingleRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const mingleId = c.req.param('id');
    
    const mingle = await prisma.mingleEvent.findUnique({
      where: { id: mingleId },
    });

    if (!mingle || mingle.hostId !== userId) {
      return c.json({ error: 'Not authorized to delete this mingle' }, 403);
    }

    await prisma.mingleEvent.delete({
      where: { id: mingleId },
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete mingle' }, 500);
  }
});
