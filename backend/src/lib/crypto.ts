import crypto from 'crypto';

function getMasterKey(): Buffer {
  const b64 = process.env.ENCRYPTION_MASTER_KEY_BASE64 || '';
  const raw = Buffer.from(b64, 'base64');
  if (raw.length < 32) {
    // derive 32 bytes deterministically for demo
    return crypto.createHash('sha256').update(b64 || 'dev-key').digest();
  }
  return raw.subarray(0, 32);
}

export function encryptBufferAesGcm(plain: Buffer) {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, encrypted };
}

export function decryptBufferAesGcm(iv: Buffer, tag: Buffer, encrypted: Buffer) {
  const key = getMasterKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted;
}

export function sha256Hex(buf: Buffer | string) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}