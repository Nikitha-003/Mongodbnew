const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeDoctor } = require('../middleware/authMiddleware');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// Get appointment requests for a doctor
router.get('/appointment-requests', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    console.log(`Fetching appointment requests for doctor ID: ${req.user.id}`);
    
    // Find the doctor to get their name
    const currentDoctor = await Doctor.findById(req.user.id);
    if (!currentDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
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
        // In the appointment request handler
        appointmentRequests.push({
          id: appointment._id,
          patientId: patient.patient_id,  // Change from patient._id
          patientName: patient.name,
          date: appointment.date,
          time: appointment.time,
          department: appointment.department || 'General',
          doctorName: currentDoctor.name, // Use currentDoctor instead of doctor
          reason: appointment.reason,
          status: appointment.status
        });
      });
    });
    
    res.json(appointmentRequests);
  } catch (error) {
    console.error('Error fetching appointment requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Approve an appointment
router.put('/appointments/:id/approve', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    console.log(`Approving appointment ID: ${appointmentId} for doctor ID: ${req.user.id}`);
    
    // Find the doctor to get their name - renamed to currentDoctor to avoid duplicate declaration
    const currentDoctor = await Doctor.findById(req.user.id);
    if (!currentDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Find the patient with this appointment
    const patient = await Patient.findOne({ 'appointments._id': appointmentId });

    if (!patient) {
      console.error(`No patient found with appointment ID: ${appointmentId}`);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Find the specific appointment in the patient's appointments array
    const appointment = patient.appointments.id(appointmentId);
    
    if (!appointment) {
      console.error(`Appointment ID ${appointmentId} not found in patient's appointments`);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update the appointment status to 'approved' and add doctor name
    appointment.status = 'approved';
    appointment.doctorName = currentDoctor.name; // Use currentDoctor instead of doctor
    
    // Save the patient document with the updated appointment
    await patient.save();
    
    // Find the doctor to add this appointment to their list
    const doctor = await Doctor.findById(req.user.id);
    
    if (doctor) {
      // Initialize appointments array if it doesn't exist
      if (!doctor.appointments) {
        doctor.appointments = [];
      }
      
      // Add the appointment to the doctor's list if not already there
      const existingAppointment = doctor.appointments.find(
        appt => appt.appointmentId && appt.appointmentId.toString() === appointmentId
      );
      
      if (!existingAppointment) {
        doctor.appointments.push({
          patientId: patient._id,
          patientName: patient.name,
          appointmentId: appointmentId,
          date: appointment.date,
          time: appointment.time,
          department: appointment.department || 'General',
          reason: appointment.reason,
          status: 'approved'
        });
        
        await doctor.save();
      }
    }

    console.log(`Appointment ${appointmentId} successfully approved`);
    res.json({ message: 'Appointment approved successfully' });
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reject an appointment
router.put('/appointments/:id/reject', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    console.log(`Rejecting appointment ID: ${appointmentId} for doctor ID: ${req.user.id}`);

    const patient = await Patient.findOne({ 'appointments._id': appointmentId });
    if (!patient) {
      console.error(`Patient not found for appointment ID: ${appointmentId}`);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = patient.appointments.id(appointmentId);
    if (!appointment) {
      console.error(`Appointment not found in patient's record for ID: ${appointmentId}`);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update status to lowercase 'rejected'
    appointment.status = 'rejected';
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
    const doctor = await Doctor.findById(req.user.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Return the doctor's appointments
    res.json(doctor.appointments || []);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Server error' });
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

// Get patients for the logged-in doctor only
// Add authorization middleware to the appointments endpoint
router.get('/my-patients', authenticateToken, authorizeDoctor, async (req, res) => {
  try {
    const patients = await Patient.find({
      'appointments.doctorId': req.user.id
    }).select('name patient_id appointments');
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;