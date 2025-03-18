require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// REMOVE DUPLICATE ROUTE REGISTRATIONS HERE
// Register routes - only register once
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/patients', patientRoutes);

// Add a route to check API status
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 errors for routes that don't exist
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Server error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Connect to MongoDB
mongoose.connect(config.MONGO_URI || process.env.MONGODB_URI, {
  // Remove deprecated options
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connection successful');
  // Log the connection string (with password masked)
  const connectionString = (config.MONGO_URI || process.env.MONGODB_URI || '').replace(/:([^:@]+)@/, ':****@');
  console.log('Connected to:', connectionString);
  
  // Test the connection by listing collections
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
    } else {
      console.log('Available collections:', collections.map(c => c.name).join(', '));
      
      // Check if users collection exists
      if (collections.some(c => c.name === 'users')) {
        // Count users in the collection
        mongoose.connection.db.collection('users').countDocuments((err, count) => {
          if (err) {
            console.error('Error counting users:', err);
          } else {
            console.log(`Users collection contains ${count} documents`);
            
            // If there are users, log the first few to verify data
            if (count > 0) {
              mongoose.connection.db.collection('users').find({}).limit(3).toArray((err, users) => {
                if (err) {
                  console.error('Error fetching sample users:', err);
                } else {
                  // Log user emails for verification (don't log passwords)
                  console.log('Sample users:', JSON.stringify(users.map(u => ({ 
                    email: u.email, 
                    userType: u.userType,
                    name: u.name,
                    _id: u._id.toString()
                  })), null, 2));
                }
              });
            }
          }
        });
      } else {
        console.log('Warning: users collection does not exist yet');
        
        // Check database name to ensure we're connected to the right database
        console.log('Current database:', mongoose.connection.db.databaseName);
        
        // Create users collection if it doesn't exist
        mongoose.connection.db.createCollection('users', (err, result) => {
          if (err) {
            console.error('Error creating users collection:', err);
          } else {
            console.log('Created users collection:', result.collectionName);
          }
        });
      }
    }
  });
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.error('Error details:', err.message);
  
  // Check if it's an authentication error
  if (err.message.includes('Authentication failed')) {
    console.error('Authentication failed. Please check your MongoDB username and password.');
  }
  
  // Check if it's a connection error
  if (err.message.includes('ECONNREFUSED')) {
    console.error('Connection refused. Please check if MongoDB is running and the connection string is correct.');
  }
  
  // Log the connection string (with password masked) for debugging
  const connectionString = (config.MONGO_URI || process.env.MONGODB_URI || '').replace(/:([^:@]+)@/, ':****@');
  console.error('Attempted to connect to:', connectionString);
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ Connection error:"));
db.once("open", () => console.log("✅ Connected to MongoDB Atlas"));

// REMOVE DUPLICATE ROUTE REGISTRATIONS HERE
// These routes are already registered above, so remove these lines
// app.use('/', authRoutes);
// app.use('/admin', adminRoutes);
// app.use('/patients', patientRoutes);

// Start Server
// Start the server with port fallback and error handling
const PORT = process.env.PORT || config.PORT || 3000;

// Function to find an available port
const startServer = (port) => {
  try {
    const server = app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`API available at: http://localhost:${port}/api/status`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is already in use, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('❌ Server error:', error);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

// Start the server
startServer(PORT);