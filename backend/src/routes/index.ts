import { Router } from 'express';
import { router as auth } from './modules/auth';
import { router as patients, enrollHandler } from './modules/patients';
import { router as encounters } from './modules/encounters';
import { router as qr } from './modules/qr';
import { router as sync } from './modules/sync';
import { router as alerts } from './modules/alerts';
import { router as audit } from './modules/audit';
import { router as abha } from './modules/abha';
import { authenticate, requireRole } from '../lib/auth';

export const router = Router();

router.use('/auth', auth);
router.post('/enroll', authenticate, requireRole(['KIOSK', 'CLINICIAN', 'ADMIN']), enrollHandler);
router.use('/patient', patients);
router.use('/encounter', encounters);
router.use('/qr', qr);
router.use('/sync', sync);
router.use('/alerts', alerts);
router.use('/audit', audit);
router.use('/abha', abha);