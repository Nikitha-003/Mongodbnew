// Make sure you have this route in your adminRoutes.js file
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Make sure this import is present

// Get all users (admin only)
router.get('/users', authenticateToken, isAdmin, userController.getAllUsers);

// Get user by ID (admin only)
router.get('/users/:id', authenticateToken, isAdmin, userController.getUserById);

// Update user (admin only)
router.put('/users/:id', authenticateToken, isAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, isAdmin, userController.deleteUser);

// Stats route for admin dashboard
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get all users and count them manually to debug
    const allUsers = await User.find({});
    console.log('Total users found:', allUsers.length);
    
    // Log each user's userType to see what's actually in the database
    allUsers.forEach(user => {
      console.log(`User ${user.email} has userType: "${user.userType}"`);
    });
    
    // Count manually
    let doctorCount = 0;
    let patientCount = 0;
    
    allUsers.forEach(user => {
      if (user.userType === 'doctor') doctorCount++;
      if (user.userType === 'patient') patientCount++;
    });
    
    console.log(`Manual counts: Total=${allUsers.length}, Doctors=${doctorCount}, Patients=${patientCount}`);
    
    res.json({
      totalUsers: allUsers.length,
      doctors: doctorCount,
      patients: patientCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;