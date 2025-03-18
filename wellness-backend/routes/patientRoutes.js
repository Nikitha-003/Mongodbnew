const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, isDoctor, isAdmin } = require('../middleware/authMiddleware');

// Get all patients (doctors and admins)
router.get('/', authenticateToken, patientController.getAllPatients);

// Get next patient ID
router.get('/next-id', authenticateToken, patientController.getNextPatientId);

// Get a single patient
router.get('/:id', authenticateToken, patientController.getPatientById);

// Get patient prescription
router.get('/:id/prescription', authenticateToken, patientController.getPrescription);

// Create a new patient (doctors only)
router.post('/', authenticateToken, isDoctor, patientController.createPatient);

// Update a patient (doctors only)
router.put('/:id', authenticateToken, isDoctor, patientController.updatePatient);

// Delete a patient (doctors and admins)
router.delete('/:id', authenticateToken, (req, res, next) => {
  if (req.user.userType === 'doctor' || req.user.userType === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
}, patientController.deletePatient);

// Generate prescription (doctors only)
router.post('/:id/prescription', authenticateToken, isDoctor, patientController.generatePrescription);

module.exports = router;