const mongoose = require('mongoose');

const { MONGODB_URI } = require('./env');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.error(`Database connection error: ${error.message}`);
      process.exit(1);
    }
    console.error(`Database connection error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}. Retrying...`);
    setTimeout(() => connectDB(attempt + 1), RETRY_DELAY_MS);
  }
};

module.exports = connectDB;