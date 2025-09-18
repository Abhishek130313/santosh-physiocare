import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { config } from '@/config/config';
import { AuditService } from '@/services/audit.service';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class AuthController {
  
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw createError('Account has been deactivated', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid email or password', 401);
    }

    // Generate JWT tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: '30d',
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log login event
    await auditService.logEvent({
      eventType: 'USER_LOGIN',
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: user.facility,
      metadata: {
        loginMethod: 'password',
        role: user.role,
      },
    });

    logger.info(`User logged in: ${user.email}`, {
      userId: user.id,
      role: user.role,
      ip: req.ip,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token: accessToken,
        refreshToken,
      },
    });
  });

  register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      licenseNumber,
      facility,
      department,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        licenseNumber,
        facility,
        department,
      },
    });

    // Log registration event
    await auditService.logEvent({
      eventType: 'USER_REGISTERED',
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: user.facility,
      metadata: {
        registeredBy: req.user?.id,
        role: user.role,
      },
    });

    logger.info(`New user registered: ${user.email}`, {
      userId: user.id,
      role: user.role,
      registeredBy: req.user?.id,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: userWithoutPassword },
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token required', 400);
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        throw createError('Invalid refresh token', 401);
      }

      // Generate new access token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      // Log token refresh
      await auditService.logEvent({
        eventType: 'TOKEN_REFRESHED',
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        facility: user.facility,
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newAccessToken,
        },
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid refresh token', 401);
      }
      throw error;
    }
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user) {
      // Log logout event
      await auditService.logEvent({
        eventType: 'USER_LOGOUT',
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        facility: req.user.facility,
      });

      logger.info(`User logged out: ${req.user.email}`, {
        userId: req.user.id,
        ip: req.ip,
      });
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        licenseNumber: true,
        facility: true,
        department: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    // Log password change
    await auditService.logEvent({
      eventType: 'PASSWORD_CHANGED',
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: user.facility,
    });

    logger.info(`Password changed for user: ${user.email}`, {
      userId: user.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  // Admin-only endpoints

  listUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, role, facility, active } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    
    if (role) where.role = role;
    if (facility) where.facility = { contains: String(facility), mode: 'insensitive' };
    if (active !== undefined) where.isActive = active === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          facility: true,
          department: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });

  updateUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Log status change
    await auditService.logEvent({
      eventType: 'USER_STATUS_CHANGED',
      resourceType: 'User',
      resourceId: userId,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
      metadata: {
        targetUser: user.email,
        newStatus: isActive ? 'active' : 'inactive',
      },
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  });
}