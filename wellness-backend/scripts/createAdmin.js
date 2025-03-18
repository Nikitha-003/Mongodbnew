require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@wellness.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.disconnect();
      return;
    }
    
    // Create admin user
    const admin = new User({
      email: 'admin@wellness.com',
      password: 'admin123',  // This will be hashed by the pre-save hook
      name: 'System Admin',
      userType: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created successfully');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminUser();