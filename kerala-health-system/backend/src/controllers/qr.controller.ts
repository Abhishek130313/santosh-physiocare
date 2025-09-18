import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { verifyQRPayload } from '@/utils/crypto';
import { generateBatchQRCodes } from '@/utils/qr';
import { AuditService } from '@/services/audit.service';
import { logger } from '@/config/logger';
import { config } from '@/config/config';

const prisma = new PrismaClient();
const auditService = new AuditService();

export class QRController {
  
  lookupByQRCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { qrCode } = req.params;

    // Find patient by QR code
    const patient = await prisma.patient.findUnique({
      where: { qrCode },
      include: {
        consents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        encounters: {
          orderBy: { startTime: 'desc' },
          take: 3,
          include: {
            observations: {
              where: {
                OR: [
                  { code: { in: ['8310-5', '8462-4', '8480-6'] } }, // Temperature, Diastolic BP, Systolic BP
                  { category: 'vital-signs' },
                ],
              },
              orderBy: { effectiveDateTime: 'desc' },
              take: 5,
            },
            clinician: {
              select: {
                firstName: true,
                lastName: true,
                facility: true,
              },
            },
          },
        },
        immunizations: {
          orderBy: { occurrenceDateTime: 'desc' },
          take: 5,
        },
      },
    });

    if (!patient) {
      throw createError('QR code not found', 404);
    }

    // Check if QR code has expired
    if (patient.cardExpiry && patient.cardExpiry < new Date()) {
      throw createError('Health card has expired', 410);
    }

    // Get consent status
    const consent = patient.consents[0];
    let accessLevel = 'denied';
    let responseData: any = {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      qrCode: patient.qrCode,
      cardExpiry: patient.cardExpiry,
    };

    // Determine access level based on user role and consent
    if (req.user) {
      switch (req.user.role) {
        case 'ADMIN':
        case 'PUBLIC_HEALTH':
          accessLevel = 'full';
          responseData = patient;
          break;
        
        case 'CLINICIAN':
          if (consent?.dataSharing) {
            accessLevel = 'full';
            responseData = patient;
          } else {
            accessLevel = 'limited';
            responseData = {
              ...responseData,
              gender: patient.gender,
              birthDate: patient.birthDate,
              phone: patient.phone,
              emergencyPhone: patient.emergencyPhone,
              allergies: 'Consent required for detailed medical history',
              consentStatus: 'DATA_SHARING_DENIED',
            };
          }
          break;
        
        case 'KIOSK':
          accessLevel = 'limited';
          responseData = {
            ...responseData,
            gender: patient.gender,
            birthDate: patient.birthDate,
            district: patient.district,
            workSite: patient.workSite,
          };
          break;
        
        default:
          accessLevel = 'denied';
      }
    } else {
      // Public access (no authentication)
      accessLevel = 'public';
      responseData = {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        status: 'Valid Health Card',
        cardExpiry: patient.cardExpiry,
        emergencyPhone: patient.emergencyPhone,
      };
    }

    // Log QR code access
    await auditService.logEvent({
      eventType: 'QR_CODE_ACCESSED',
      resourceType: 'Patient',
      resourceId: patient.id,
      userId: req.user?.id,
      patientId: patient.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
      metadata: {
        qrCode,
        accessLevel,
        hasConsent: consent?.dataSharing || false,
      },
    });

    logger.info(`QR code accessed: ${qrCode}`, {
      patientId: patient.id,
      userId: req.user?.id,
      accessLevel,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        patient: responseData,
        accessLevel,
        timestamp: new Date().toISOString(),
      },
    });
  });

  verifyQRPayload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { payload } = req.params;

    try {
      const verification = verifyQRPayload(payload);
      
      // Check if QR code has expired (2 years from generation)
      const maxAge = config.qr.expiryDays * 24 * 60 * 60 * 1000;
      const expired = Date.now() - verification.timestamp.getTime() > maxAge;

      // If valid, check if patient still exists
      let patientExists = false;
      if (verification.valid && verification.patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: verification.patientId },
          select: { id: true, isActive: true },
        });
        patientExists = !!patient?.isActive;
      }

      res.json({
        success: true,
        data: {
          valid: verification.valid && patientExists && !expired,
          patientId: verification.valid ? verification.patientId : null,
          timestamp: verification.timestamp,
          expired,
          patientExists,
        },
      });

    } catch (error) {
      res.json({
        success: true,
        data: {
          valid: false,
          patientId: null,
          timestamp: null,
          expired: true,
          patientExists: false,
          error: 'Invalid QR payload format',
        },
      });
    }
  });

  generateBatchQRCodes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientIds, format = 'png' } = req.body;

    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      throw createError('Patient IDs array is required', 400);
    }

    if (patientIds.length > 100) {
      throw createError('Maximum 100 patients allowed per batch', 400);
    }

    // Fetch patients
    const patients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        qrCode: true,
        gender: true,
        birthDate: true,
        phone: true,
        district: true,
        workSite: true,
      },
    });

    if (patients.length === 0) {
      throw createError('No valid patients found', 404);
    }

    // Generate QR codes
    const qrCodes = await generateBatchQRCodes(patients as any);

    // Log batch generation
    await auditService.logEvent({
      eventType: 'BATCH_QR_GENERATED',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
      metadata: {
        patientCount: patients.length,
        format,
        patientIds: patientIds.slice(0, 10), // Log only first 10 for brevity
      },
    });

    if (format === 'png') {
      // Return base64 encoded images
      const results = qrCodes.map((qr, index) => ({
        patientId: qr.patientId,
        patient: patients.find(p => p.id === qr.patientId),
        qrCode: qr.qrCode.toString('base64'),
      }));

      res.json({
        success: true,
        message: `Generated ${results.length} QR codes`,
        data: results,
      });

    } else if (format === 'pdf') {
      // TODO: Generate PDF with multiple QR codes
      throw createError('PDF format not yet implemented', 501);
    } else {
      throw createError('Invalid format. Use "png" or "pdf"', 400);
    }
  });

  // Emergency QR lookup without authentication (for emergency services)
  emergencyLookup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { qrCode } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { qrCode },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        phone: true,
        emergencyName: true,
        emergencyPhone: true,
        emergencyRelation: true,
        district: true,
        // Critical medical information
        encounters: {
          where: {
            observations: {
              some: {
                OR: [
                  { code: { contains: 'allergy' } },
                  { display: { contains: 'allergy', mode: 'insensitive' } },
                  { code: { contains: 'medication' } },
                  { category: 'medication' },
                ],
              },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 3,
          select: {
            observations: {
              where: {
                OR: [
                  { code: { contains: 'allergy' } },
                  { display: { contains: 'allergy', mode: 'insensitive' } },
                  { code: { contains: 'medication' } },
                ],
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw createError('QR code not found', 404);
    }

    // Log emergency access
    await auditService.logEvent({
      eventType: 'EMERGENCY_QR_ACCESS',
      resourceType: 'Patient',
      resourceId: patient.id,
      patientId: patient.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        qrCode,
        emergencyAccess: true,
      },
    });

    logger.warn(`Emergency QR access: ${qrCode}`, {
      patientId: patient.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        patient,
        accessType: 'emergency',
        disclaimer: 'This information is provided for emergency medical purposes only.',
        timestamp: new Date().toISOString(),
      },
    });
  });
}