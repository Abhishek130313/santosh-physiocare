import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();
const adminController = new AdminController();

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: facility
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', 
  authenticate, 
  authorize('ADMIN'),
  adminController.getUsers
);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     summary: Update user status
 *     tags: [Admin]
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
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 */
router.put('/users/:userId/status', 
  authenticate, 
  authorize('ADMIN'),
  adminController.updateUserStatus
);

/**
 * @swagger
 * /admin/system/status:
 *   get:
 *     summary: Get system status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status information
 */
router.get('/system/status', 
  authenticate, 
  authorize('ADMIN'),
  adminController.getSystemStatus
);

/**
 * @swagger
 * /admin/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview
 */
router.get('/analytics/overview', 
  authenticate, 
  authorize('ADMIN', 'PUBLIC_HEALTH'),
  adminController.getAnalyticsOverview
);

export default router;