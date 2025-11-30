import { Hono } from 'hono';
import { db } from '../db';
import { uploadToS3 } from '../lib/s3';
import { verifyAuth } from '../middleware/auth';

const app = new Hono();

// POST /api/mingles/draft - Save draft
app.post('/draft', verifyAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const formData = await c.req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const locationName = formData.get('locationName') as string;
    const maxParticipants = formData.get('maxParticipants') as string;
    const privacy = formData.get('privacy') as string;
    const tags = formData.get('tags') as string;
    const photo = formData.get('photo') as File | null;

    let photoUrl = null;
    if (photo) {
      const buffer = await photo.arrayBuffer();
      photoUrl = await uploadToS3(
        `mingles/${userId}/${Date.now()}.jpg`,
        Buffer.from(buffer),
        'image/jpeg'
      );
    }

    const mingle = await db.mingleEvent.create({
      data: {
        hostId: userId,
        title,
        description,
        latitude,
        longitude,
        locationName,
        maxParticipants: parseInt(maxParticipants),
        status: 'draft',
        isActive: false,
        isDraft: true,
        privacy,
        tags,
        photoUrl,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60000),
        intentCard: 'ready-to-mingle',
      },
    });

    return c.json({ success: true, mingleId: mingle.id });
  } catch (error) {
    console.error('Draft creation error:', error);
    return c.json({ error: 'Failed to save draft' }, 400);
  }
});

// POST /api/mingles - Create live mingle
app.post('/', verifyAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const formData = await c.req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const locationName = formData.get('locationName') as string;
    const maxParticipants = formData.get('maxParticipants') as string;
    const privacy = formData.get('privacy') as string;
    const tags = formData.get('tags') as string;
    const startTime = new Date(formData.get('startTime') as string);
    const endTime = new Date(formData.get('endTime') as string);
    const photo = formData.get('photo') as File | null;

    let photoUrl = null;
    if (photo) {
      const buffer = await photo.arrayBuffer();
      photoUrl = await uploadToS3(
        `mingles/${userId}/${Date.now()}.jpg`,
        Buffer.from(buffer),
        'image/jpeg'
      );
    }

    const mingle = await db.mingleEvent.create({
      data: {
        hostId: userId,
        title,
        description,
        latitude,
        longitude,
        locationName,
        maxParticipants: parseInt(maxParticipants),
        status: 'live',
        isActive: true,
        isDraft: false,
        privacy,
        tags,
        photoUrl,
        startTime,
        endTime,
        intentCard: 'ready-to-mingle',
      },
    });

    return c.json({ success: true, mingleId: mingle.id });
  } catch (error) {
    console.error('Mingle creation error:', error);
    return c.json({ error: 'Failed to create mingle' }, 400);
  }
});

// GET /api/mingles/:id - Get mingle details
app.get('/:id', async (c) => {
  try {
    const mingleId = c.req.param('id');
    const mingle = await db.mingleEvent.findUnique({
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
        participants: true,
      },
    });

    if (!mingle) return c.json({ error: 'Not found' }, 404);
    return c.json(mingle);
  } catch (error) {
    return c.json({ error: 'Failed to fetch mingle' }, 400);
  }
});

// GET /api/mingles - List mingles (map view)
app.get('/', async (c) => {
  try {
    const lat = parseFloat(c.req.query('lat') || '0');
    const lng = parseFloat(c.req.query('lng') || '0');
    const radius = parseInt(c.req.query('radius') || '5000');

    const mingles = await db.mingleEvent.findMany({
      where: {
        status: 'live',
        isActive: true,
        privacy: { in: ['public'] }, // Only show public mingles on map
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(mingles);
  } catch (error) {
    return c.json({ error: 'Failed to fetch mingles' }, 400);
  }
});

// PUT /api/mingles/:id/publish - Publish draft
app.put('/:id/publish', verifyAuth, async (c) => {
  try {
    const mingleId = c.req.param('id');
    const userId = c.get('userId');

    const mingle = await db.mingleEvent.findUnique({
      where: { id: mingleId },
    });

    if (!mingle || mingle.hostId !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updated = await db.mingleEvent.update({
      where: { id: mingleId },
      data: {
        status: 'live',
        isActive: true,
        isDraft: false,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60000),
      },
    });

    return c.json({ success: true, mingle: updated });
  } catch (error) {
    return c.json({ error: 'Failed to publish mingle' }, 400);
  }
});

// PUT /api/mingles/:id/end - End mingle
app.put('/:id/end', verifyAuth, async (c) => {
  try {
    const mingleId = c.req.param('id');
    const userId = c.get('userId');

    const mingle = await db.mingleEvent.findUnique({
      where: { id: mingleId },
    });

    if (!mingle || mingle.hostId !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updated = await db.mingleEvent.update({
      where: { id: mingleId },
      data: {
        status: 'ended',
        isActive: false,
      },
    });

    return c.json({ success: true, mingle: updated });
  } catch (error) {
    return c.json({ error: 'Failed to end mingle' }, 400);
  }
});

export default app;