require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'wellness-portal-secure-jwt-secret-key',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};