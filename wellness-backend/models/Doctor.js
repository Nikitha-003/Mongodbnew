const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const doctorSchema = new mongoose.Schema({
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
    default: 'doctor',
    enum: ['doctor']
  },
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true // Make it required to ensure it's set during creation
  },
  experience: {
    type: Number,
    default: 0
  },
  contactNumber: {
    type: String
  },
  availability: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

doctorSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Doctor = mongoose.model("Doctor", doctorSchema, "doctors");

module.exports = Doctor;