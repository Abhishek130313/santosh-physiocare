require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const { StatusCodes } = require('http-status-codes');

const { connectToDatabase } = require('./config/db');
const { logger, morganStream } = require('./config/logger');

const authRoutes = require('./routes/auth.routes');
const appointmentRoutes = require('./routes/appointments.routes');
const reviewRoutes = require('./routes/reviews.routes');
const serviceRoutes = require('./routes/services.routes');
const contactRoutes = require('./routes/contacts.routes');
const adminRoutes = require('./routes/admin.routes');

const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./docs/swagger');

const app = express();

// Security
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// CORS
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: false }));

// Logging
app.use(morgan('combined', { stream: morganStream }));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Rate limiting (apply to all requests)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Healthcheck
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok', uptime: process.uptime() });
});

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);

// Not found and error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 4000;

// Start server only after DB connection
connectToDatabase()
  .then(async () => {
    // Seed admin user if configured
    const { seedAdminUserIfNeeded } = require('./startup/seedAdmin');
    await seedAdminUserIfNeeded();

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Swagger docs available at /api/docs`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server due to DB connection error', { error });
    process.exit(1);
  });

// Handle unexpected errors
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

