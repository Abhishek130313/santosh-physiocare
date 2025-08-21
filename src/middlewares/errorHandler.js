const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { logger } = require('../config/logger');

function notFoundHandler(req, res, next) {
  res.status(StatusCodes.NOT_FOUND).json({
    message: 'Resource not found',
    path: req.originalUrl
  });
}

// Centralized error handler to send consistent JSON responses
function globalErrorHandler(err, req, res, next) {
  // Normalize common Mongoose errors
  if (err && err.name === 'CastError') {
    err.statusCode = StatusCodes.BAD_REQUEST;
    err.message = `Invalid ${err.path}`;
  }
  if (err && err.code === 11000) {
    err.statusCode = StatusCodes.BAD_REQUEST;
    const fields = Object.keys(err.keyPattern || {});
    err.message = `Duplicate value for field(s): ${fields.join(', ')}`;
  }

  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || getReasonPhrase(statusCode);

  const response = {
    message,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
    if (err.details) response.details = err.details;
  }

  // Log structured error
  logger.error('Request failed', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    details: err.details || undefined,
    stack: err.stack
  });

  res.status(statusCode).json(response);
}

module.exports = { notFoundHandler, globalErrorHandler };

