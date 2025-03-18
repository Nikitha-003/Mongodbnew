const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "wellness-portal-secret-key";

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

// Admin authorization middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Doctor authorization middleware
const isDoctor = (req, res, next) => {
  if (req.user && req.user.userType === 'doctor') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Doctor privileges required.' });
  }
};

// Patient authorization middleware
const isPatient = (req, res, next) => {
  if (req.user && req.user.userType === 'patient') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Patient privileges required.' });
  }
};

module.exports = { authenticateToken, isAdmin, isDoctor, isPatient };