const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePatient } = require('../middleware/authMiddleware');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const patientController = require('../controllers/patientController');

// Get all patients - Add this new route
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching all patients');
    const patients = await Patient.find().select('-password');
    console.log(`Found ${patients.length} patients`);
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get patient profile
router.get('/profile', authenticateToken, authorizePatient, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get patient appointments
router.get('/appointments', authenticateToken, authorizePatient, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient.appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get patient prescriptions
router.get('/prescriptions', authenticateToken, authorizePatient, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient.prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Book an appointment
router.post('/appointments', authenticateToken, authorizePatient, async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create new appointment
    const newAppointment = {
      doctorId,
      doctorName: doctor.name,
      date: new Date(date),
      time,
      reason,
      status: 'scheduled'
    };
    
    // Add to patient's appointments
    patient.appointments.push(newAppointment);
    await patient.save();
    
    res.status(201).json({ 
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;