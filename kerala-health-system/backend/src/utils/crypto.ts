import crypto from 'crypto';
import { config } from '@/config/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16
const TAG_LENGTH = 16; // For GCM, this is always 16
const KEY = Buffer.from(config.encryption.key, 'utf8').slice(0, 32); // Ensure 32 bytes

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export const encrypt = (text: string): EncryptedData => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher(ALGORITHM, KEY);
  cipher.setAAD(Buffer.from('kerala-health', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
};

export const decrypt = (encryptedData: EncryptedData): string => {
  const { encrypted, iv, tag } = encryptedData;
  
  const decipher = crypto.createDecipher(ALGORITHM, KEY);
  decipher.setAAD(Buffer.from('kerala-health', 'utf8'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Simple encrypt/decrypt for file names and simple data
export const simpleEncrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipherGCM(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
};

export const simpleDecrypt = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  
  const decipher = crypto.createDecipherGCM(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Hash functions for audit trail
export const createHash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const createHashWithSalt = (data: string, salt?: string): { hash: string; salt: string } => {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(data + actualSalt).digest('hex');
  return { hash, salt: actualSalt };
};

export const verifyHash = (data: string, hash: string, salt: string): boolean => {
  const computedHash = crypto.createHash('sha256').update(data + salt).digest('hex');
  return computedHash === hash;
};

// Generate secure random tokens
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate QR code payload with signature
export const generateQRPayload = (patientId: string, timestamp?: Date): string => {
  const ts = timestamp || new Date();
  const data = `${patientId}:${ts.getTime()}`;
  const signature = crypto.createHmac('sha256', config.jwt.secret).update(data).digest('hex');
  
  return Buffer.from(`${data}:${signature}`).toString('base64');
};

export const verifyQRPayload = (payload: string): { patientId: string; timestamp: Date; valid: boolean } => {
  try {
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const parts = decoded.split(':');
    
    if (parts.length !== 3) {
      return { patientId: '', timestamp: new Date(), valid: false };
    }
    
    const [patientId, timestampStr, signature] = parts;
    const timestamp = new Date(parseInt(timestampStr, 10));
    
    const expectedSignature = crypto.createHmac('sha256', config.jwt.secret)
      .update(`${patientId}:${timestampStr}`)
      .digest('hex');
    
    const valid = signature === expectedSignature;
    
    return { patientId, timestamp, valid };
  } catch (error) {
    return { patientId: '', timestamp: new Date(), valid: false };
  }
};