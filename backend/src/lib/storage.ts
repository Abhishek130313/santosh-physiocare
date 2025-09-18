import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { encryptBufferAesGcm } from './crypto.js';

const endpoint = `http://${process.env.MINIO_ENDPOINT}`;

export const s3 = new S3Client({
  region: 'us-east-1',
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin'
  }
});

export async function putEncryptedObject(bucket: string, key: string, data: Buffer, contentType: string) {
  const { iv, tag, encrypted } = encryptBufferAesGcm(data);
  const body = Buffer.concat([iv, tag, encrypted]);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: { enc: 'aes-256-gcm' }
  }));
}