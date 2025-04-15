import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';

const AddPatientForm = ({ onPatientAdded }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [isSearching, setIsSearching] = useState(false);

  // Initial patient data state with only required sections
  const [patientData, setPatientData] = useState({
    patient_id: "",
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    blood_group: "",
    medical_history: [{ condition: "", diagnosed_on: "" }],
    // appointments: [{ date: "", time: "10:00", doctor: "", department: "", status: "Pending" }],
  });

  // Add prescription state
  const [prescriptions, setPrescriptions] = useState([
    { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  // Function to search for a patient by ID
  const searchPatient = async () => {
    if (!patientData.patient_id) {
      setNotification({
        show: true,
        message: "Please enter a patient ID to search",
        type: "error"
      });
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${config.API_URL}/patients/search/${patientData.patient_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // In the searchPatient function where you setPatientData
      if (response.data) {
      // Get appointment reason from the first appointment
      const appointmentReason = response.data.appointments?.[0]?.reason || "General Consultation";
      
      // Auto-fill the medical history with appointment reason
      setPatientData({
        ...response.data,
        medical_history: [{
          condition: appointmentReason,
          diagnosed_on: new Date().toISOString().split('T')[0] // Current date
        }],
        appointments: response.data.appointments || []
      });
      
        // Set prescriptions if they exist
        if (response.data.prescriptions && response.data.prescriptions.length > 0) {
          setPrescriptions(response.data.prescriptions);
        }

        setNotification({
          show: true,
          message: "Patient found! Form has been filled with their details.",
          type: "success"
        });
      }
    } catch (error) {
      console.error("Error searching for patient:", error);
      setNotification({
        show: true,
        message: error.response?.data?.message || "Patient not found. Please check the ID.",
        type: "error"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input changes for patient data
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData({ ...patientData, [name]: value });
  };

  // Handle medical history changes
  const handleMedicalHistoryChange = (index, field, value) => {
    const updatedHistory = [...patientData.medical_history];
    updatedHistory[index] = { ...updatedHistory[index], [field]: value };
    setPatientData({ ...patientData, medical_history: updatedHistory });
  };

  // Add more medical history fields
  const addMedicalHistory = () => {
    setPatientData({
      ...patientData,
      medical_history: [...patientData.medical_history, { condition: "", diagnosed_on: "" }]
    });
  };

  // Remove medical history field
  const removeMedicalHistory = (index) => {
    const updatedHistory = [...patientData.medical_history];
    updatedHistory.splice(index, 1);
    setPatientData({ ...patientData, medical_history: updatedHistory });
  };

  // Handle prescription changes
  const handlePrescriptionChange = (index, field, value) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = { ...updatedPrescriptions[index], [field]: value };
    setPrescriptions(updatedPrescriptions);
    
    // Log the updated prescription for debugging
    console.log(`Updated prescription ${index}, field: ${field}, value: ${value}`);
    console.log('Current prescriptions state:', updatedPrescriptions);
  };

  // Add more prescription fields
  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  // Remove prescription field
  const removePrescription = (index) => {
    const updatedPrescriptions = prescriptions.filter((_, i) => i !== index);
    setPrescriptions(updatedPrescriptions);
  };
  
  

  // Handle appointment changes
  // const handleAppointmentChange = (index, field, value) => {
  //   const updatedAppointments = [...patientData.appointments];
  //   updatedAppointments[index] = { ...updatedAppointments[index], [field]: value };
  //   setPatientData({ ...patientData, appointments: updatedAppointments });
  // };

  // Add more appointment fields
  // const addAppointment = () => {
  //   setPatientData({
  //     ...patientData,
  //     appointments: [...patientData.appointments, { date: "", time: "10:00", doctor: "", department: "", status: "Pending" }]
  //   });
  // };

  // Remove appointment field
  // const removeAppointment = (index) => {
  //   const updatedAppointments = [...patientData.appointments];
  //   updatedAppointments.splice(index, 1);
  //   setPatientData({ ...patientData, appointments: updatedAppointments });
  // };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate prescriptions data
      const validPrescriptions = prescriptions.filter(p => 
        p.medicine.trim() !== '' || p.dosage.trim() !== '' || 
        p.frequency.trim() !== '' || p.duration.trim() !== '' || 
        p.instructions.trim() !== ''
      );
      
      // Create a complete patient data object that includes prescriptions
      const completePatientData = {
        ...patientData,
        prescriptions: validPrescriptions
      };
      
      console.log('Submitting patient data with prescriptions:', completePatientData);
      
      let response;
      
      if (patientData._id) {
        // Update existing patient
        response = await axios.put(
          `${config.API_URL}/patients/${patientData._id}`, 
          completePatientData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setNotification({
          show: true,
          message: "Patient updated successfully!",
          type: "success"
        });
      } else {
        // Create new patient
        response = await axios.post(
          `${config.API_URL}/patients`, 
          completePatientData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setNotification({
          show: true,
          message: "Patient added successfully!",
          type: "success"
        });
      }
      
      console.log('Server response:', response.data);
      
      // If onPatientAdded callback exists, call it
      if (onPatientAdded) {
        onPatientAdded(response.data);
      }
      
      // Reset form or navigate away after short delay
      setTimeout(() => {
        navigate("/patients");
      }, 2000);
      
    } catch (error) {
      console.error("Error saving patient:", error);
      
      setNotification({
        show: true,
        message: error.response?.data?.message || "Failed to save patient. Please try again.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Add New Patient</h2>
      
      {notification.show && (
        <div className={`p-4 mb-4 rounded-md ${notification.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {notification.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Patient ID Search Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID
              </label>
              <input
                type="text"
                name="patient_id"
                value={patientData.patient_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Enter patient ID to search"
              />
            </div>
            <button
              type="button"
              onClick={searchPatient}
              disabled={isSearching}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
          </p>
        </div>
        
        {/* Basic Information Section - Read-only after search */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={patientData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                readOnly={!!patientData._id}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={patientData.age}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                readOnly={!!patientData._id}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={patientData.gender}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                disabled={!!patientData._id}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={patientData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                readOnly={!!patientData._id}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={patientData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                readOnly={!!patientData._id}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              <select
                name="blood_group"
                value={patientData.blood_group}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                disabled={!!patientData._id}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={patientData.address}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              rows="3"
              readOnly={!!patientData._id}
            ></textarea>
          </div>
        </div>
        
        {/* Medical History Section - Always editable */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Medical History</h3>
          {patientData.medical_history.map((history, index) => (
            <div key={index} className="mb-4 p-3 border rounded-md bg-white">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Condition {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeMedicalHistory(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={history.condition}
                    onChange={(e) => handleMedicalHistoryChange(index, "condition", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnosed On
                  </label>
                  <input
                    type="date"
                    value={history.diagnosed_on}
                    onChange={(e) => handleMedicalHistoryChange(index, "diagnosed_on", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addMedicalHistory}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Medical History
          </button>
        </div>
        
        {/* Prescriptions Section - Always editable */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Prescriptions</h3>
          {prescriptions.map((prescription, index) => (
            <div key={index} className="mb-4 p-3 border rounded-md bg-white">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Prescription {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removePrescription(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine
                  </label>
                  <input
                    type="text"
                    value={prescription.medicine}
                    onChange={(e) => handlePrescriptionChange(index, "medicine", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={prescription.dosage}
                    onChange={(e) => handlePrescriptionChange(index, "dosage", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={prescription.frequency}
                    onChange={(e) => handlePrescriptionChange(index, "frequency", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={prescription.duration}
                    onChange={(e) => handlePrescriptionChange(index, "duration", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={prescription.instructions}
                  onChange={(e) => handlePrescriptionChange(index, "instructions", e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows="2"
                ></textarea>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPrescription}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Prescription
          </button>
        </div>
        
        {/* Appointments Section - Always editable
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Appointments</h3>
          {patientData.appointments.map((appointment, index) => (
            <div key={index} className="mb-4 p-3 border rounded-md bg-white">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Appointment {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeAppointment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={appointment.date}
                    onChange={(e) => handleAppointmentChange(index, "date", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={appointment.time}
                    onChange={(e) => handleAppointmentChange(index, "time", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor
                  </label>
                  <input
                    type="text"
                    value={appointment.doctor}
                    onChange={(e) => handleAppointmentChange(index, "doctor", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={appointment.department}
                    onChange={(e) => handleAppointmentChange(index, "department", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={appointment.status}
                    onChange={(e) => handleAppointmentChange(index, "status", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addAppointment}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Appointment
          </button>
        </div> */}
        
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isSubmitting ? "Saving..." : patientData._id ? "Update Patient" : "Add Patient"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm;