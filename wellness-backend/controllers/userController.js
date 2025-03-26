const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const JWT_SECRET = process.env.JWT_SECRET || "b2f8f5934a9d6e587d12d3a49d45a495c627a20e11fe7787d8b040fbf770d9cf6b3a48cd5512b4ed97fdee12fc850ad13caa8eb5c21090cc00f097e331e692cf";

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { email, password, userType, name, department } = req.body;
    
    console.log('Attempting to register user:', { email, userType, name, department });
    
    // Validate required fields
    if (!email || !password || !userType || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check if user already exists in any collection
    let existingUser = null;
    
    if (userType === 'doctor') {
      existingUser = await Doctor.findOne({ email });
    } else if (userType === 'patient') {
      existingUser = await Patient.findOne({ email });
    } else if (userType === 'admin') {
      existingUser = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }
    
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create new user based on userType
    let savedUser;
    
    if (userType === 'doctor') {
      // Ensure department is set for doctors
      if (!department) {
        return res.status(400).json({ message: "department is required for doctors" });
      }
      
      const doctor = new Doctor({
        email,
        password,
        name,
        department: department // Ensure department is set
      });
      
      savedUser = await doctor.save();
      console.log('Doctor created successfully:', savedUser.email);
    } else if (userType === 'patient') {
      // Get next patient ID
      const lastPatient = await Patient.findOne().sort({ patient_id: -1 });
      let patientId = 'P001';
      
      if (lastPatient) {
        const lastId = lastPatient.patient_id;
        const numericPart = parseInt(lastId.substring(1));
        const nextNumericPart = numericPart + 1;
        patientId = 'P' + nextNumericPart.toString().padStart(3, '0');
      }
      
      const patient = new Patient({
        patient_id: patientId,
        email,
        password,
        name
      });
      savedUser = await patient.save();
    } else if (userType === 'admin') {
      const admin = new User({
        email,
        password,
        name
      });
      savedUser = await admin.save();
    }
    
    console.log('User registered successfully:', savedUser._id);
    res.status(201).json({ message: "User registered successfully" });
    
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    console.log(`Login attempt for email: ${email}, userType: ${userType}`);
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    let user = null;
    
    // Find user based on userType
    if (userType === 'doctor') {
      user = await Doctor.findOne({ email });
    } else if (userType === 'patient') {
      user = await Patient.findOne({ email });
    } else if (userType === 'admin') {
      user = await User.findOne({ email, userType: 'admin' });
    }
    
    if (!user) {
      console.log(`No ${userType} found with email: ${email}`);
      return res.status(401).json({ message: `Invalid ${userType} credentials` });
    }
    
    // Compare password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log(`Password mismatch for ${email}`);
      return res.status(401).json({ message: `Invalid ${userType} credentials` });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    console.log(`Login successful for ${email}`);
    
    // Return user info and token
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Get users from all collections
    const admins = await User.find({}, '-password');
    const doctors = await Doctor.find({}, '-password');
    const patients = await Patient.find({}, '-password');
    
    // Combine all users
    const allUsers = [...admins, ...doctors, ...patients];
    
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating password through this route
    if (updates.password) {
      delete updates.password;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
