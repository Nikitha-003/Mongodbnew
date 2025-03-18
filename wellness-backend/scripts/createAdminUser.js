require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@wellness.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.connection.close();
      return;
    }
    
    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@wellness.com',
      password: 'admin123',  // This will be hashed by the pre-save hook
      userType: 'admin'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully');
    
    // Close connection
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
  }
};

createAdminUser();