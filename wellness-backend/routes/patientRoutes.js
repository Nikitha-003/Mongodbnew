const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePatient } = require('../middleware/authMiddleware');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const patientController = require('../controllers/patientController');

// Get all patients
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
router.get('/profile', authenticateToken, async (req, res) => {
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

// Update patient profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, age, gender, blood_group } = req.body;
    
    console.log('Updating profile for user:', req.user.id);
    console.log('Update data:', req.body);
    
    // Find the patient by ID
    const patient = await Patient.findById(req.user.id);
    
    if (!patient) {
      console.log('Patient not found with ID:', req.user.id);
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Update patient fields
    if (name) patient.name = name;
    if (phone) patient.phone = phone;
    if (address) patient.address = address;
    if (age) patient.age = parseInt(age) || patient.age; // Convert to number if possible
    if (gender) patient.gender = gender;
    if (blood_group) patient.blood_group = blood_group;
    
    // Email is a unique field, so we need to check if it's already in use
    if (email && email !== patient.email) {
      const existingPatient = await Patient.findOne({ email });
      if (existingPatient && existingPatient._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      patient.email = email;
    }
    
    // Save the updated patient
    await patient.save();
    
    // Return the updated patient without the password
    const updatedPatient = patient.toObject();
    delete updatedPatient.password;
    
    console.log('Profile updated successfully');
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get patient appointments
router.get('/appointments', authenticateToken, async (req, res) => {
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

// Get appointments for the logged-in patient
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching appointments for patient ID: ${req.user.id}`);
    
    // Find the patient by user ID
    const patient = await Patient.findById(req.user.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Return only the current patient's appointments
    const patientAppointments = patient.appointments || [];
    console.log(`Found ${patientAppointments.length} appointments for patient ${patient.name}`);
    
    res.json(patientAppointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient medical history
router.get('/medical-history', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching medical history for patient ID:', req.user.id);
    
    // Find the patient by ID
    const patient = await Patient.findById(req.user.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Return the medical history array from the patient document
    // If it doesn't exist or is empty, return an empty array
    const medicalHistory = patient.medical_history || [];
    
    // Format the data to match the frontend expectations
    const formattedHistory = medicalHistory.map(item => ({
      id: item._id,
      condition: item.condition,
      diagnosedOn: item.diagnosed_on,
      notes: item.notes || ''
    }));
    
    console.log(`Found ${formattedHistory.length} medical conditions`);
    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ message: 'Error fetching medical history' });
  }
});

// Get patient prescriptions
router.get('/prescriptions', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching prescriptions for patient ID:', req.user.id);
    
    // Find the patient by ID
    const patient = await Patient.findById(req.user.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Return the prescriptions array from the patient document
    // If it doesn't exist or is empty, return an empty array
    const prescriptions = patient.prescriptions || [];
    
    // Format the data to match the frontend expectations
    const formattedPrescriptions = prescriptions.map(prescription => {
      // Find the doctor who prescribed it
      const doctorName = prescription.doctorName || 'Unknown Doctor';
      
      return {
        id: prescription._id,
        date: prescription.date,
        doctor: doctorName,
        diagnosis: prescription.diagnosis || 'General Consultation',
        medications: Array.isArray(prescription.medications) 
          ? prescription.medications.map(med => ({
              name: med.medicine || med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration
            }))
          : [{
              name: prescription.medicine,
              dosage: prescription.dosage,
              frequency: prescription.frequency,
              duration: prescription.duration
            }],
        instructions: prescription.instructions || '',
        followUpDate: prescription.followUpDate
      };
    });
    
    console.log(`Found ${formattedPrescriptions.length} prescriptions`);
    res.json(formattedPrescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
});

// Get departments
router.get('/doctors/departments', authenticateToken, async (req, res) => {
  try {
    const doctors = await Doctor.find();
    // Only use department field and filter out empty values
    const departments = [...new Set(doctors.map(doctor => doctor.department).filter(Boolean))];
    
    // Don't add General Physician as default if no departments found
    res.status(200).json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book an appointment
router.post('/appointments', authenticateToken, async (req, res) => {
  try {
    const { date, time, doctorId, department, reason } = req.body;
    
    // Log the incoming appointment data
    console.log('Booking appointment with data:', { date, time, doctorId, department, reason });
    
    // Validate required fields
    if (!date || !time || !reason) {
      return res.status(400).json({ message: 'Date, time, and reason are required' });
    }
    
    // Find the patient by ID from the token
    const patient = await Patient.findById(req.user.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // If doctorId is provided, get the doctor's name
    let doctorName = null;
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        doctorName = doctor.name;
      }
    }
    
    // Create a new appointment
    const newAppointment = {
      date,
      time,
      doctorId: doctorId || null,
      doctorName: doctorName, // Add doctor name
      department: department || 'General',
      reason,
      status: 'scheduled'
    };
    
    // Add the appointment to the patient's appointments array
    patient.appointments.push(newAppointment);
    
    // Save the patient with the new appointment
    await patient.save();
    
    res.status(201).json({ 
      message: 'Appointment booked successfully',
      appointment: patient.appointments[patient.appointments.length - 1]
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

// Add this route before the /:id routes
// Search patient by patient_id
router.get('/search/:patient_id', authenticateToken, async (req, res) => {
  try {
    console.log(`Searching for patient with patient_id: ${req.params.patient_id}`);
    
    const patient = await Patient.findOne({ patient_id: req.params.patient_id }).select('-password');
    
    if (!patient) {
      console.log(`Patient with patient_id ${req.params.patient_id} not found`);
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    console.log(`Found patient: ${patient.name}`);
    res.json(patient);
  } catch (error) {
    console.error(`Error searching for patient ${req.params.patient_id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// ROUTES WITH PATH PARAMETERS BELOW THIS LINE

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
    const updatedData = {
      ...req.body,
      address: req.body.address,
      blood_group: req.body.blood_group
    };
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a patient
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

// 2. Create a Route to Add Prescriptions with Condition References

// Add a route to create a prescription linked to a medical condition
router.post('/patients/:patientId/prescriptions', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medications, instructions, conditionId, doctorId } = req.body;
    
    // Find the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Find the condition to get its date
    const condition = patient.medical_history.id(conditionId);
    if (!condition) {
      return res.status(404).json({ message: 'Medical condition not found' });
    }
    
    // Create the prescription with the condition reference
    const prescription = {
      medications,
      instructions,
      conditionId,
      relatedCondition: condition.condition,
      date: condition.diagnosedOn,
      doctor: doctorId
    };
    
    // Add the prescription to the patient
    patient.prescriptions.push(prescription);
    await patient.save();
    
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
