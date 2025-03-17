const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// Get all patients
router.get('/patients', patientController.getAllPatients);

// Get a single patient
router.get('/patients/:id', patientController.getPatientById);

// Create a new patient
router.post('/patients', patientController.createPatient);

// Update a patient
router.put('/patients/:id', patientController.updatePatient);

// Delete a patient
router.delete('/patients/:id', patientController.deletePatient);

module.exports = router;