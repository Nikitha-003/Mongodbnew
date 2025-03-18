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

// Logger functions
const logger = {
  error: (message, error) => {
    const logMessage = `[${formatDate()}] ERROR: ${message} ${error ? '- ' + error.stack : ''}\n`;
    errorLogStream.write(logMessage);
    console.error(message, error);
  },
  
  info: (message) => {
    const logMessage = `[${formatDate()}] INFO: ${message}\n`;
    accessLogStream.write(logMessage);
    console.log(message);
  },
  
  request: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logMessage = `[${formatDate()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms\n`;
      accessLogStream.write(logMessage);
    });
    
    next();
  }
};

module.exports = logger;