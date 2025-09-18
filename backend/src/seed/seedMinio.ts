import { s3 } from '../lib/storage.js';
import { PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

async function main() {
  const bucket = process.env.MINIO_BUCKET || 'attachments';
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: 'readme.txt', Body: Buffer.from('MinIO ready'), ContentType: 'text/plain' }));
  console.log('MinIO seeded');
}

main().catch(err => { console.error(err); process.exit(1); });