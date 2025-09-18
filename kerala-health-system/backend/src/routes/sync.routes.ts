import { Router } from 'express';
import { SyncController } from '@/controllers/sync.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();
const syncController = new SyncController();

/**
 * @swagger
 * /sync:
 *   post:
 *     summary: Sync offline data
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [CREATE, UPDATE, DELETE]
 *                     resource:
 *                       type: string
 *                       enum: [Patient, Encounter, Observation]
 *                     data:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *               lastSyncTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Sync completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conflicts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 syncedCount:
 *                   type: integer
 *                 lastSyncTime:
 *                   type: string
 *                   format: date-time
 */
router.post('/', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN', 'KIOSK'),
  syncController.syncData
);

/**
 * @swagger
 * /sync/status:
 *   get:
 *     summary: Get sync status
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status
 */
router.get('/status', 
  authenticate,
  syncController.getSyncStatus
);

/**
 * @swagger
 * /sync/conflicts/{id}:
 *   post:
 *     summary: Resolve sync conflict
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution:
 *                 type: string
 *                 enum: [USE_LOCAL, USE_SERVER, MERGE]
 *               mergedData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Conflict resolved
 */
router.post('/conflicts/:conflictId', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN'),
  syncController.resolveConflict
);

export default router;