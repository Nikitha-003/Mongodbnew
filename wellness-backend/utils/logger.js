const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create log file streams
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Format date for logs
const formatDate = () => {
  return new Date().toISOString();
};

// Simple logger utility
const logger = {
  request: (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  },
  
  error: (message, error) => {
    console.error(`${new Date().toISOString()} - ERROR: ${message}`, error);
  },
  
  info: (message) => {
    console.log(`${new Date().toISOString()} - INFO: ${message}`);
  }
};

module.exports = logger;