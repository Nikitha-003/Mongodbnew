const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "b2f8f5934a9d6e587d12d3a49d45a495c627a20e11fe7787d8b040fbf770d9cf6b3a48cd5512b4ed97fdee12fc850ad13caa8eb5c21090cc00f097e331e692cf";

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { email, password, userType, name, specialization } = req.body;
    
    console.log('Attempting to register user:', { email, userType, name, specialization });
    
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
      // Ensure specialization is set for doctors
      if (!specialization) {
        return res.status(400).json({ message: "Specialization is required for doctors" });
      }
      
      const doctor = new Doctor({
        email,
        password,
        name,
        specialization: specialization // Ensure specialization is set
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
    
    console.log('Login attempt:', { email, userType });
    
    // Find user by email and userType in the appropriate collection
    let user = null;
    
    if (userType === 'doctor') {
      user = await Doctor.findOne({ email });
    } else if (userType === 'patient') {
      user = await Patient.findOne({ email });
    } else if (userType === 'admin') {
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token with all necessary user information
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        userType: user.userType, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' } // Extend token expiration to 24 hours
    );
    
    console.log('Login successful for:', email, 'userType:', user.userType);
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        name: user.name
      }
    });
    
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: error.message });
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