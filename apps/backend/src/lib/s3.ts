import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId || '',
    secretAccessKey: config.aws.secretAccessKey || '',
  },
});

export async function uploadToS3(
  fileData: Buffer | ArrayBuffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<string> {
  try {
    // Convert ArrayBuffer to Buffer if needed
    const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);

    const command = new PutObjectCommand({
      Bucket: config.aws.s3BucketName,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return the public URL
    const url = `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${fileName}`;
    return url;
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
