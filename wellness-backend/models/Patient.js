const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the appointment schema first since it's used in the patient schema
const appointmentSchema = new mongoose.Schema({
  date: String,
  time: String,
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  doctorName: String, // Add this field if it doesn't exist
  department: {
    type: String,
    default: 'General'
  },
  reason: String,
  status: {
    type: String,
    enum: ['scheduled', 'approved', 'rejected', 'completed', 'cancelled', 'Pending'],
    default: 'scheduled'
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
// Make sure the prescription schema includes all fields
const prescriptionSchema = new mongoose.Schema({
  medicine: { type: String, required: false },
  dosage: { type: String, required: false },
  frequency: { type: String, required: false },
  duration: { type: String, required: false },
  instructions: { type: String, required: false },
  // Add any other fields you need
});

// Make sure prescriptions are included in the patient schema
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
  try {
    // Use bcrypt.compare to check if the provided password matches the stored hash
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

module.exports = mongoose.model("Patient", patientSchema);