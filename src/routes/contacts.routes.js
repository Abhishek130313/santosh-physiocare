const express = require('express');
const Joi = require('joi');
const { validate } = require('../middlewares/validate');
const { authenticateAdmin } = require('../middlewares/auth');
const { createContactMessage, listContactMessages } = require('../controllers/contacts.controller');

const router = express.Router();

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Submit a contact message
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
// Public: create contact message
router.post(
  '/',
  validate({
    body: Joi.object({
      name: Joi.string().max(120).required(),
      email: Joi.string().email().required(),
      message: Joi.string().max(2000).required(),
    })
  }),
  createContactMessage
);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: List contact messages (admin)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
// Admin: list contact messages
router.get('/', authenticateAdmin, listContactMessages);

module.exports = router;

