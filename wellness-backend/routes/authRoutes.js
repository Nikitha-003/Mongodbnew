const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
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

module.exports = router;