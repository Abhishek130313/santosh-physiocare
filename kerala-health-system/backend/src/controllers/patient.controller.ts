import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { generatePatientQRCode, generateSmartCardPDF } from '@/utils/qr';
import { generateQRPayload, createHash } from '@/utils/crypto';
import { StorageService } from '@/services/storage.service';
import { AuditService } from '@/services/audit.service';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();
const storageService = new StorageService();
const auditService = new AuditService();

export class PatientController {
  
  enrollPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      firstName,
      lastName,
      gender,
      birthDate,
      phone,
      email,
      abhaId,
      stateId,
      addressLine1,
      addressLine2,
      district,
      taluk,
      village,
      pincode,
      originState,
      originDistrict,
      workSite,
      employerName,
      employerContact,
      preferredLanguage,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
    } = req.body;

    // Check for duplicate ABHA ID or phone
    if (abhaId) {
      const existingAbha = await prisma.patient.findUnique({
        where: { abhaId },
      });
      if (existingAbha) {
        throw createError('Patient with this ABHA ID already exists', 409);
      }
    }

    if (phone) {
      const existingPhone = await prisma.patient.findFirst({
        where: { phone },
      });
      if (existingPhone) {
        throw createError('Patient with this phone number already exists', 409);
      }
    }

    // Create patient in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create patient
      const patient = await tx.patient.create({
        data: {
          firstName,
          lastName,
          gender,
          birthDate: new Date(birthDate),
          phone,
          email,
          abhaId,
          stateId,
          addressLine1,
          addressLine2,
          district,
          taluk,
          village,
          pincode,
          state: 'Kerala',
          country: 'India',
          originState,
          originDistrict,
          workSite,
          employerName,
          employerContact,
          preferredLanguage: preferredLanguage || 'ml',
          emergencyName,
          emergencyPhone,
          emergencyRelation,
        },
      });

      // Generate QR code
      const qrPayload = generateQRPayload(patient.id);
      const qrCode = `KH-${patient.id.substring(0, 8).toUpperCase()}`;
      
      // Update patient with QR code
      const updatedPatient = await tx.patient.update({
        where: { id: patient.id },
        data: {
          qrCode,
          cardIssued: new Date(),
          cardExpiry: new Date(Date.now() + (365 * 2 * 24 * 60 * 60 * 1000)), // 2 years
        },
      });

      // Create default consent
      await tx.consent.create({
        data: {
          patientId: patient.id,
          dataSharing: true,
          analytics: true,
          research: false,
          marketing: false,
        },
      });

      // Grant access to enrolling user
      if (req.user?.id) {
        await tx.patientAccess.create({
          data: {
            patientId: patient.id,
            userId: req.user.id,
            accessType: 'FULL',
            reason: 'Patient enrollment',
          },
        });
      }

      return updatedPatient;
    });

    // Generate QR code image
    const qrCodeBuffer = await generatePatientQRCode(result);
    const qrCodeBase64 = qrCodeBuffer.toString('base64');

    // Log enrollment
    await auditService.logEvent({
      eventType: 'PATIENT_ENROLLED',
      resourceType: 'Patient',
      resourceId: result.id,
      userId: req.user?.id,
      patientId: result.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
      metadata: {
        enrollmentMethod: 'manual',
        district: result.district,
        originState: result.originState,
      },
    });

    logger.info(`Patient enrolled: ${result.id}`, {
      patientId: result.id,
      userId: req.user?.id,
      district: result.district,
    });

    res.status(201).json({
      success: true,
      message: 'Patient enrolled successfully',
      data: {
        patient: result,
        qrCode: qrCodeBase64,
        qrPayload: generateQRPayload(result.id),
      },
    });
  });

  getPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        consents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        encounters: {
          orderBy: { startTime: 'desc' },
          take: 5,
          include: {
            observations: true,
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
          take: 10,
        },
      },
    });

    if (!patient) {
      throw createError('Patient not found', 404);
    }

    // Check consent for data sharing
    const consent = patient.consents[0];
    if (!consent?.dataSharing && req.user?.role !== 'ADMIN') {
      // Return limited data if consent not given
      const limitedData = {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        qrCode: patient.qrCode,
        consentStatus: 'DATA_SHARING_DENIED',
      };
      
      return res.json({
        success: true,
        data: limitedData,
      });
    }

    // Log access
    await auditService.logEvent({
      eventType: 'PATIENT_ACCESSED',
      resourceType: 'Patient',
      resourceId: patient.id,
      userId: req.user?.id,
      patientId: patient.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
    });

    res.json({
      success: true,
      data: patient,
    });
  });

  updatePatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.id;
    delete updateData.abhaId;
    delete updateData.qrCode;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    // Log update
    await auditService.logEvent({
      eventType: 'PATIENT_UPDATED',
      resourceType: 'Patient',
      resourceId: patient.id,
      userId: req.user?.id,
      patientId: patient.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient,
    });
  });

  searchPatients = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { q, district, page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (q) {
      where.OR = [
        { firstName: { contains: String(q), mode: 'insensitive' } },
        { lastName: { contains: String(q), mode: 'insensitive' } },
        { phone: { contains: String(q) } },
        { abhaId: { contains: String(q) } },
        { stateId: { contains: String(q) } },
      ];
    }

    if (district) {
      where.district = district;
    }

    // For non-admin users, only show patients they have access to
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'PUBLIC_HEALTH') {
      where.patientAccess = {
        some: {
          userId: req.user?.id,
          revokedAt: null,
        },
      };
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthDate: true,
          phone: true,
          district: true,
          workSite: true,
          qrCode: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });

  generateSmartCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw createError('Patient not found', 404);
    }

    // Generate QR code
    const qrCodeBuffer = await generatePatientQRCode(patient);

    // Generate smart card PDF
    const pdfBuffer = await generateSmartCardPDF({
      patient,
      qrCode: qrCodeBuffer,
    });

    // Log smart card generation
    await auditService.logEvent({
      eventType: 'SMART_CARD_GENERATED',
      resourceType: 'Patient',
      resourceId: patient.id,
      userId: req.user?.id,
      patientId: patient.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="health-card-${patient.firstName}-${patient.lastName}.pdf"`,
    });

    res.send(pdfBuffer);
  });

  generateQRCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!patient) {
      throw createError('Patient not found', 404);
    }

    const qrCodeBuffer = await generatePatientQRCode(patient as any);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="qr-${patient.firstName}-${patient.lastName}.png"`,
    });

    res.send(qrCodeBuffer);
  });

  uploadAttachment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientId } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      throw createError('No file provided', 400);
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw createError('Patient not found', 404);
    }

    // Upload file to storage
    const storageKey = await storageService.uploadFile(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      patientId,
    });

    // Calculate file hash
    const fileHash = createHash(file.buffer.toString('base64'));

    // Save to database
    const binary = await prisma.binary.create({
      data: {
        contentType: file.mimetype,
        size: file.size,
        hash: fileHash,
        title: title || file.originalname,
        storageKey,
        encrypted: true,
        patientId,
        uploadedBy: req.user?.id,
      },
    });

    // Log upload
    await auditService.logEvent({
      eventType: 'FILE_UPLOADED',
      resourceType: 'Binary',
      resourceId: binary.id,
      userId: req.user?.id,
      patientId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
      dataHash: fileHash,
      metadata: {
        filename: file.originalname,
        size: file.size,
        contentType: file.mimetype,
      },
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: binary.id,
        title: binary.title,
        contentType: binary.contentType,
        size: binary.size,
        uploadedAt: binary.createdAt,
      },
    });
  });

  updateConsent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientId } = req.params;
    const { dataSharing, analytics, research, marketing } = req.body;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw createError('Patient not found', 404);
    }

    // Create new consent record (keeping history)
    const consent = await prisma.consent.create({
      data: {
        patientId,
        dataSharing: dataSharing ?? true,
        analytics: analytics ?? true,
        research: research ?? false,
        marketing: marketing ?? false,
      },
    });

    // Log consent update
    await auditService.logEvent({
      eventType: 'CONSENT_UPDATED',
      resourceType: 'Consent',
      resourceId: consent.id,
      userId: req.user?.id,
      patientId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      facility: req.user?.facility,
      dataHash: createHash(JSON.stringify(consent)),
      metadata: {
        dataSharing,
        analytics,
        research,
        marketing,
      },
    });

    res.json({
      success: true,
      message: 'Consent updated successfully',
      data: consent,
    });
  });

  getPatientEncounters = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [encounters, total] = await Promise.all([
      prisma.encounter.findMany({
        where: { patientId },
        skip,
        take,
        include: {
          observations: true,
          medications: true,
          clinician: {
            select: {
              firstName: true,
              lastName: true,
              facility: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.encounter.count({ where: { patientId } }),
    ]);

    res.json({
      success: true,
      data: {
        encounters,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });
}