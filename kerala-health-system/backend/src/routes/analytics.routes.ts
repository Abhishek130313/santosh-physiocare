import { Router } from 'express';
import { AnalyticsController } from '@/controllers/analytics.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();
const analyticsController = new AnalyticsController();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 */
router.get('/dashboard', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN', 'CLINICIAN'),
  analyticsController.getDashboardAnalytics
);

/**
 * @swagger
 * /analytics/disease-surveillance:
 *   get:
 *     summary: Get disease surveillance data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: disease
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Disease surveillance data
 */
router.get('/disease-surveillance', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN'),
  analyticsController.getDiseaseSurveillance
);

/**
 * @swagger
 * /analytics/vaccination-coverage:
 *   get:
 *     summary: Get vaccination coverage statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vaccine
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: ageGroup
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vaccination coverage data
 */
router.get('/vaccination-coverage', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN'),
  analyticsController.getVaccinationCoverage
);

/**
 * @swagger
 * /analytics/geographic-distribution:
 *   get:
 *     summary: Get geographic distribution of health data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [patients, encounters, diseases, vaccinations]
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *     responses:
 *       200:
 *         description: Geographic distribution data
 */
router.get('/geographic-distribution', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN'),
  analyticsController.getGeographicDistribution
);

/**
 * @swagger
 * /analytics/health-trends:
 *   get:
 *     summary: Get health trends over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Health trends data
 */
router.get('/health-trends', 
  authenticate, 
  authorize('PUBLIC_HEALTH', 'ADMIN'),
  analyticsController.getHealthTrends
);

export default router;