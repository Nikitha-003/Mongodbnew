const Patient = require('./Patient');

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single patient by ID
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new patient
exports.createPatient = async (req, res) => {
  try {
    const patientData = req.body;
    const patient = new Patient(patientData);
    await patient.save();
    
    // Return the complete patient data
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a patient
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      id, 
      updates, 
      { new: true }
    );
    
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Return the complete updated patient
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a patient
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPatient = await Patient.findByIdAndDelete(id);
    
    if (!deletedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search patients
exports.searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const patients = await Patient.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { patient_id: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate prescription PDF
exports.generatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { prescription_pdf } = req.body;
    
    const patient = await Patient.findById(id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Update the prescription PDF
    patient.prescription_pdf = prescription_pdf;
    await patient.save();
    
    res.json({ message: 'Prescription generated successfully', patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};