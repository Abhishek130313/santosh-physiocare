import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';
import { config } from '@/config/config';

// Helper function to validate request data
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(createError(errorMessage, 400));
    }
    
    next();
  };
};

// Authentication validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(1).required().messages({
    'string.min': 'Password is required',
    'any.required': 'Password is required',
  }),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  }),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  role: Joi.string().valid('CLINICIAN', 'KIOSK', 'PUBLIC_HEALTH', 'AUDITOR').required(),
  licenseNumber: Joi.string().when('role', {
    is: 'CLINICIAN',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  facility: Joi.string().max(100).optional(),
  department: Joi.string().max(100).optional(),
});

// Patient validation schemas
const patientEnrollmentSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').required(),
  birthDate: Joi.date().max('now').required().messages({
    'date.max': 'Birth date cannot be in the future',
  }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  email: Joi.string().email().optional(),
  abhaId: Joi.string().pattern(/^\d{2}-\d{4}-\d{4}-\d{4}$/).optional().messages({
    'string.pattern.base': 'ABHA ID must be in format: XX-XXXX-XXXX-XXXX',
  }),
  stateId: Joi.string().max(20).optional(),
  addressLine1: Joi.string().max(100).optional(),
  addressLine2: Joi.string().max(100).optional(),
  district: Joi.string().valid(...config.kerala.districts).optional(),
  taluk: Joi.string().max(50).optional(),
  village: Joi.string().max(50).optional(),
  pincode: Joi.string().pattern(/^\d{6}$/).optional().messages({
    'string.pattern.base': 'Pincode must be 6 digits',
  }),
  originState: Joi.string().max(50).optional(),
  originDistrict: Joi.string().max(50).optional(),
  workSite: Joi.string().max(200).optional(),
  employerName: Joi.string().max(100).optional(),
  employerContact: Joi.string().max(100).optional(),
  preferredLanguage: Joi.string().valid(...config.languages.supported).default(config.languages.default),
  emergencyName: Joi.string().max(50).optional(),
  emergencyPhone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  emergencyRelation: Joi.string().max(30).optional(),
});

const patientUpdateSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  email: Joi.string().email().optional(),
  addressLine1: Joi.string().max(100).optional(),
  addressLine2: Joi.string().max(100).optional(),
  district: Joi.string().valid(...config.kerala.districts).optional(),
  taluk: Joi.string().max(50).optional(),
  village: Joi.string().max(50).optional(),
  pincode: Joi.string().pattern(/^\d{6}$/).optional(),
  workSite: Joi.string().max(200).optional(),
  employerName: Joi.string().max(100).optional(),
  employerContact: Joi.string().max(100).optional(),
  emergencyName: Joi.string().max(50).optional(),
  emergencyPhone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  emergencyRelation: Joi.string().max(30).optional(),
});

// Encounter validation schemas
const encounterSchema = Joi.object({
  patientId: Joi.string().required(),
  type: Joi.string().max(100).optional(),
  priority: Joi.string().valid('routine', 'urgent', 'emergency').default('routine'),
  chiefComplaint: Joi.string().max(500).optional(),
  diagnosis: Joi.string().max(500).optional(),
  treatment: Joi.string().max(1000).optional(),
  notes: Joi.string().max(2000).optional(),
  facility: Joi.string().max(100).optional(),
  department: Joi.string().max(50).optional(),
  observations: Joi.array().items(
    Joi.object({
      code: Joi.string().required(),
      display: Joi.string().required(),
      valueString: Joi.string().optional(),
      valueNumber: Joi.number().optional(),
      valueBoolean: Joi.boolean().optional(),
      valueDateTime: Joi.date().optional(),
      unit: Joi.string().optional(),
      interpretation: Joi.string().optional(),
      notes: Joi.string().max(500).optional(),
    })
  ).optional(),
  medications: Joi.array().items(
    Joi.object({
      medicationName: Joi.string().required(),
      dosageText: Joi.string().optional(),
      frequency: Joi.string().optional(),
      duration: Joi.string().optional(),
      instructions: Joi.string().max(500).optional(),
    })
  ).optional(),
});

// Observation validation schemas
const observationSchema = Joi.object({
  encounterId: Joi.string().required(),
  code: Joi.string().required(),
  display: Joi.string().required(),
  category: Joi.string().optional(),
  valueString: Joi.string().optional(),
  valueNumber: Joi.number().optional(),
  valueBoolean: Joi.boolean().optional(),
  valueDateTime: Joi.date().optional(),
  unit: Joi.string().optional(),
  referenceRangeHigh: Joi.number().optional(),
  referenceRangeLow: Joi.number().optional(),
  interpretation: Joi.string().optional(),
  notes: Joi.string().max(500).optional(),
  effectiveDateTime: Joi.date().default('now'),
});

// Immunization validation schemas
const immunizationSchema = Joi.object({
  patientId: Joi.string().required(),
  vaccineCode: Joi.string().required(),
  vaccineName: Joi.string().required(),
  manufacturer: Joi.string().optional(),
  lotNumber: Joi.string().optional(),
  expirationDate: Joi.date().optional(),
  doseNumber: Joi.number().integer().min(1).optional(),
  seriesDoses: Joi.number().integer().min(1).optional(),
  site: Joi.string().optional(),
  route: Joi.string().optional(),
  performer: Joi.string().optional(),
  facility: Joi.string().optional(),
  occurrenceDateTime: Joi.date().default('now'),
});

// Consent validation schemas
const consentSchema = Joi.object({
  dataSharing: Joi.boolean().default(true),
  analytics: Joi.boolean().default(true),
  research: Joi.boolean().default(false),
  marketing: Joi.boolean().default(false),
});

// Search and pagination validation
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const searchSchema = paginationSchema.keys({
  q: Joi.string().min(1).max(100).optional(),
  district: Joi.string().valid(...config.kerala.districts).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string().optional(),
  type: Joi.string().optional(),
});

// File upload validation
const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(createError('No file uploaded', 400));
  }

  const file = req.file;
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return next(createError('File size too large. Maximum 10MB allowed.', 400));
  }

  // Check file type
  const allowedTypes = config.upload.allowedTypes.map(type => {
    switch (type) {
      case 'pdf': return 'application/pdf';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return type;
    }
  });

  if (!allowedTypes.includes(file.mimetype)) {
    return next(createError(`Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`, 400));
  }

  next();
};

// Export validation middleware
export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);
export const validatePatientEnrollment = validate(patientEnrollmentSchema);
export const validatePatientUpdate = validate(patientUpdateSchema);
export const validateEncounter = validate(encounterSchema);
export const validateObservation = validate(observationSchema);
export const validateImmunization = validate(immunizationSchema);
export const validateConsent = validate(consentSchema);
export const validatePagination = validate(paginationSchema);
export const validateSearch = validate(searchSchema);
export { validateFileUpload };

// Custom validation helpers
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

export const validateABHAId = (abhaId: string): boolean => {
  const abhaRegex = /^\d{2}-\d{4}-\d{4}-\d{4}$/;
  return abhaRegex.test(abhaId);
};