import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRole } from '../../lib/auth.js';
import { sha256Hex } from '../../lib/crypto.js';

export const router = Router();

/**
 * GET /api/v1/qr/:code - where :code is JSON stringified payload base64url
 */
router.get('/:code', authenticate, requireRole(['CLINICIAN', 'KIOSK', 'ADMIN']), async (req, res) => {
  try {
    const code = decodeURIComponent(req.params.code);
    const payload = JSON.parse(Buffer.from(code, 'base64url').toString('utf8')) as any;
    const sig = payload.sig;
    delete payload.sig;
    const expected = sha256Hex((process.env.QR_SIGNING_SECRET || '') + JSON.stringify(payload));
    if (expected !== sig) return res.status(400).json({ error: 'Invalid QR signature' });
    const patient = await prisma.patient.findUnique({ where: { id: payload.id } });
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json({ id: patient.id, firstName: patient.firstName, lastName: patient.lastName });
  } catch (e) {
    res.status(400).json({ error: 'Malformed QR' });
  }
});