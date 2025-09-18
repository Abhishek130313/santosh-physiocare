import { Router } from 'express';
import { authenticate, requireRole } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';
import { sha256Hex } from '../../lib/crypto.js';

export const router = Router();

/** GET /api/v1/audit/:patientId */
router.get('/:patientId', authenticate, requireRole(['ADMIN']), async (req, res) => {
  const { patientId } = req.params;
  const items = await prisma.audit.findMany({ where: { patientId }, orderBy: { createdAt: 'asc' } });
  res.json({ items });
});

/** GET /api/v1/audit/verify */
router.get('/verify/integrity', authenticate, requireRole(['ADMIN']), async (_req, res) => {
  const items = await prisma.audit.findMany({ orderBy: { createdAt: 'asc' } });
  let prev: string | undefined;
  for (const it of items) {
    const recomputed = sha256Hex(`${it.eventType}|${it.patientId || ''}|${it.userId || ''}|${it.createdAt.toISOString()}|${it.prevHash || ''}`);
    if (it.hash !== recomputed) return res.status(409).json({ ok: false, brokenAt: it.id });
    if (it.prevHash !== prev && prev) return res.status(409).json({ ok: false, chainBrokenAt: it.id });
    prev = it.hash;
  }
  res.json({ ok: true, last: prev });
});