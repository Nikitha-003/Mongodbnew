const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Get all users (admin only)
router.get('/users', authenticateToken, authorizeAdmin, userController.getAllUsers);

// Stats route for admin dashboard
router.get('/stats', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    console.log('Fetching admin stats');
    
    // Count users in each collection
    const adminCount = await User.countDocuments();
    const doctorCount = await Doctor.countDocuments();
    const patientCount = await Patient.countDocuments();
    
    console.log(`Stats: admins=${adminCount}, doctors=${doctorCount}, patients=${patientCount}`);
    
    res.json({
      totalUsers: adminCount + doctorCount + patientCount,
      admins: adminCount,
      doctors: doctorCount,
      patients: patientCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', authenticateToken, authorizeAdmin, userController.getUserById);

// Update user (admin only)
router.put('/users/:id', authenticateToken, authorizeAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, authorizeAdmin, userController.deleteUser);

module.exports = router;