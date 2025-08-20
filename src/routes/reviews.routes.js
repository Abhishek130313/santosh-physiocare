const express = require('express');
const Joi = require('joi');
const { validate } = require('../middlewares/validate');
const { authenticateAdmin } = require('../middlewares/auth');
const { createReview, listPublicReviews, listAllReviews, approveReview, deleteReview } = require('../controllers/reviews.controller');

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, rating, comment]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
// Public: create review
router.post(
  '/',
  validate({
    body: Joi.object({
      name: Joi.string().max(120).required(),
      email: Joi.string().email().required(),
      rating: Joi.number().integer().min(1).max(5).required(),
      comment: Joi.string().max(1000).required(),
    }),
  }),
  createReview
);

/**
 * @swagger
 * /api/reviews/public:
 *   get:
 *     summary: List approved reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: OK
 */
// Public: list approved reviews
router.get('/public', listPublicReviews);

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: List all reviews (admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
// Admin: list all reviews
router.get('/', authenticateAdmin, listAllReviews);

/**
 * @swagger
 * /api/reviews/{id}/approve:
 *   patch:
 *     summary: Approve a review (admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
// Admin: approve review
router.patch(
  '/:id/approve',
  authenticateAdmin,
  validate({ params: Joi.object({ id: Joi.string().hex().length(24).required() }) }),
  approveReview
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: No Content
 */
// Admin: delete review
router.delete(
  '/:id',
  authenticateAdmin,
  validate({ params: Joi.object({ id: Joi.string().hex().length(24).required() }) }),
  deleteReview
);

module.exports = router;

