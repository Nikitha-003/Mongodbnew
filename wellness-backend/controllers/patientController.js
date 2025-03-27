const Patient = require('../models/Patient');

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    // If user is a patient, only return their own record
    if (req.user && req.user.userType === 'patient') {
      const patient = await Patient.findOne({ email: req.user.email });
      return res.json(patient ? [patient] : []);
    }
    
    // For doctors and admins, return all patients
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get next patient ID
exports.getNextPatientId = async (req, res) => {
  try {
    // Find the patient with the highest patient_id
    const lastPatient = await Patient.findOne().sort({ patient_id: -1 });
    
    if (!lastPatient) {
      // If no patients exist, start with P001
      return res.json({ nextId: 'P001' });
    }
    
    // Extract the numeric part and increment
    const lastId = lastPatient.patient_id;
    const numericPart = parseInt(lastId.substring(1));
    const nextNumericPart = numericPart + 1;
    const nextId = 'P' + nextNumericPart.toString().padStart(3, '0');
    
    res.json({ nextId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single patient
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // If user is a patient, only allow access to their own record
    if (req.user && req.user.userType === 'patient' && patient.email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient prescription
exports.getPrescription = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // If user is a patient, only allow access to their own prescription
    if (req.user && req.user.userType === 'patient' && patient.email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(patient.prescription || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new patient
exports.createPatient = async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    const savedPatient = await newPatient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a patient
// In the updatePatient function
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log the incoming data to debug
    console.log('Updating patient with data:', req.body);
    
    // Make sure prescriptions are included in the update
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      {
        ...req.body,
        // Ensure prescriptions are explicitly included
        prescriptions: req.body.prescriptions || []
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.status(200).json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a patient
exports.deletePatient = async (req, res) => {
  try {
    const deletedPatient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!deletedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate prescription
exports.generatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionData = req.body;
    
    const patient = await Patient.findById(id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    patient.prescription = prescriptionData;
    await patient.save();
    
    res.json({ message: 'Prescription generated successfully', prescription: patient.prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
