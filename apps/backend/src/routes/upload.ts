import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export const uploadRoutes = new Hono();

// Initialize S3 client (optional - can use local storage for dev)
const s3Client = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null;

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mapmingle-uploads';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Get presigned upload URL
uploadRoutes.post('/presigned', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { filename, contentType, folder = 'general' } = body;

    if (!ALLOWED_TYPES.includes(contentType)) {
      return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }, 400);
    }

    // Generate unique filename
    const ext = filename.split('.').pop() || 'jpg';
    const key = `${folder}/${userId}/${uuidv4()}.${ext}`;

    if (s3Client) {
      // Use S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return c.json({
        uploadUrl: signedUrl,
        fileUrl: `${CDN_URL}/${key}`,
        key,
      });
    } else {
      // Local development - return mock URL
      return c.json({
        uploadUrl: `http://localhost:3000/api/upload/local`,
        fileUrl: `http://localhost:3000/uploads/${key}`,
        key,
      });
    }
  } catch (error) {
    console.error('Presigned URL error:', error);
    return c.json({ error: 'Failed to generate upload URL' }, 500);
  }
});

// Direct upload (for development or small files)
uploadRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: 'Invalid file type' }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'File too large. Maximum 10MB' }, 400);
    }

    const folder = (formData.get('folder') as string) || 'general';
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `${folder}/${userId}/${uuidv4()}.${ext}`;

    if (s3Client) {
      // Upload to S3
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'max-age=31536000', // 1 year
      }));

      const url = `${CDN_URL}/${key}`;

      // Save to database
      await prisma.upload.create({
        data: {
          userId,
          key,
          url,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        },
      });

      return c.json({ url, key });
    } else {
      // Local development - save to disk
      // In production, always use S3 or similar
      const url = `http://localhost:3000/uploads/${key}`;
      
      return c.json({ url, key });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Delete upload
uploadRoutes.delete('/:key', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const key = c.req.param('key');

    // Verify ownership
    const upload = await prisma.upload.findFirst({
      where: { key, userId },
    });

    if (!upload) {
      return c.json({ error: 'Upload not found' }, 404);
    }

    if (s3Client) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
    }

    await prisma.upload.delete({
      where: { id: upload.id },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

// Get user's uploads
uploadRoutes.get('/my-uploads', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const uploads = await prisma.upload.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return c.json({ uploads });
  } catch (error) {
    console.error('Get uploads error:', error);
    return c.json({ error: 'Failed to get uploads' }, 500);
  }
});
