const { StatusCodes } = require('http-status-codes');
const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const AdminUser = require('../models/AdminUser');

// Authenticate admin using Bearer token
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      throw AppError.forbidden('Not authorized');
    }

    const admin = await AdminUser.findById(payload.sub).select('-password');
    if (!admin) {
      throw AppError.unauthorized('Admin no longer exists');
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error.statusCode ? error : AppError.unauthorized('Invalid token'));
  }
}

module.exports = { authenticateAdmin };

