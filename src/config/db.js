const mongoose = require('mongoose');
const { logger } = require('./logger');

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    logger.error('MONGO_URI is not set in environment variables');
    throw new Error('Missing MONGO_URI');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  logger.info('Connected to MongoDB');
}

module.exports = { connectToDatabase };

