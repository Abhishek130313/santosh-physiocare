import { prisma } from '../lib/prisma.js';
import { sha256Hex } from '../lib/crypto.js';

async function main() {
  const items = await prisma.audit.findMany({ orderBy: { createdAt: 'asc' } });
  let prev: string | undefined;
  for (const it of items) {
    const recomputed = sha256Hex(`${it.eventType}|${it.patientId || ''}|${it.userId || ''}|${it.createdAt.toISOString()}|${it.prevHash || ''}`);
    if (recomputed !== it.hash) {
      console.error('Hash mismatch at', it.id);
      process.exit(2);
    }
    if (prev && it.prevHash !== prev) {
      console.error('Chain broken at', it.id);
      process.exit(3);
    }
    prev = it.hash;
  }
  console.log('Audit verified. Last:', prev);
}

main().catch(e => { console.error(e); process.exit(1); });