import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../lib/auth';
import { sha256Hex } from '../../lib/crypto';
import { appendAudit } from '../../lib/audit';

export const router = Router();

router.post('/:patientId', authenticate, requireRole(['CLINICIAN', 'ADMIN']), async (req, res) => {
  const patientId = req.params.patientId;
  const { type, notes, observations } = req.body || {};
  const consent = await prisma.consent.findFirst({ where: { patientId } });
  if (!consent?.allowClinical) return res.status(403).json({ error: 'Consent denied' });

  const encounter = await prisma.encounter.create({ data: { patientId, type, notes } });
  if (Array.isArray(observations)) {
    for (const obs of observations) {
      await prisma.observation.create({ data: { encounterId: encounter.id, code: obs.code, value: obs.value, unit: obs.unit, district: obs.district, taluk: obs.taluk } });
    }
  }
  await appendAudit('ENCOUNTER_CREATE', patientId, (req as any).user?.userId);
  res.json({ id: encounter.id });
});