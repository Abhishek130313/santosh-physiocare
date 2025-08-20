const express = require('express');
const { authenticateAdmin } = require('../middlewares/auth');
const { getDashboardStats } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/dashboard', authenticateAdmin, getDashboardStats);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */

module.exports = router;

