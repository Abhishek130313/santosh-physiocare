import { Router } from 'express';
import { authenticate, requireRole } from '../../lib/auth.js';

export const router = Router();

/** POST /api/v1/abha/link */
router.post('/link', authenticate, requireRole(['CLINICIAN', 'ADMIN']), async (req, res) => {
  const { patientId, abhaId } = req.body || {};
  if (!patientId || !abhaId) return res.status(400).json({ error: 'Missing fields' });
  // pretend success
  res.json({ ok: true, linked: true });
});