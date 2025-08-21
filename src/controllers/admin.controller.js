async function getDashboardStats(req, res, next) {
  try {
    const Appointment = require('../models/Appointment');
    const Review = require('../models/Review');
    const Service = require('../models/Service');

    const [appointments, pendingReviews, services] = await Promise.all([
      Appointment.countDocuments(),
      Review.countDocuments({ approved: false }),
      Service.countDocuments()
    ]);

    res.json({ appointments, pendingReviews, services });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboardStats };

