require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json({ limit: '50mb' })); // Increased limit for larger PDF files
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "wellness-portal-secret-key";

// Connect to MongoDB (Use Atlas connection from .env)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connection successful');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ Connection error:"));
db.once("open", () => console.log("✅ Connected to MongoDB Atlas"));

// Import models
const Patient = require('./models/Patient');
const User = require('./models/User');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Authentication Routes
app.post("/register", async (req, res) => {
  try {
    const { email, password, userType, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      userType,
      name
    });
    
    await user.save();
    
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    // Find user by email and userType
    const user = await User.findOne({ email, userType });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: user.userType, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patients sorted by patient_id
app.get("/patients", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ patient_id: 1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// IMPORTANT: Order matters for routes with parameters
// This route must come before any routes with :id parameter
app.get("/patients/next-id", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ patient_id: -1 }).limit(1);
    const lastId = patients.length > 0 ? parseInt(patients[0].patient_id.substring(1)) : 0;
    const nextId = `P${String(lastId + 1).padStart(3, '0')}`;
    res.json({ nextId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new patient
app.post("/patients", async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    const savedPatient = await newPatient.save();
    res.json(savedPatient); // Send back the saved patient data
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Prescription endpoint - must come before generic :id routes
app.get("/patients/:id/prescription", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching prescription for patient ID:", id);
    
    const patient = await Patient.findById(id);
    
    if (!patient) {
      console.log("Patient not found:", id);
      return res.status(404).json({ message: "Patient not found" });
    }
    
    if (!patient.prescription_pdf) {
      console.log("No prescription found for patient:", patient.patient_id);
      return res.status(404).json({ message: "No prescription found for this patient" });
    }
    
    console.log("Found prescription for patient:", patient.patient_id);
    
    // If the prescription is stored as a data URI
    if (patient.prescription_pdf.startsWith('data:application/pdf;base64,')) {
      // Extract the base64 data
      const base64Data = patient.prescription_pdf.split(',')[1];
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="prescription_${patient.patient_id}.pdf"`);
      
      // Send the PDF data
      return res.send(pdfBuffer);
    }
    
    // If it's just a base64 string without the data URI prefix
    const pdfBuffer = Buffer.from(patient.prescription_pdf, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="prescription_${patient.patient_id}.pdf"`);
    return res.send(pdfBuffer);
    
  } catch (error) {
    console.error("Error retrieving prescription:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Patient
app.put("/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Patient
app.delete("/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPatient = await Patient.findByIdAndDelete(id);
    if (!deletedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json({ message: "Patient deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));