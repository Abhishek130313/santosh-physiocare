const Appointment = require('../models/Appointment');
const { sendMail } = require('../utils/email');
const AppError = require('../utils/appError');

async function createAppointment(req, res, next) {
  try {
    const appointment = await Appointment.create(req.body);

    // Email notifications (best-effort)
    sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Appointment Request',
      html: `<p>New appointment from ${appointment.name} for ${appointment.serviceType} at ${appointment.dateTime.toISOString()}</p>`
    });
    sendMail({
      to: appointment.email,
      subject: 'Appointment Request Received',
      html: `<p>Hi ${appointment.name}, we received your request. We'll confirm shortly.</p>`
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
}

async function listAppointments(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [items, total] = await Promise.all([
      Appointment.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Appointment.countDocuments(query)
    ]);
    res.json({ items, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (error) {
    next(error);
  }
}

async function updateAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) throw AppError.notFound('Appointment not found');
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

module.exports = { createAppointment, listAppointments, updateAppointmentStatus };

