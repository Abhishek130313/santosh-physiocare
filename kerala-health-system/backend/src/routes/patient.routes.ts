import { Router } from 'express';
import { PatientController } from '@/controllers/patient.controller';
import { authenticate, authorize, checkPatientAccess } from '@/middleware/auth';
import { uploadRateLimiter } from '@/middleware/rateLimiter';
import { validatePatientEnrollment, validatePatientUpdate } from '@/middleware/validation';
import multer from 'multer';

const router = Router();
const patientController = new PatientController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

/**
 * @swagger
 * /patients/enroll:
 *   post:
 *     summary: Enroll a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - gender
 *               - birthDate
 *               - preferredLanguage
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "രാജു"
 *               lastName:
 *                 type: string
 *                 example: "കുമാർ"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER, UNKNOWN]
 *               birthDate:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               abhaId:
 *                 type: string
 *               district:
 *                 type: string
 *               taluk:
 *                 type: string
 *               originState:
 *                 type: string
 *               workSite:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *                 enum: [en, hi, ml]
 *     responses:
 *       201:
 *         description: Patient enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *                 qrCode:
 *                   type: string
 *                   description: Base64 encoded QR code
 */
router.post('/enroll', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN', 'KIOSK'),
  validatePatientEnrollment,
  patientController.enrollPatient
);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
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
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 */
router.get('/:patientId', 
  authenticate, 
  checkPatientAccess,
  patientController.getPatient
);

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     summary: Update patient information
 *     tags: [Patients]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               district:
 *                 type: string
 *               workSite:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated successfully
 */
router.put('/:patientId', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN'),
  checkPatientAccess,
  validatePatientUpdate,
  patientController.updatePatient
);

/**
 * @swagger
 * /patients/search:
 *   get:
 *     summary: Search patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (name, phone, ABHA ID)
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN', 'PUBLIC_HEALTH'),
  patientController.searchPatients
);

/**
 * @swagger
 * /patients/{id}/smart-card:
 *   get:
 *     summary: Generate smart card PDF
 *     tags: [Patients]
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
 *         description: Smart card PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:patientId/smart-card', 
  authenticate, 
  checkPatientAccess,
  patientController.generateSmartCard
);

/**
 * @swagger
 * /patients/{id}/qr-code:
 *   get:
 *     summary: Generate QR code for patient
 *     tags: [Patients]
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
 *         description: QR code PNG image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:patientId/qr-code', 
  authenticate, 
  checkPatientAccess,
  patientController.generateQRCode
);

/**
 * @swagger
 * /patients/{id}/upload:
 *   post:
 *     summary: Upload attachment for patient
 *     tags: [Patients]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post('/:patientId/upload', 
  authenticate, 
  authorize('CLINICIAN', 'ADMIN'),
  checkPatientAccess,
  uploadRateLimiter,
  upload.single('file'),
  patientController.uploadAttachment
);

/**
 * @swagger
 * /patients/{id}/consent:
 *   post:
 *     summary: Update patient consent
 *     tags: [Patients]
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
 *               dataSharing:
 *                 type: boolean
 *               analytics:
 *                 type: boolean
 *               research:
 *                 type: boolean
 *               marketing:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Consent updated successfully
 */
router.post('/:patientId/consent', 
  authenticate, 
  checkPatientAccess,
  patientController.updateConsent
);

/**
 * @swagger
 * /patients/{id}/encounters:
 *   get:
 *     summary: Get patient encounters
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Patient encounters
 */
router.get('/:patientId/encounters', 
  authenticate, 
  checkPatientAccess,
  patientController.getPatientEncounters
);

export default router;