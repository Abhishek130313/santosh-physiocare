const express = require('express');
const Joi = require('joi');
const { validate } = require('../middlewares/validate');
const { authenticateAdmin } = require('../middlewares/auth');
const { createAppointment, listAppointments, updateAppointmentStatus } = require('../controllers/appointments.controller');

const router = express.Router();

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Book an appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, serviceType, dateTime]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               serviceType: { type: string }
 *               dateTime: { type: string, format: date-time }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
// Public: create appointment
router.post(
  '/',
  validate({
    body: Joi.object({
      name: Joi.string().max(120).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().max(25).required(),
      serviceType: Joi.string().max(120).required(),
      dateTime: Joi.date().iso().required(),
      notes: Joi.string().max(1000).allow('', null),
    }),
  }),
  createAppointment
);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: List appointments (admin)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, confirmed, cancelled] }
 *     responses:
 *       200:
 *         description: OK
 */
// Admin: list with pagination
router.get(
  '/',
  authenticateAdmin,
  validate({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      status: Joi.string().valid('pending', 'confirmed', 'cancelled').optional(),
    }),
  }),
  listAppointments
);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status (admin)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, confirmed, cancelled] }
 *     responses:
 *       200:
 *         description: OK
 */
// Admin: update status
router.patch(
  '/:id/status',
  authenticateAdmin,
  validate({
    params: Joi.object({ id: Joi.string().hex().length(24).required() }),
    body: Joi.object({ status: Joi.string().valid('pending', 'confirmed', 'cancelled').required() }),
  }),
  updateAppointmentStatus
);

module.exports = router;

