import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

const s3Client = new S3Client({
  region: config.awsRegion || 'us-east-2',
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
});

export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: config.awsBucket || 'mapandmingle-uploads',
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return the public URL
    const region = config.awsRegion || 'us-east-2';
    const bucket = config.awsBucket || 'mapandmingle-uploads';
    return `https://${bucket}.s3.${region}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error}`);
  }
}

export async function uploadImageFromUri(
  fileUri: string,
  fileName: string
): Promise<string> {
  // This is a helper for converting file URIs to buffers and uploading
  // In Node.js backend, you'd typically receive base64 or file buffer from the frontend
  // For now, this is a placeholder
  throw new Error('uploadImageFromUri requires file buffer from frontend');
}
