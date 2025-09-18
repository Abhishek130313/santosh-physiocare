import { prisma } from './prisma';
import { sha256Hex } from './crypto';

export async function appendAudit(eventType: string, patientId?: string, userId?: string) {
  const last = await prisma.audit.findFirst({ orderBy: { createdAt: 'desc' } });
  const prevHash = last?.hash;
  const createdAt = new Date();
  const hash = sha256Hex(`${eventType}|${patientId || ''}|${userId || ''}|${createdAt.toISOString()}|${prevHash || ''}`);
  await prisma.audit.create({ data: { eventType, patientId, userId, prevHash, hash, createdAt } });
}