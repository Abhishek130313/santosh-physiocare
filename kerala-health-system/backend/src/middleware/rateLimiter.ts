import rateLimit from 'express-rate-limit';
import { config } from '@/config/config';
import { logger } from '@/config/logger';

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
      timestamp: new Date().toISOString(),
    });
  },
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts from this IP, please try again later',
    retryAfter: 900, // 15 minutes
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many login attempts from this IP, please try again later',
      retryAfter: 900,
      timestamp: new Date().toISOString(),
    });
  },
});

// Rate limiter for file uploads
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 uploads per minute
  message: {
    error: 'Too many upload attempts',
    message: 'Too many file uploads from this IP, please try again later',
    retryAfter: 60,
  },
});

// Rate limiter for QR code generation
export const qrRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 QR requests per minute
  message: {
    error: 'Too many QR requests',
    message: 'Too many QR code requests from this IP, please try again later',
    retryAfter: 60,
  },
});