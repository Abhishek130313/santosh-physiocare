const ContactMessage = require('../models/ContactMessage');
const { sendMail } = require('../utils/email');

async function createContactMessage(req, res, next) {
  try {
    const message = await ContactMessage.create(req.body);

    sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Contact Message',
      html: `<p>New message from ${message.name} (${message.email})</p><p>${message.message}</p>`
    });
    sendMail({
      to: message.email,
      subject: 'We received your message',
      html: `<p>Hi ${message.name}, thanks for contacting us. We'll get back to you soon.</p>`
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
}

async function listContactMessages(req, res, next) {
  try {
    const items = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

module.exports = { createContactMessage, listContactMessages };

