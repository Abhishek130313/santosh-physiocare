const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || 'no-reply@example.com';
  try {
    const info = await getTransporter().sendMail({ from, to, subject, html, text });
    logger.info('Email sent', { messageId: info.messageId, to, subject });
  } catch (error) {
    logger.error('Failed to send email', { error, to, subject });
    // Do not throw to avoid failing the entire request due to email problems
  }
}

module.exports = { sendMail };

