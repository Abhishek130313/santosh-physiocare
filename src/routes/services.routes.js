const express = require('express');
const Joi = require('joi');
const { validate } = require('../middlewares/validate');
const { authenticateAdmin } = require('../middlewares/auth');
const { listServices, listAllServices, createService, updateService, deleteService } = require('../controllers/services.controller');

const router = express.Router();

/**
 * @swagger
 * /api/services/public:
 *   get:
 *     summary: List active services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: OK
 */
// Public
router.get('/public', listServices);

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: List all services (admin)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
// Admin
router.get('/', authenticateAdmin, listAllServices);
router.post(
  '/',
  authenticateAdmin,
  validate({
    body: Joi.object({
      title: Joi.string().max(200).required(),
      slug: Joi.string().max(200).regex(/^[a-z0-9-]+$/).required(),
      description: Joi.string().max(5000).required(),
      imageUrl: Joi.string().uri().allow('', null),
      isActive: Joi.boolean().default(true),
    })
  }),
  createService
);
router.put(
  '/:id',
  authenticateAdmin,
  validate({
    params: Joi.object({ id: Joi.string().hex().length(24).required() }),
    body: Joi.object({
      title: Joi.string().max(200).optional(),
      slug: Joi.string().max(200).regex(/^[a-z0-9-]+$/).optional(),
      description: Joi.string().max(5000).optional(),
      imageUrl: Joi.string().uri().allow('', null).optional(),
      isActive: Joi.boolean().optional(),
    })
  }),
  updateService
);
router.delete(
  '/:id',
  authenticateAdmin,
  validate({ params: Joi.object({ id: Joi.string().hex().length(24).required() }) }),
  deleteService
);

module.exports = router;

