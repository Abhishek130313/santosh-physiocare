import { Router } from 'express';
import { AuditController } from '@/controllers/audit.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();
const auditController = new AuditController();

/**
 * @swagger
 * /audit/logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Audit logs
 */
router.get('/logs', 
  authenticate, 
  authorize('ADMIN', 'AUDITOR'),
  auditController.getAuditLogs
);

/**
 * @swagger
 * /audit/{patientId}:
 *   get:
 *     summary: Get patient audit trail
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient audit trail
 */
router.get('/:patientId', 
  authenticate, 
  authorize('ADMIN', 'AUDITOR', 'CLINICIAN'),
  auditController.getPatientAuditTrail
);

/**
 * @swagger
 * /audit/verify/integrity:
 *   post:
 *     summary: Verify audit log integrity
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Integrity verification result
 */
router.post('/verify/integrity', 
  authenticate, 
  authorize('ADMIN', 'AUDITOR'),
  auditController.verifyIntegrity
);

/**
 * @swagger
 * /audit/summary:
 *   get:
 *     summary: Get audit summary
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Audit summary
 */
router.get('/summary', 
  authenticate, 
  authorize('ADMIN', 'AUDITOR'),
  auditController.getAuditSummary
);

export default router;