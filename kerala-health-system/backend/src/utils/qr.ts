import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Patient } from '@prisma/client';
import { generateQRPayload } from './crypto';
import { config } from '@/config/config';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export const generateQRCode = async (data: string, options: QRCodeOptions = {}): Promise<Buffer> => {
  const qrOptions = {
    type: 'png' as const,
    width: options.size || 300,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'M' as const,
  };

  return QRCode.toBuffer(data, qrOptions);
};

export const generatePatientQRCode = async (patient: Patient): Promise<Buffer> => {
  const qrPayload = generateQRPayload(patient.id);
  const qrUrl = `${config.frontend.url}/patient/${patient.id}?qr=${qrPayload}`;
  
  return generateQRCode(qrUrl, {
    size: 300,
    margin: 2,
  });
};

export interface SmartCardData {
  patient: Patient;
  qrCode: Buffer;
  cardNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
}

export const generateSmartCardPDF = async (data: SmartCardData): Promise<Buffer> => {
  const { patient, qrCode, cardNumber, issueDate, expiryDate } = data;
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([297, 210]); // A4 landscape (297x210mm in points)
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Colors
  const primaryColor = rgb(0.2, 0.4, 0.8); // Blue
  const secondaryColor = rgb(0.1, 0.6, 0.3); // Green
  const textColor = rgb(0.2, 0.2, 0.2); // Dark gray
  
  // Card dimensions
  const cardWidth = 280;
  const cardHeight = 180;
  const cardX = (297 - cardWidth) / 2;
  const cardY = (210 - cardHeight) / 2;
  
  // Draw card background
  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: rgb(1, 1, 1),
    borderColor: primaryColor,
    borderWidth: 2,
  });
  
  // Header section
  page.drawRectangle({
    x: cardX,
    y: cardY + cardHeight - 40,
    width: cardWidth,
    height: 40,
    color: primaryColor,
  });
  
  // Government logos placeholders
  page.drawText('[KERALA_GOVT_LOGO]', {
    x: cardX + 10,
    y: cardY + cardHeight - 25,
    size: 8,
    font: font,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('[GOVT_OF_INDIA_LOGO]', {
    x: cardX + cardWidth - 80,
    y: cardY + cardHeight - 25,
    size: 8,
    font: font,
    color: rgb(1, 1, 1),
  });
  
  // Title
  page.drawText('Kerala Digital Health Card', {
    x: cardX + 90,
    y: cardY + cardHeight - 25,
    size: 14,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  // Patient photo placeholder
  page.drawRectangle({
    x: cardX + 20,
    y: cardY + cardHeight - 120,
    width: 60,
    height: 70,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: textColor,
    borderWidth: 1,
  });
  
  page.drawText('PHOTO', {
    x: cardX + 35,
    y: cardY + cardHeight - 85,
    size: 8,
    font: font,
    color: textColor,
  });
  
  // Patient information
  const infoX = cardX + 100;
  let infoY = cardY + cardHeight - 60;
  const lineHeight = 12;
  
  // Name (in preferred language)
  const displayName = `${patient.firstName} ${patient.lastName}`;
  page.drawText('Name:', {
    x: infoX,
    y: infoY,
    size: 9,
    font: boldFont,
    color: textColor,
  });
  
  page.drawText(displayName, {
    x: infoX + 35,
    y: infoY,
    size: 9,
    font: font,
    color: textColor,
  });
  
  infoY -= lineHeight;
  
  // Gender and Age
  const birthDate = new Date(patient.birthDate);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  
  page.drawText(`Gender: ${patient.gender}`, {
    x: infoX,
    y: infoY,
    size: 8,
    font: font,
    color: textColor,
  });
  
  page.drawText(`Age: ${age}`, {
    x: infoX + 80,
    y: infoY,
    size: 8,
    font: font,
    color: textColor,
  });
  
  infoY -= lineHeight;
  
  // Phone
  if (patient.phone) {
    page.drawText(`Phone: ${patient.phone}`, {
      x: infoX,
      y: infoY,
      size: 8,
      font: font,
      color: textColor,
    });
    infoY -= lineHeight;
  }
  
  // Address
  if (patient.district) {
    page.drawText(`District: ${patient.district}`, {
      x: infoX,
      y: infoY,
      size: 8,
      font: font,
      color: textColor,
    });
    infoY -= lineHeight;
  }
  
  // ABHA ID
  if (patient.abhaId) {
    page.drawText(`ABHA ID: ${patient.abhaId}`, {
      x: infoX,
      y: infoY,
      size: 8,
      font: font,
      color: textColor,
    });
    infoY -= lineHeight;
  }
  
  // Work site (for migrant workers)
  if (patient.workSite) {
    page.drawText(`Work Site: ${patient.workSite.substring(0, 25)}...`, {
      x: infoX,
      y: infoY,
      size: 8,
      font: font,
      color: textColor,
    });
  }
  
  // QR Code
  const qrImage = await pdfDoc.embedPng(qrCode);
  const qrSize = 80;
  
  page.drawImage(qrImage, {
    x: cardX + cardWidth - qrSize - 20,
    y: cardY + 20,
    width: qrSize,
    height: qrSize,
  });
  
  page.drawText('Scan for Health Records', {
    x: cardX + cardWidth - qrSize - 15,
    y: cardY + 10,
    size: 7,
    font: font,
    color: textColor,
  });
  
  // Card number and dates
  const cardNum = cardNumber || `KH-${patient.id.substring(0, 8).toUpperCase()}`;
  const issued = issueDate || new Date();
  const expires = expiryDate || new Date(Date.now() + (365 * 2 * 24 * 60 * 60 * 1000)); // 2 years
  
  page.drawText(`Card No: ${cardNum}`, {
    x: cardX + 20,
    y: cardY + cardHeight - 140,
    size: 7,
    font: font,
    color: textColor,
  });
  
  page.drawText(`Issued: ${issued.toLocaleDateString('en-IN')}`, {
    x: cardX + 20,
    y: cardY + cardHeight - 150,
    size: 7,
    font: font,
    color: textColor,
  });
  
  page.drawText(`Expires: ${expires.toLocaleDateString('en-IN')}`, {
    x: cardX + 20,
    y: cardY + cardHeight - 160,
    size: 7,
    font: font,
    color: textColor,
  });
  
  // Emergency contact
  if (patient.emergencyPhone) {
    page.drawText(`Emergency: ${patient.emergencyPhone}`, {
      x: cardX + cardWidth - 120,
      y: cardY + cardHeight - 140,
      size: 7,
      font: font,
      color: rgb(0.8, 0.2, 0.2), // Red for emergency
    });
  }
  
  // Footer
  page.drawText('Government of Kerala | Health Department', {
    x: cardX + 20,
    y: cardY + 5,
    size: 7,
    font: font,
    color: textColor,
  });
  
  page.drawText('For medical emergencies only', {
    x: cardX + cardWidth - 100,
    y: cardY + 5,
    size: 6,
    font: font,
    color: rgb(0.8, 0.2, 0.2),
  });
  
  // Serialize the PDF
  return Buffer.from(await pdfDoc.save());
};

export const generateBatchQRCodes = async (patients: Patient[]): Promise<{ patientId: string; qrCode: Buffer }[]> => {
  const results = await Promise.all(
    patients.map(async (patient) => ({
      patientId: patient.id,
      qrCode: await generatePatientQRCode(patient),
    }))
  );
  
  return results;
};