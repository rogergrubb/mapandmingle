import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth';

// Define context variables type
type Variables = {
  userId: string;
};

export const uploadRoutes = new Hono<{ Variables: Variables }>();

// Initialize S3 client (optional - can use local storage for dev)
console.log('S3 Config Check:', {
  hasAccessKeyId: !!config.aws.accessKeyId,
  region: config.aws.region,
  bucketName: config.aws.s3BucketName,
});

const s3Client = config.aws.accessKeyId ? new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
}) : null;

console.log('S3 Client initialized:', !!s3Client);

const BUCKET_NAME = config.aws.s3BucketName;
const CDN_URL = config.aws.cdnUrl || `https://${BUCKET_NAME}.s3.${config.aws.region}.amazonaws.com`;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Profile photo upload (specific endpoint for profile photos)
uploadRoutes.post('/profile', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized - please log in' }, 401);
    }

    const formData = await c.req.formData();
    // Accept both 'photo' and 'file' field names for compatibility
    const file = (formData.get('photo') || formData.get('file')) as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'File too large. Maximum 10MB' }, 400);
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `profiles/${userId}/${nanoid()}.${ext}`;

    if (s3Client) {
      // Upload to S3
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'max-age=31536000',
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

      // Update user's profile image
      await prisma.user.update({
        where: { id: userId },
        data: { image: url },
      });

      // Also update profile avatar if exists
      try {
        await prisma.profile.update({
          where: { userId },
          data: { avatar: url },
        });
      } catch {
        // Profile might not exist yet, that's ok
      }

      return c.json({ url, key });
    } else {
      // No S3 configured - convert to base64 data URL for demo/development
      console.log('S3 not configured, using base64 fallback for user:', userId);
      
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      console.log('Generated data URL, length:', dataUrl.length);

      // Update user's profile image with data URL
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { image: dataUrl },
        });
        console.log('Updated user image');
      } catch (userError) {
        console.error('Failed to update user image:', userError);
        throw userError;
      }

      // Also update profile avatar if exists
      try {
        await prisma.profile.update({
          where: { userId },
          data: { avatar: dataUrl },
        });
        console.log('Updated profile avatar');
      } catch (profileError) {
        // Profile might not exist yet, that's ok
        console.log('Profile update skipped (may not exist):', profileError);
      }

      return c.json({ 
        url: dataUrl, 
        key: `local-${nanoid()}`,
        message: 'Photo stored as data URL (S3 not configured)'
      });
    }
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return c.json({ error: 'Failed to upload profile photo', details: String(error) }, 500);
  }
});

// Get presigned upload URL
uploadRoutes.post('/presigned', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
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
    const key = `${folder}/${userId}/${nanoid()}.${ext}`;

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
        uploadUrl: `/api/upload`,
        fileUrl: `/uploads/${key}`,
        key,
        message: 'S3 not configured - use direct upload instead'
      });
    }
  } catch (error) {
    console.error('Presigned URL error:', error);
    return c.json({ error: 'Failed to generate upload URL' }, 500);
  }
});

// Direct upload (for development or small files)
uploadRoutes.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = (formData.get('file') || formData.get('photo')) as File;
    
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
    const key = `${folder}/${userId}/${nanoid()}.${ext}`;

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
      // No S3 - use base64 data URL
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      return c.json({ url: dataUrl, key: `local-${nanoid()}` });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Delete upload
uploadRoutes.delete('/:key', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
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
uploadRoutes.get('/my-uploads', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
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
