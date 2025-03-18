const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const logger = require('./utils/logger');
const { securityHeaders } = require('./middleware/securityMiddleware');

// Import config
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const patientRoutes = require('./routes/patientRoutes');

const app = express();
app.use(express.json({ limit: '50mb' })); // Increased limit for larger PDF files
app.use(cors({
  origin: config.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Connect to MongoDB
mongoose.connect(config.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connection successful');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ Connection error:"));
db.once("open", () => console.log("✅ Connected to MongoDB Atlas"));

// Use routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/patients', patientRoutes);

// Add request logging middleware
app.use(logger.request);

// Add security headers
app.use(securityHeaders);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', err);
  res.status(500).json({ message: 'Something went wrong' });
});

// Start Server
app.listen(config.PORT, () => console.log(`🚀 Server running on port ${config.PORT}`));