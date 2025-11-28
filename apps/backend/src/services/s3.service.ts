import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'mapandmingle-uploads';

export class S3Service {
  /**
   * Upload a file to S3
   * @param file - File buffer
   * @param folder - Folder path (e.g., 'profiles', 'events', 'pins')
   * @param contentType - MIME type
   * @returns Public URL of uploaded file
   */
  static async uploadFile(
    file: Buffer,
    folder: string,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const fileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return { key, url };
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Get a presigned URL for direct upload from client
   * @param folder - Folder path
   * @param contentType - MIME type
   * @param expiresIn - URL expiration in seconds (default: 5 minutes)
   * @returns Presigned URL and key
   */
  static async getPresignedUploadUrl(
    folder: string,
    contentType: string,
    expiresIn: number = 300
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const fileExtension = contentType.split('/')[1] || 'jpg';
    const fileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return { uploadUrl, key, publicUrl };
  }
}
