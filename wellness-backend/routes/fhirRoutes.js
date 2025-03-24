const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const FHIRPatient = require('../models/FHIRPatient');
const FHIRObservation = require('../models/FHIRObservation');
const Patient = require('../models/Patient');
const { v4: uuidv4 } = require('uuid');

// Helper function to convert your Patient model to FHIR format
const convertToFHIRPatient = (patient) => {
  return {
    resourceType: 'Patient',
    id: patient._id.toString(),
    identifier: [
      {
        system: 'http://wellness-dashboard.com/patients',
        value: patient.patient_id || `P${Math.floor(Math.random() * 10000)}`
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: patient.name.split(' ').slice(-1)[0] || '',
        given: patient.name.split(' ').slice(0, -1) || [patient.name]
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: patient.phone || '',
        use: 'home'
      },
      {
        system: 'email',
        value: patient.email || '',
        use: 'work'
      }
    ],
    gender: patient.gender ? patient.gender.toLowerCase() : 'unknown',
    birthDate: patient.dob || '',
    address: [
      {
        use: 'home',
        line: [patient.address || ''],
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    ]
  };
};

// Get all FHIR Patients
router.get('/Patient', authenticateToken, async (req, res) => {
  try {
    // First check if we have FHIR patients
    let fhirPatients = await FHIRPatient.find();
    
    // If no FHIR patients, convert from regular patients
    if (fhirPatients.length === 0) {
      const patients = await Patient.find();
      
      // Convert regular patients to FHIR format
      const convertedPatients = patients.map(convertToFHIRPatient);
      
      // Return converted patients without saving them
      return res.json(convertedPatients);
    }
    
    res.json(fhirPatients);
  } catch (error) {
    console.error('Error fetching FHIR patients:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get FHIR Patient by ID
router.get('/Patient/:id', authenticateToken, async (req, res) => {
  try {
    const fhirPatient = await FHIRPatient.findOne({ id: req.params.id });
    
    if (!fhirPatient) {
      // Try to find in regular patients and convert
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      return res.json(convertToFHIRPatient(patient));
    }
    
    res.json(fhirPatient);
  } catch (error) {
    console.error('Error fetching FHIR patient:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new FHIR Patient
router.post('/Patient', authenticateToken, async (req, res) => {
  try {
    const fhirData = req.body;
    
    // Ensure it has the required FHIR structure
    if (fhirData.resourceType !== 'Patient') {
      return res.status(400).json({ message: 'Invalid FHIR resource type' });
    }
    
    // Generate ID if not provided
    if (!fhirData.id) {
      fhirData.id = uuidv4();
    }
    
    const fhirPatient = new FHIRPatient(fhirData);
    const savedPatient = await fhirPatient.save();
    
    res.status(201).json(savedPatient);
  } catch (error) {
    console.error('Error creating FHIR patient:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all FHIR Observations
router.get('/Observation', authenticateToken, async (req, res) => {
  try {
    const observations = await FHIRObservation.find();
    res.json(observations);
  } catch (error) {
    console.error('Error fetching FHIR observations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get FHIR Observations for a specific patient
router.get('/Observation', authenticateToken, async (req, res) => {
  try {
    const patientId = req.query.patient;
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    const observations = await FHIRObservation.find({
      'subject.reference': `Patient/${patientId}`
    });
    
    res.json(observations);
  } catch (error) {
    console.error('Error fetching FHIR observations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new FHIR Observation
router.post('/Observation', authenticateToken, async (req, res) => {
  try {
    const fhirData = req.body;
    
    // Ensure it has the required FHIR structure
    if (fhirData.resourceType !== 'Observation') {
      return res.status(400).json({ message: 'Invalid FHIR resource type' });
    }
    
    // Generate ID if not provided
    if (!fhirData.id) {
      fhirData.id = uuidv4();
    }
    
    const fhirObservation = new FHIRObservation(fhirData);
    const savedObservation = await fhirObservation.save();
    
    res.status(201).json(savedObservation);
  } catch (error) {
    console.error('Error creating FHIR observation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add these new routes after your existing routes

// Create a new FHIR resource
router.post('/resources', authenticateToken, async (req, res) => {
  try {
    const resource = req.body;
    
    // Validate the resource has required fields
    if (!resource.resourceType) {
      return res.status(400).json({ message: 'Resource must have a resourceType' });
    }
    
    // Generate a UUID if no ID is provided
    if (!resource.id) {
      resource.id = uuidv4();
    }
    
    // Store in the appropriate collection based on resourceType
    let result;
    if (resource.resourceType === 'Patient') {
      // Check if patient already exists
      const existingPatient = await FHIRPatient.findOne({ id: resource.id });
      if (existingPatient) {
        return res.status(409).json({ message: 'Patient with this ID already exists' });
      }
      result = await FHIRPatient.create(resource);
    } 
    else if (resource.resourceType === 'Observation') {
      // Check if observation already exists
      const existingObservation = await FHIRObservation.findOne({ id: resource.id });
      if (existingObservation) {
        return res.status(409).json({ message: 'Observation with this ID already exists' });
      }
      result = await FHIRObservation.create(resource);
    }
    else {
      return res.status(400).json({ message: 'Unsupported resourceType' });
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating FHIR resource:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific FHIR resource by ID
router.get('/:resourceType/:id', authenticateToken, async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    
    let result;
    if (resourceType === 'Patient') {
      result = await FHIRPatient.findOne({ id });
    } 
    else if (resourceType === 'Observation') {
      result = await FHIRObservation.findOne({ id });
    }
    else {
      return res.status(400).json({ message: 'Unsupported resourceType' });
    }
    
    if (!result) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Error fetching ${req.params.resourceType}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Update a FHIR resource
router.put('/:resourceType/:id', authenticateToken, async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    const resource = req.body;
    
    // Ensure the resource type and ID match the URL
    if (resource.resourceType !== resourceType || resource.id !== id) {
      return res.status(400).json({ 
        message: 'Resource type and ID in body must match URL parameters' 
      });
    }
    
    let result;
    if (resourceType === 'Patient') {
      result = await FHIRPatient.findOneAndUpdate({ id }, resource, { 
        new: true, 
        runValidators: true 
      });
    } 
    else if (resourceType === 'Observation') {
      result = await FHIRObservation.findOneAndUpdate({ id }, resource, { 
        new: true, 
        runValidators: true 
      });
    }
    else {
      return res.status(400).json({ message: 'Unsupported resourceType' });
    }
    
    if (!result) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Error updating ${req.params.resourceType}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a FHIR resource
router.delete('/:resourceType/:id', authenticateToken, async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    
    let result;
    if (resourceType === 'Patient') {
      result = await FHIRPatient.findOneAndDelete({ id });
    } 
    else if (resourceType === 'Observation') {
      result = await FHIRObservation.findOneAndDelete({ id });
    }
    else {
      return res.status(400).json({ message: 'Unsupported resourceType' });
    }
    
    if (!result) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error(`Error deleting ${req.params.resourceType}:`, error);
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;