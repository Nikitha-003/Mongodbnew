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

// Add or update this POST route for creating patients
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating new patient with data:', JSON.stringify(req.body, null, 2));
    
    // Check for required fields
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        errors: {
          name: !name ? { message: 'Name is required' } : undefined,
          email: !email ? { message: 'Email is required' } : undefined,
          password: !password ? { message: 'Password is required' } : undefined
        }
      });
    }
    
    // Create a new patient instance
    const newPatient = new Patient(req.body);
    
    // Validate the patient data
    const validationError = newPatient.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationError.errors 
      });
    }
    
    // Save the patient
    const savedPatient = await newPatient.save();
    console.log('Patient saved successfully with ID:', savedPatient._id);
    
    res.status(201).json(savedPatient);
  } catch (error) {
    console.error('Error creating patient:', error);
    
    // Check for duplicate key error (e.g., email already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate field error',
        errors: {
          [Object.keys(error.keyPattern)[0]]: {
            message: `This ${Object.keys(error.keyPattern)[0]} is already in use`
          }
        }
      });
    }
    
    // Send more detailed error information
    res.status(500).json({ 
      message: 'Error creating patient',
      error: error.message
    });
  }
});

// Add these new routes for patient operations

// Get a single patient by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching patient with ID: ${req.params.id}`);
    const patient = await Patient.findById(req.params.id).select('-password');
    
    if (!patient) {
      console.log(`Patient with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    console.log(`Found patient: ${patient.name}`);
    res.json(patient);
  } catch (error) {
    console.error(`Error fetching patient ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Update a patient
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`Updating patient with ID: ${req.params.id}`);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Find the patient first to check if it exists
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      console.log(`Patient with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Update the patient
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log(`Patient updated successfully: ${updatedPatient.name}`);
    res.json(updatedPatient);
  } catch (error) {
    console.error(`Error updating patient ${req.params.id}:`, error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    // Check for duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate field error',
        errors: {
          [Object.keys(error.keyPattern)[0]]: {
            message: `This ${Object.keys(error.keyPattern)[0]} is already in use`
          }
        }
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Delete a patient - Ensure the route path is correct
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`Attempting to delete patient with ID: ${req.params.id}`);
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      console.log(`Patient with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Patient not found' });
    }
    console.log(`Patient with ID ${req.params.id} deleted successfully`);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error(`Error deleting patient ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Add prescription to a patient
router.put('/:id/prescription', authenticateToken, async (req, res) => {
  try {
    console.log(`Adding prescription to patient with ID: ${req.params.id}`);
    console.log('Prescription data:', JSON.stringify(req.body, null, 2));
    
    // Find the patient first to check if it exists
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      console.log(`Patient with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Add the prescription to the patient
    patient.prescriptions.push(req.body);
    await patient.save();
    
    console.log(`Prescription added successfully to patient: ${patient.name}`);
    res.json(patient);
  } catch (error) {
    console.error(`Error adding prescription to patient ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get patient's prescription
router.get('/:id/prescription', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching prescriptions for patient with ID: ${req.params.id}`);
    
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      console.log(`Patient with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    console.log(`Found ${patient.prescriptions.length} prescriptions for patient: ${patient.name}`);
    res.json(patient.prescriptions);
  } catch (error) {
    console.error(`Error fetching prescriptions for patient ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Add or update this route for creating appointments
router.post('/appointments', authenticateToken, async (req, res) => {
  try {
    const { date, time, reason, department, doctorId } = req.body;
    
    // Validate required fields
    if (!date || !time || !doctorId) {
      return res.status(400).json({ message: 'Date, time, and doctor are required' });
    }
    
    // Find the patient
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create new appointment
    const newAppointment = {
      date,
      time,
      reason,
      department,
      doctorId, // Make sure doctorId is stored
      status: 'Pending'
    };
    
    // Add to patient's appointments
    if (!patient.appointments) {
      patient.appointments = [];
    }
    
    patient.appointments.push(newAppointment);
    await patient.save();
    
    console.log(`Appointment created for patient ${patient.name} with doctor ${doctorId}`);
    
    res.status(201).json({ 
      message: 'Appointment created successfully',
      appointment: patient.appointments[patient.appointments.length - 1]
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: error.message });
  }
});
// Update or add the route for fetching departments
router.get('/doctors/departments', authenticateToken, async (req, res) => {
  try {
    const doctors = await Doctor.find();
    // Only use specialization field and filter out empty values
    const departments = [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))];
    
    // Don't add General Physician as default if no departments found
    res.status(200).json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;