require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || '4371056fabcb0502e5f9fdcb5e4ba943ee5a0d16a2bcbc55289e95448bfe58f8af5e1e43c0369095b01ddfb4a7',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};