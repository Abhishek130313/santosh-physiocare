import { Router } from 'express';
import { EncounterController } from '@/controllers/encounter.controller';
import { authenticate, authorize, checkPatientAccess } from '@/middleware/auth';
import { validateEncounter } from '@/middleware/validation';

const router = Router();
const encounterController = new EncounterController();

/**
 * @swagger
 * /encounters:
 *   post:
 *     summary: Create new encounter
 *     tags: [Encounters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Encounter'
 *     responses:
 *       201:
 *         description: Encounter created successfully
 */
router.post('/', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN'),
  validateEncounter,
  checkPatientAccess,
  encounterController.createEncounter
);

/**
 * @swagger
 * /encounters/{id}:
 *   get:
 *     summary: Get encounter by ID
 *     tags: [Encounters]
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
 *         description: Encounter details
 */
router.get('/:encounterId', 
  authenticate, 
  encounterController.getEncounter
);

/**
 * @swagger
 * /encounters/{id}:
 *   put:
 *     summary: Update encounter
 *     tags: [Encounters]
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
 *             $ref: '#/components/schemas/Encounter'
 *     responses:
 *       200:
 *         description: Encounter updated successfully
 */
router.put('/:encounterId', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN'),
  validateEncounter,
  encounterController.updateEncounter
);

/**
 * @swagger
 * /encounters/{id}/observations:
 *   post:
 *     summary: Add observation to encounter
 *     tags: [Encounters]
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
 *             $ref: '#/components/schemas/Observation'
 *     responses:
 *       201:
 *         description: Observation added successfully
 */
router.post('/:encounterId/observations', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN'),
  encounterController.addObservation
);

/**
 * @swagger
 * /encounters/{id}/medications:
 *   post:
 *     summary: Add medication to encounter
 *     tags: [Encounters]
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
 *               medicationName:
 *                 type: string
 *               dosageText:
 *                 type: string
 *               frequency:
 *                 type: string
 *               duration:
 *                 type: string
 *               instructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medication added successfully
 */
router.post('/:encounterId/medications', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN'),
  encounterController.addMedication
);

export default router;