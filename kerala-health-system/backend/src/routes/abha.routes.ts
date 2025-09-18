import { Router } from 'express';
import { ABHAController } from '@/controllers/abha.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();
const abhaController = new ABHAController();

/**
 * @swagger
 * /abha/link:
 *   post:
 *     summary: Link patient with ABHA ID
 *     tags: [ABHA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *               abhaId:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: ABHA linked successfully
 */
router.post('/link', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN', 'KIOSK'),
  abhaController.linkABHA
);

/**
 * @swagger
 * /abha/verify:
 *   post:
 *     summary: Verify ABHA ID
 *     tags: [ABHA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               abhaId:
 *                 type: string
 *     responses:
 *       200:
 *         description: ABHA verification result
 */
router.post('/verify', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN', 'KIOSK'),
  abhaController.verifyABHA
);

/**
 * @swagger
 * /abha/create:
 *   post:
 *     summary: Create new ABHA ID (stub)
 *     tags: [ABHA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientData:
 *                 type: object
 *               aadhaarNumber:
 *                 type: string
 *               mobile:
 *                 type: string
 *     responses:
 *       201:
 *         description: ABHA ID created
 */
router.post('/create', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN', 'KIOSK'),
  abhaController.createABHA
);

export default router;