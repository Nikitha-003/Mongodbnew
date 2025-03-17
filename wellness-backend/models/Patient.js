const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  medicine: String,
  dosage: String,
  frequency: String,
  duration: String,
  instructions: String
});

const patientSchema = new mongoose.Schema({
  patient_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  // Add new fields
  phone: {
    type: String
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  blood_group: {
    type: String
  },
  // Existing fields
  medical_history: [
    {
      condition: String,
      diagnosis_date: String
    }
  ],
  appointments: [
    {
      date: String,
      time: String,
      doctor: String,
      department: String,
      status: String
    }
  ],
  prescriptions: [prescriptionSchema],
  prescription_pdf: String
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;