const AdminUser = require('../models/AdminUser');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/appError');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email }).select('+password');
    if (!admin) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid credentials');
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signToken({ sub: admin._id.toString(), role: 'admin' });
    res.json({ token });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };

