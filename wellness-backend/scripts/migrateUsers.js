require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const config = require('../config/config');

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users to migrate`);
    
    let doctorCount = 0;
    let patientCount = 0;
    let adminCount = 0;
    
    // Process each user
    for (const user of users) {
      try {
        if (user.userType === 'doctor') {
          // Create a new doctor
          const doctor = new Doctor({
            email: user.email,
            password: user.password, // Already hashed
            name: user.name,
            createdAt: user.createdAt || new Date()
          });
          
          // Save without hashing the password again
          doctor.isNew = false; // This prevents the pre-save hook from running
          await doctor.save({ validateBeforeSave: false });
          doctorCount++;
          
        } else if (user.userType === 'patient') {
          // Create a new patient with a patient_id
          const patientId = `P${String(patientCount + 1).padStart(3, '0')}`;
          
          const patient = new Patient({
            patient_id: patientId,
            email: user.email,
            password: user.password, // Already hashed
            name: user.name,
            createdAt: user.createdAt || new Date()
          });
          
          // Save without hashing the password again
          patient.isNew = false; // This prevents the pre-save hook from running
          await patient.save({ validateBeforeSave: false });
          patientCount++;
          
        } else if (user.userType === 'admin') {
          // Keep admin users in the User collection
          adminCount++;
        }
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error);
      }
    }
    
    console.log(`Migration complete: ${doctorCount} doctors, ${patientCount} patients, ${adminCount} admins`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateUsers();