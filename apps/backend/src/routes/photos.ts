import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Define context variables type for TypeScript
type Variables = {
  userId: string;
};

const photos = new Hono<{ Variables: Variables }>();

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'mapandmingle-uploads';
const MAX_PHOTOS = 25;

// All routes require authentication
photos.use('*', authMiddleware);

// GET /api/photos - Get current user's photos
photos.get('/', async (c) => {
  const userId = c.get('userId');

  const userPhotos = await prisma.userPhoto.findMany({
    where: { userId },
    orderBy: { order: 'asc' },
  });

  return c.json({ photos: userPhotos });
});

// GET /api/photos/user/:userId - Get another user's photos
photos.get('/user/:userId', async (c) => {
  const targetUserId = c.req.param('userId');

  const userPhotos = await prisma.userPhoto.findMany({
    where: { userId: targetUserId },
    orderBy: { order: 'asc' },
  });

  return c.json({ photos: userPhotos });
});

// GET /api/photos/upload-url - Get presigned URL for S3 upload
photos.get('/upload-url', async (c) => {
  const userId = c.get('userId');
  const contentType = c.req.query('contentType') || 'image/jpeg';
  const filename = c.req.query('filename') || 'photo.jpg';

  // Check photo count limit
  const photoCount = await prisma.userPhoto.count({
    where: { userId },
  });

  if (photoCount >= MAX_PHOTOS) {
    return c.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, 400);
  }

  // Generate unique key
  const timestamp = Date.now();
  const ext = filename.split('.').pop() || 'jpg';
  const key = `photos/${userId}/${timestamp}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${key}`;

  return c.json({ uploadUrl, publicUrl, key });
});

// POST /api/photos - Add a new photo to gallery
photos.post('/', async (c) => {
  const userId = c.get('userId');
  const { url, caption, width, height } = await c.req.json();

  if (!url) {
    return c.json({ error: 'url is required' }, 400);
  }

  // Check photo count limit
  const photoCount = await prisma.userPhoto.count({
    where: { userId },
  });

  if (photoCount >= MAX_PHOTOS) {
    return c.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, 400);
  }

  // Get next order number
  const lastPhoto = await prisma.userPhoto.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
  });
  const nextOrder = (lastPhoto?.order ?? -1) + 1;

  const photo = await prisma.userPhoto.create({
    data: {
      userId,
      url,
      caption,
      width,
      height,
      order: nextOrder,
    },
  });

  return c.json({ photo }, 201);
});

// PUT /api/photos/:id - Update a photo (caption, order)
photos.put('/:id', async (c) => {
  const userId = c.get('userId');
  const photoId = c.req.param('id');
  const { caption, order, isProfilePic } = await c.req.json();

  const photo = await prisma.userPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    return c.json({ error: 'Photo not found' }, 404);
  }

  if (photo.userId !== userId) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  // If setting as profile pic, unset any existing profile pic
  if (isProfilePic) {
    await prisma.userPhoto.updateMany({
      where: { userId, isProfilePic: true },
      data: { isProfilePic: false },
    });

    // Also update user's main image
    await prisma.user.update({
      where: { id: userId },
      data: { image: photo.url },
    });
  }

  const updated = await prisma.userPhoto.update({
    where: { id: photoId },
    data: {
      ...(caption !== undefined && { caption }),
      ...(order !== undefined && { order }),
      ...(isProfilePic !== undefined && { isProfilePic }),
    },
  });

  return c.json({ photo: updated });
});

// PUT /api/photos/reorder - Reorder photos
photos.put('/reorder', async (c) => {
  const userId = c.get('userId');
  const { photoIds } = await c.req.json();

  if (!Array.isArray(photoIds)) {
    return c.json({ error: 'photoIds must be an array' }, 400);
  }

  // Update each photo's order
  await Promise.all(
    photoIds.map((id: string, index: number) =>
      prisma.userPhoto.updateMany({
        where: { id, userId },
        data: { order: index },
      })
    )
  );

  return c.json({ success: true });
});

// DELETE /api/photos/:id - Delete a photo
photos.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const photoId = c.req.param('id');

  const photo = await prisma.userPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    return c.json({ error: 'Photo not found' }, 404);
  }

  if (photo.userId !== userId) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  // Delete from S3
  try {
    const key = photo.url.split('.amazonaws.com/')[1];
    if (key) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
    }
  } catch (err) {
    console.error('Failed to delete from S3:', err);
  }

  await prisma.userPhoto.delete({
    where: { id: photoId },
  });

  return c.json({ success: true });
});

// POST /api/photos/save-from-chat - Save an image from chat to gallery
photos.post('/save-from-chat', async (c) => {
  const userId = c.get('userId');
  const { messageId, imageUrl } = await c.req.json();

  if (!imageUrl) {
    return c.json({ error: 'imageUrl is required' }, 400);
  }

  // Check photo count limit
  const photoCount = await prisma.userPhoto.count({
    where: { userId },
  });

  if (photoCount >= MAX_PHOTOS) {
    return c.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, 400);
  }

  // Verify the message exists and user is the receiver
  if (messageId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.receiverId !== userId) {
      return c.json({ error: 'Cannot save this image' }, 403);
    }
  }

  // Get next order number
  const lastPhoto = await prisma.userPhoto.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
  });
  const nextOrder = (lastPhoto?.order ?? -1) + 1;

  const photo = await prisma.userPhoto.create({
    data: {
      userId,
      url: imageUrl,
      caption: 'Saved from chat',
      order: nextOrder,
    },
  });

  return c.json({ photo, message: 'Photo saved to your gallery!' }, 201);
});

export default photos;
