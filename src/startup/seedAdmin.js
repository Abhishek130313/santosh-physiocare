const AdminUser = require('../models/AdminUser');
const { logger } = require('../config/logger');

async function seedAdminUserIfNeeded() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin bootstrap');
    return;
  }

  const existing = await AdminUser.findOne({ email }).select('_id');
  if (existing) {
    logger.info('Admin user already exists');
    return;
  }

  await AdminUser.create({ email, password, name: 'Administrator' });
  logger.info('Admin user bootstrapped');
}

module.exports = { seedAdminUserIfNeeded };

