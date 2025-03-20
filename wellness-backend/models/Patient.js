const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the appointment schema first since it's used in the patient schema
// Update the appointment schema to properly handle doctorId
const appointmentSchema = new mongoose.Schema({
  date: String,
  time: String,
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  department: String,
  reason: String,
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'scheduled', 'approved', 'rejected'],
    default: 'Pending'
  }
});

// Use a single prescription schema - renamed to avoid conflicts
const medicationSchema = new mongoose.Schema({
  medicine: String,
  dosage: String,
  frequency: String,
  duration: String,
  instructions: String
}, { _id: false });

// Define the full prescription schema
const prescriptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  diagnosis: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  instructions: String,
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  doctorName: String
});

// Update your patient schema
const patientSchema = new mongoose.Schema({
  patient_id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    default: 'patient',
    enum: ['patient']
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']  // Updated to match your frontend values
  },
  phone: {  // Added to match frontend field name
    type: String
  },
  contactNumber: {  // Keep for backward compatibility
    type: String
  },
  address: {
    type: String
  },
  blood_group: {  // Added to match frontend field
    type: String
  },
  medical_history: [{  // Changed to match frontend field name
    condition: String,
    diagnosed_on: String  // Changed to match frontend field name
  }],
  appointments: [appointmentSchema],
  // Add both types of prescriptions
  prescriptions: [prescriptionSchema],
  medications: [medicationSchema],  // Add simple medications array
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
patientSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
patientSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Patient", patientSchema);