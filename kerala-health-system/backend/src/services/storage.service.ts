import { Client as MinioClient } from 'minio';
import { config } from '@/config/config';
import { simpleEncrypt, generateToken } from '@/utils/crypto';
import { logger } from '@/config/logger';

export interface UploadOptions {
  filename: string;
  contentType: string;
  patientId?: string;
  encounterId?: string;
  encrypt?: boolean;
}

export class StorageService {
  private minioClient: MinioClient;
  private bucketName: string;

  constructor() {
    this.minioClient = new MinioClient({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
    
    this.bucketName = config.minio.bucket;
    this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        logger.info(`Created MinIO bucket: ${this.bucketName}`);
      }
    } catch (error) {
      logger.error('Error ensuring MinIO bucket exists:', error);
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    options: UploadOptions
  ): Promise<string> {
    try {
      // Generate unique storage key
      const timestamp = Date.now();
      const random = generateToken(8);
      const sanitizedFilename = options.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      let storageKey = `${timestamp}-${random}-${sanitizedFilename}`;
      
      // Add patient/encounter prefix for organization
      if (options.patientId) {
        storageKey = `patients/${options.patientId}/${storageKey}`;
      } else if (options.encounterId) {
        storageKey = `encounters/${options.encounterId}/${storageKey}`;
      } else {
        storageKey = `general/${storageKey}`;
      }

      // Encrypt file content if requested (default: true)
      let finalBuffer = fileBuffer;
      if (options.encrypt !== false) {
        const encryptedContent = simpleEncrypt(fileBuffer.toString('base64'));
        finalBuffer = Buffer.from(encryptedContent);
      }

      // Upload to MinIO
      await this.minioClient.putObject(
        this.bucketName,
        storageKey,
        finalBuffer,
        finalBuffer.length,
        {
          'Content-Type': options.contentType,
          'X-Original-Filename': options.filename,
          'X-Patient-Id': options.patientId || '',
          'X-Encounter-Id': options.encounterId || '',
          'X-Upload-Time': new Date().toISOString(),
          'X-Encrypted': options.encrypt !== false ? 'true' : 'false',
        }
      );

      logger.info(`File uploaded successfully: ${storageKey}`, {
        patientId: options.patientId,
        encounterId: options.encounterId,
        filename: options.filename,
        size: fileBuffer.length,
      });

      return storageKey;
    } catch (error) {
      logger.error('Error uploading file to MinIO:', error);
      throw new Error('Failed to upload file');
    }
  }

  async downloadFile(storageKey: string): Promise<{
    buffer: Buffer;
    metadata: any;
  }> {
    try {
      // Get object metadata
      const stat = await this.minioClient.statObject(this.bucketName, storageKey);
      
      // Download file
      const stream = await this.minioClient.getObject(this.bucketName, storageKey);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Decrypt if encrypted
      let finalBuffer = buffer;
      if (stat.metaData['x-encrypted'] === 'true') {
        try {
          const decryptedContent = simpleDecrypt(buffer.toString());
          finalBuffer = Buffer.from(decryptedContent, 'base64');
        } catch (decryptError) {
          logger.error('Error decrypting file:', decryptError);
          throw new Error('Failed to decrypt file');
        }
      }

      return {
        buffer: finalBuffer,
        metadata: stat.metaData,
      };
    } catch (error) {
      logger.error(`Error downloading file from MinIO: ${storageKey}`, error);
      throw new Error('Failed to download file');
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, storageKey);
      logger.info(`File deleted successfully: ${storageKey}`);
    } catch (error) {
      logger.error(`Error deleting file from MinIO: ${storageKey}`, error);
      throw new Error('Failed to delete file');
    }
  }

  async getFileUrl(storageKey: string, expirySeconds: number = 3600): Promise<string> {
    try {
      // Generate presigned URL for temporary access
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        storageKey,
        expirySeconds
      );
      return url;
    } catch (error) {
      logger.error(`Error generating presigned URL: ${storageKey}`, error);
      throw new Error('Failed to generate file URL');
    }
  }

  async listFiles(prefix?: string): Promise<Array<{
    name: string;
    lastModified: Date;
    size: number;
    etag: string;
  }>> {
    try {
      const files: Array<{
        name: string;
        lastModified: Date;
        size: number;
        etag: string;
      }> = [];

      const stream = this.minioClient.listObjects(this.bucketName, prefix, true);
      
      for await (const obj of stream) {
        if (obj.name) {
          files.push({
            name: obj.name,
            lastModified: obj.lastModified,
            size: obj.size,
            etag: obj.etag,
          });
        }
      }

      return files;
    } catch (error) {
      logger.error('Error listing files from MinIO:', error);
      throw new Error('Failed to list files');
    }
  }

  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    buckets: string[];
  }> {
    try {
      const buckets = await this.minioClient.listBuckets();
      const files = await this.listFiles();
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        totalFiles: files.length,
        totalSize,
        buckets: buckets.map(bucket => bucket.name),
      };
    } catch (error) {
      logger.error('Error getting storage stats:', error);
      throw new Error('Failed to get storage statistics');
    }
  }
}