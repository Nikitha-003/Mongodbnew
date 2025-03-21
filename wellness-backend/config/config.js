require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001, // Change from 3000 to 3001
  MONGO_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'a8c87dfab0c5326f0776610ed5dee0ccbaa544ad5c831a83fc3b029781c65dda8bfce5ca5aca573f095bd86a17781804e7648f7a66270d9f2b79b8c1190bfbe5',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5174' // Update to match your frontend port
};