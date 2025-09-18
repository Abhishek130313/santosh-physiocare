import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../lib/auth';
import QRCode from 'qrcode';
import multer from 'multer';
import { putEncryptedObject } from '../../lib/storage';
import { sha256Hex } from '../../lib/crypto';
import { appendAudit } from '../../lib/audit';

const upload = multer({ storage: multer.memoryStorage() });
export const router = Router();

export async function enrollHandler(req: Request, res: Response) {
  const { firstName, lastName, gender, dob, phone, district, taluk, language, consentText, allowClinical = true, allowAnalytics = true } = req.body || {};
  const patient = await prisma.patient.create({ data: { firstName, lastName, gender, dob: dob ? new Date(dob) : null, phone, district, taluk, language } });
  await prisma.consent.create({ data: { patientId: patient.id, text: consentText || 'General consent', allowClinical, allowAnalytics } });

  const payload = { id: patient.id, ts: Date.now() };
  const payloadStr = JSON.stringify(payload);
  const sig = sha256Hex((process.env.QR_SIGNING_SECRET || '') + payloadStr);
  const qrPayload = { ...payload, sig };
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));

  await appendAudit('ENROLL', patient.id, (req as any).user?.userId);
  res.json({ patientId: patient.id, qr: qrPayload, qrDataUrl });
}

router.get('/:id', authenticate, requireRole(['CLINICIAN', 'ADMIN']), async (req, res) => {
  const id = req.params.id;
  const patient = await prisma.patient.findUnique({ where: { id }, include: { consents: true, encounters: { include: { observations: true } }, immunizations: true, attachments: true } });
  if (!patient) return res.status(404).json({ error: 'Not found' });
  const consent = patient.consents[0];
  if (!consent || !consent.allowClinical) return res.status(403).json({ error: 'Consent denied' });
  res.json(patient);
});

router.post('/:id/encounter', authenticate, requireRole(['CLINICIAN', 'ADMIN']), async (req, res) => {
  const patientId = req.params.id;
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

router.post('/:id/attachment', authenticate, requireRole(['CLINICIAN', 'ADMIN']), upload.single('file'), async (req, res) => {
  const id = req.params.id;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file' });
  const key = `patient/${id}/${Date.now()}_${file.originalname}`;
  await putEncryptedObject(process.env.MINIO_BUCKET || 'attachments', key, file.buffer, file.mimetype);
  const sha = sha256Hex(file.buffer);
  await prisma.attachment.create({ data: { patientId: id, filename: file.originalname, mimeType: file.mimetype, s3Key: key, sha256: sha } });
  await appendAudit('ATTACHMENT_UPLOAD', id, (req as any).user?.userId);
  res.json({ ok: true, key });
});