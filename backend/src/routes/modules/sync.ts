import { Router } from 'express';
import { authenticate, requireRole } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';

export const router = Router();

/**
 * POST /api/v1/sync - accepts offline batch of { patients, encounters }
 */
router.post('/', authenticate, requireRole(['CLINICIAN', 'KIOSK', 'ADMIN']), async (req, res) => {
  const batch = req.body || {};
  const conflicts: any[] = [];
  // Extremely simplified reconciliation for demo
  if (Array.isArray(batch.patients)) {
    for (const p of batch.patients) {
      try {
        await prisma.patient.upsert({
          where: { id: p.id },
          create: { id: p.id, firstName: p.firstName, lastName: p.lastName, gender: p.gender, dob: p.dob ? new Date(p.dob) : null, phone: p.phone, district: p.district, taluk: p.taluk, language: p.language },
          update: { firstName: p.firstName, lastName: p.lastName, phone: p.phone }
        });
      } catch (e) {
        conflicts.push({ type: 'patient', id: p.id, reason: 'upsert_failed' });
      }
    }
  }
  if (Array.isArray(batch.encounters)) {
    for (const e of batch.encounters) {
      try {
        await prisma.encounter.create({ data: { id: e.id, patientId: e.patientId, type: e.type, notes: e.notes, datetime: e.datetime ? new Date(e.datetime) : undefined } });
      } catch (err) {
        conflicts.push({ type: 'encounter', id: e.id, reason: 'create_failed' });
      }
    }
  }
  res.json({ ok: true, conflicts });
});