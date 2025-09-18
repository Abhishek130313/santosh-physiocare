import { Router } from 'express';
import { AlertController } from '@/controllers/alert.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();
const alertController = new AlertController();

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Get alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of alerts
 */
router.get('/', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN', 'CLINICIAN'),
  alertController.getAlerts
);

/**
 * @swagger
 * /alerts:
 *   post:
 *     summary: Create new alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               severity:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               district:
 *                 type: string
 *               affectedCount:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Alert created successfully
 */
router.post('/', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN'),
  alertController.createAlert
);

/**
 * @swagger
 * /alerts/{id}:
 *   put:
 *     summary: Update alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert updated successfully
 */
router.put('/:alertId', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN'),
  alertController.updateAlert
);

export default router;