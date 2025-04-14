const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', userController.registerUser);

// Login user
router.post('/login', userController.loginUser);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const Patient = require('../models/Patient');
    
    let user = null;
    
    if (req.user.userType === 'doctor') {
      user = await Doctor.findById(req.user.id).select('-password');
    } else if (req.user.userType === 'patient') {
      user = await Patient.findById(req.user.id).select('-password');
    } else if (req.user.userType === 'admin') {
      user = await User.findById(req.user.id).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add dashboard endpoints
router.get('/patients/age-distribution', authenticateToken, dashboardController.getPatientAgeDistribution);
router.get('/patients/gender-distribution', authenticateToken, dashboardController.getPatientGenderDistribution);

// Update the patients route to handle both age and DOB values
router.get('/patients', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or doctor
    if (req.user.userType !== 'admin' && req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }
    
    const Patient = require('../models/Patient');
    
    // Get all patients with necessary fields for the dashboard
    // Update the fields selection to include age
    const patients = await Patient.find({}, 'patient_id name dob age gender email phone');
    
    // Format the response to ensure dates are properly formatted and ages are calculated
    const formattedPatients = patients.map(patient => {
      const patientObj = patient.toObject();
      
      // If patient has a numeric age but no DOB, calculate a birthdate
      if (patientObj.age && !patientObj.dob) {
        const today = new Date();
        const birthYear = today.getFullYear() - parseInt(patientObj.age);
        // Set to January 1st of the birth year for consistency
        patientObj.dob = `${birthYear}-01-01`;
      }
      // If patient has DOB, ensure it's in ISO format
      else if (patientObj.dob) {
        try {
          // Try to create a valid date object
          const dobDate = new Date(patientObj.dob);
          
          // Check if the date is valid
          if (!isNaN(dobDate.getTime())) {
            patientObj.dob = dobDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }
        } catch (error) {
          console.error(`Error formatting DOB for patient ${patientObj.name}:`, error);
        }
      }
      
      return patientObj;
    });
    
    res.json(formattedPatients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;