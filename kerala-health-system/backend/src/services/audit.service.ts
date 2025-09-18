import { PrismaClient } from '@prisma/client';
import { createHash } from '@/utils/crypto';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

export interface AuditEvent {
  eventType: string;
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  patientId?: string;
  ipAddress?: string;
  userAgent?: string;
  facility?: string;
  dataHash?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Get the previous audit log entry for hash chaining
      const previousLog = await prisma.auditLog.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { dataHash: true },
      });

      // Create data hash for integrity
      const eventData = JSON.stringify({
        eventType: event.eventType,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        userId: event.userId,
        patientId: event.patientId,
        timestamp: new Date().toISOString(),
        metadata: event.metadata,
      });

      const dataHash = createHash(eventData);
      
      // Chain hash with previous entry for blockchain-like integrity
      const chainedData = previousLog?.dataHash 
        ? `${previousLog.dataHash}:${dataHash}`
        : dataHash;
      const chainedHash = createHash(chainedData);

      // Save audit log
      await prisma.auditLog.create({
        data: {
          eventType: event.eventType,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          userId: event.userId,
          patientId: event.patientId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          facility: event.facility,
          dataHash: chainedHash,
          previousHash: previousLog?.dataHash,
          metadata: event.metadata,
        },
      });

      logger.debug(`Audit event logged: ${event.eventType}`, {
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        userId: event.userId,
        patientId: event.patientId,
      });

    } catch (error) {
      logger.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking main operations
    }
  }

  async getAuditTrail(filters: {
    patientId?: string;
    userId?: string;
    resourceType?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    const {
      patientId,
      userId,
      resourceType,
      eventType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (userId) where.userId = userId;
    if (resourceType) where.resourceType = resourceType;
    if (eventType) where.eventType = eventType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              facility: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
              abhaId: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async verifyAuditIntegrity(startDate?: Date, endDate?: Date): Promise<{
    totalChecked: number;
    validEntries: number;
    invalidEntries: number;
    brokenChain: boolean;
    details: Array<{
      id: string;
      timestamp: Date;
      issue: string;
    }>;
  }> {
    const where: any = {};
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        timestamp: true,
        eventType: true,
        resourceType: true,
        resourceId: true,
        userId: true,
        patientId: true,
        dataHash: true,
        previousHash: true,
        metadata: true,
      },
    });

    const results = {
      totalChecked: logs.length,
      validEntries: 0,
      invalidEntries: 0,
      brokenChain: false,
      details: [] as Array<{
        id: string;
        timestamp: Date;
        issue: string;
      }>,
    };

    let previousHash: string | null = null;

    for (const log of logs) {
      let isValid = true;
      const issues: string[] = [];

      // Verify data hash
      const eventData = JSON.stringify({
        eventType: log.eventType,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        userId: log.userId,
        patientId: log.patientId,
        timestamp: log.timestamp.toISOString(),
        metadata: log.metadata,
      });

      const expectedDataHash = createHash(eventData);
      const chainedData = previousHash 
        ? `${previousHash}:${expectedDataHash}`
        : expectedDataHash;
      const expectedChainedHash = createHash(chainedData);

      if (log.dataHash !== expectedChainedHash) {
        isValid = false;
        issues.push('Hash mismatch');
      }

      // Verify chain integrity
      if (log.previousHash !== previousHash) {
        isValid = false;
        issues.push('Chain broken');
        results.brokenChain = true;
      }

      if (isValid) {
        results.validEntries++;
      } else {
        results.invalidEntries++;
        results.details.push({
          id: log.id,
          timestamp: log.timestamp,
          issue: issues.join(', '),
        });
      }

      previousHash = log.dataHash;
    }

    return results;
  }

  async getAuditSummary(filters: {
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalEvents: number;
    eventTypes: Record<string, number>;
    userActivity: Array<{
      userId: string;
      userName: string;
      eventCount: number;
    }>;
    dailyActivity: Array<{
      date: string;
      eventCount: number;
    }>;
  }> {
    const { patientId, startDate, endDate } = filters;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    // Get total events and event type distribution
    const [totalEvents, eventTypeStats, userStats, dailyStats] = await Promise.all([
      prisma.auditLog.count({ where }),
      
      prisma.auditLog.groupBy({
        by: ['eventType'],
        where,
        _count: { eventType: true },
      }),
      
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      
      prisma.$queryRaw`
        SELECT DATE(timestamp) as date, COUNT(*) as event_count
        FROM audit_logs
        WHERE ${patientId ? 'patient_id = $1 AND' : ''} 
              timestamp >= ${startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
              AND timestamp <= ${endDate || new Date()}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `,
    ]);

    // Get user details for user activity
    const userIds = userStats.map(stat => stat.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const userMap = new Map(users.map(user => [user.id, user]));

    return {
      totalEvents,
      eventTypes: eventTypeStats.reduce((acc, stat) => {
        acc[stat.eventType] = stat._count.eventType;
        return acc;
      }, {} as Record<string, number>),
      userActivity: userStats.map(stat => ({
        userId: stat.userId!,
        userName: userMap.get(stat.userId!)?.firstName + ' ' + userMap.get(stat.userId!)?.lastName || 'Unknown',
        eventCount: stat._count.userId,
      })),
      dailyActivity: (dailyStats as any[]).map(stat => ({
        date: stat.date,
        eventCount: parseInt(stat.event_count),
      })),
    };
  }
}