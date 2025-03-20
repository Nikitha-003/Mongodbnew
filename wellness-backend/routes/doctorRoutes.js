const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeDoctor } = require('../middleware/authMiddleware');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Get appointment requests for a doctor
router.get('/appointment-requests', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    console.log(`Fetching appointment requests for doctor ID: ${req.user.id}`);
    
    // Find all patients with pending appointments for this doctor
    const patients = await Patient.find({
      'appointments.doctorId': req.user.id,
      'appointments.status': { $in: ['Pending', 'scheduled'] } // Check for both status values
    });
    
    console.log(`Found ${patients.length} patients with pending appointments`);
    
    // Extract and format the appointment requests
    const appointmentRequests = [];
    patients.forEach(patient => {
      const doctorAppointments = patient.appointments.filter(
        appt => appt.doctorId && 
               appt.doctorId.toString() === req.user.id && 
               (appt.status === 'Pending' || appt.status === 'scheduled')
      );
      
      doctorAppointments.forEach(appointment => {
        appointmentRequests.push({
          id: appointment._id,
          patientId: patient._id,
          patientName: patient.name,
          date: appointment.date,
          time: appointment.time,
          department: appointment.department || 'General',
          reason: appointment.reason,
          status: appointment.status
        });
      });
    });
    
    console.log(`Found ${appointmentRequests.length} appointment requests`);
    res.json(appointmentRequests);
  } catch (error) {
    console.error('Error fetching appointment requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Approve an appointment
router.put('/appointments/:id/approve', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    const { patientId } = req.body;
    const appointmentId = req.params.id;
    
    console.log(`Approving appointment ${appointmentId} for patient ${patientId}`);
    
    // Find the patient with this appointment
    const patient = await Patient.findOne({
      'appointments._id': appointmentId
    });
    
    if (!patient) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Update the appointment status
    const appointmentIndex = patient.appointments.findIndex(
      appt => appt._id.toString() === appointmentId
    );
    
    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    patient.appointments[appointmentIndex].status = 'approved';
    await patient.save();
    
    // Also update the doctor's appointments
    const doctor = await Doctor.findById(req.user.id);
    if (doctor) {
      if (!doctor.appointments) {
        doctor.appointments = [];
      }
      
      // Add this appointment to doctor's list if not already there
      const existingIndex = doctor.appointments.findIndex(
        appt => appt.patientId === patient._id.toString() && 
               appt.appointmentId === appointmentId
      );
      
      if (existingIndex === -1) {
        doctor.appointments.push({
          appointmentId: appointmentId,
          patientId: patient._id,
          patientName: patient.name,
          date: patient.appointments[appointmentIndex].date,
          time: patient.appointments[appointmentIndex].time,
          reason: patient.appointments[appointmentIndex].reason,
          status: 'approved'
        });
        
        await doctor.save();
      }
    }
    
    res.json({ message: 'Appointment approved successfully' });
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reject an appointment
router.put('/appointments/:id/reject', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    const { patientId } = req.body;
    const appointmentId = req.params.id;
    
    console.log(`Rejecting appointment ${appointmentId} for patient ${patientId}`);
    
    // Find the patient with this appointment
    const patient = await Patient.findOne({
      'appointments._id': appointmentId
    });
    
    if (!patient) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Update the appointment status
    const appointmentIndex = patient.appointments.findIndex(
      appt => appt._id.toString() === appointmentId
    );
    
    if (appointmentIndex === -1) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    patient.appointments[appointmentIndex].status = 'rejected';
    await patient.save();
    
    res.json({ message: 'Appointment rejected successfully' });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get doctor's appointments
router.get('/appointments', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    console.log(`Fetching appointments for doctor ID: ${req.user.id}`);
    
    // Find the doctor to get their appointments
    const doctor = await Doctor.findById(req.user.id);
    
    if (!doctor || !doctor.appointments) {
      return res.json([]);
    }
    
    // Make sure we're returning an array
    const appointments = Array.isArray(doctor.appointments) ? doctor.appointments : [];
    
    console.log(`Found ${appointments.length} appointments`);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this route to get all doctors
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all doctors');
    const doctors = await Doctor.find().select('-password'); // Ensure password is not returned
    console.log(`Found ${doctors.length} doctors`);
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;