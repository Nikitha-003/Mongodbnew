const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  patient_id: String,
  name: String,
  age: Number,
  gender: String,
  medical_history: [
    {
      condition: String,
      diagnosed_on: String,
    },
  ],
  appointments: [
    {
      date: String,
      doctor: String,
      department: String,
    },
  ],
  diagnostics: [
    {
      test_name: String,
      result: String,
      date: String,
    },
  ],
  mental_health: [
    {
      session_notes: String,
      evaluation: String,
      therapist: String,
    },
  ],
  physiotherapy: [
    {
      progress_log: String,
      session_date: String,
    },
  ],
  nutrition: [
    {
      dietary_plan: String,
      calorie_intake: Number,
      progress: String,
    },
  ],
  yoga: [
    {
      session_plan: String,
      wearable_data: String,
    },
  ],
});

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;