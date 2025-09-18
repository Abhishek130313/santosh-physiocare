import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { config } from '@/config/config';
import { createError } from './errorHandler';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    facility?: string;
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw createError('Access token required', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        facility: true,
        isActive: true,
      },
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    if (!user.isActive) {
      throw createError('Account deactivated', 401);
    }

    // Attach user to request
    req.user = user;
    
    // Log access for audit
    logger.info(`User ${user.email} accessed ${req.path}`, {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email}`, {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
      });
      
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

// Middleware to check if user can access patient data
export const checkPatientAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.params.patientId || req.body.patientId;
    
    if (!patientId) {
      return next(createError('Patient ID required', 400));
    }

    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    // Admin and public health users have access to all patients
    if (req.user.role === 'ADMIN' || req.user.role === 'PUBLIC_HEALTH') {
      return next();
    }

    // Check if user has explicit access to this patient
    const access = await prisma.patientAccess.findFirst({
      where: {
        patientId,
        userId: req.user.id,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
    });

    if (!access) {
      logger.warn(`Unauthorized patient access attempt`, {
        userId: req.user.id,
        patientId,
        path: req.path,
      });
      
      return next(createError('Access to this patient record denied', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        facility: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore auth errors in optional auth
    next();
  }
};