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

  // Initial patient data state with only required sections
  const [patientData, setPatientData] = useState({
    patient_id: "", // Will be auto-generated
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    blood_group: "",
    medical_history: [{ condition: "", diagnosed_on: "" }],
    appointments: [{ date: "", time: "10:00", doctor: "", department: "", status: "Pending" }],
  });

  // Add prescription state
  const [prescriptions, setPrescriptions] = useState([
    { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  // Generate a unique patient ID
  useEffect(() => {
    const generatePatientId = async () => {
      try {
        setIsSubmitting(true);
        
        const response = await axios.get(`${config.API_URL}/patients`, {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const patients = response.data;
        
        let highestNum = 0;
        patients.forEach(patient => {
          if (patient.patient_id) {
            const idNum = parseInt(patient.patient_id.replace('PT', ''), 10);
            if (!isNaN(idNum) && idNum > highestNum) {
              highestNum = idNum;
            }
          }
        });
        
        const newId = `PT${(highestNum + 1).toString().padStart(4, '0')}`;
        
        setPatientData(prevData => ({
          ...prevData,
          patient_id: newId
        }));
      } catch (error) {
        console.error("Error generating patient ID:", error);
        const randomId = `PT${Math.floor(1000 + Math.random() * 9000)}`;
        setPatientData(prevData => ({
          ...prevData,
          patient_id: randomId
        }));
      } finally {
        setIsSubmitting(false);
      }
    };
  
    generatePatientId();
  }, [token]);

  // Handle form input changes
  const handleInputChange = (e, field) => {
    setPatientData({
      ...patientData,
      [field]: e.target.value,
    });
  };

  // Handle medical history changes
  const handleMedicalHistoryChange = (index, field, value) => {
    const updatedHistory = [...patientData.medical_history];
    updatedHistory[index] = {
      ...updatedHistory[index],
      [field]: value,
    };
    setPatientData({
      ...patientData,
      medical_history: updatedHistory,
    });
  };

  // Add more medical history fields
  const addMedicalHistory = () => {
    setPatientData({
      ...patientData,
      medical_history: [
        ...patientData.medical_history,
        { condition: "", diagnosed_on: "" },
      ],
    });
  };

  // Remove medical history field
  const removeMedicalHistory = (index) => {
    const updatedHistory = [...patientData.medical_history];
    updatedHistory.splice(index, 1);
    setPatientData({
      ...patientData,
      medical_history: updatedHistory,
    });
  };

  // Handle appointment changes
  const handleAppointmentChange = (index, field, value) => {
    const updatedAppointments = [...patientData.appointments];
    updatedAppointments[index] = {
      ...updatedAppointments[index],
      [field]: value,
    };
    setPatientData({
      ...patientData,
      appointments: updatedAppointments,
    });
  };

  // Add more appointment fields
  const addAppointment = () => {
    setPatientData({
      ...patientData,
      appointments: [
        ...patientData.appointments,
        { date: "", time: "10:00", doctor: "", department: "", status: "Pending" },
      ],
    });
  };

  // Remove appointment field
  const removeAppointment = (index) => {
    const updatedAppointments = [...patientData.appointments];
    updatedAppointments.splice(index, 1);
    setPatientData({
      ...patientData,
      appointments: updatedAppointments,
    });
  };

  // Handle prescription changes
  const handlePrescriptionChange = (index, field, value) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value,
    };
    setPrescriptions(updatedPrescriptions);
  };

  // Add more prescription fields
  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }
    ]);
  };

  // Remove prescription field
  const removePrescription = (index) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions.splice(index, 1);
    setPrescriptions(updatedPrescriptions);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const patientToSubmit = {
        ...patientData,
        prescriptions: prescriptions
      };
      
      const response = await axios.post(
        `${config.API_URL}/patients`,
        patientToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem('token')}`
          }
        }
      );
      
      setNotification({
        show: true,
        message: "Patient added successfully!",
        type: "success"
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      
      if (onPatientAdded) {
        onPatientAdded(response.data);
      }
      
      navigate("/patients");
      
    } catch (error) {
      console.error("Error adding patient:", error);
      
      setNotification({
        show: true,
        message: "Failed to add patient. Please try again.",
        type: "error"
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {notification.show && (
        <div className={`mb-4 p-3 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      <h2 className="text-2xl font-semibold mb-6 text-blue-800">Add New Patient</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Patient ID</label>
            <input
              type="text"
              value={patientData.patient_id}
              disabled
              className="w-full px-4 py-2 border rounded-md bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={patientData.name}
              onChange={(e) => handleInputChange(e, "name")}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Age</label>
            <input
              type="number"
              value={patientData.age}
              onChange={(e) => handleInputChange(e, "age")}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Gender</label>
            <select
              value={patientData.gender}
              onChange={(e) => handleInputChange(e, "gender")}
              className="w-full px-4 py-2 border rounded-md"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={patientData.phone}
              onChange={(e) => handleInputChange(e, "phone")}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              value={patientData.email}
              onChange={(e) => handleInputChange(e, "email")}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Address</label>
            <textarea
              value={patientData.address}
              onChange={(e) => handleInputChange(e, "address")}
              className="w-full px-4 py-2 border rounded-md"
              rows="2"
            ></textarea>
          </div>
        </div>
        
        {/* Medical History Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Medical History</h3>
          {patientData.medical_history.map((history, index) => (
            <div key={index} className="flex flex-wrap mb-3 items-end">
              <div className="w-full md:w-1/2 pr-2 mb-2 md:mb-0">
                <label className="block text-gray-700 text-sm mb-1">Condition</label>
                <input
                  type="text"
                  value={history.condition}
                  onChange={(e) => handleMedicalHistoryChange(index, "condition", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="w-full md:w-1/3 pr-2 mb-2 md:mb-0">
                <label className="block text-gray-700 text-sm mb-1">Diagnosed On</label>
                <input
                  type="date"
                  value={history.diagnosed_on}
                  onChange={(e) => handleMedicalHistoryChange(index, "diagnosed_on", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => removeMedicalHistory(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  disabled={patientData.medical_history.length === 1}
                >
                  Remove
                </button>
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
        
        {/* Appointments Section - Added back */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Appointments</h3>
          {patientData.appointments.map((appointment, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 items-end bg-gray-50 p-3 rounded-md">
              <div>
                <label className="block text-gray-700 text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={appointment.date}
                  onChange={(e) => handleAppointmentChange(index, "date", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">Time</label>
                <input
                  type="time"
                  value={appointment.time}
                  onChange={(e) => handleAppointmentChange(index, "time", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">Doctor</label>
                <input
                  type="text"
                  value={appointment.doctor}
                  onChange={(e) => handleAppointmentChange(index, "doctor", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">Department</label>
                <input
                  type="text"
                  value={appointment.department}
                  onChange={(e) => handleAppointmentChange(index, "department", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeAppointment(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  disabled={patientData.appointments.length === 1}
                >
                  Remove
                </button>
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
        </div>
        
        {/* Prescription Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Prescriptions</h3>
          {prescriptions.map((prescription, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 items-end bg-gray-50 p-3 rounded-md">
              <div>
                <label className="block text-gray-700 text-sm mb-1">Medicine</label>
                <input
                  type="text"
                  value={prescription.medicine}
                  onChange={(e) => handlePrescriptionChange(index, "medicine", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">Dosage</label>
                <input
                  type="text"
                  value={prescription.dosage}
                  onChange={(e) => handlePrescriptionChange(index, "dosage", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., 500mg"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">Frequency</label>
                <input
                  type="text"
                  value={prescription.frequency}
                  onChange={(e) => handlePrescriptionChange(index, "frequency", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Twice daily"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">Duration</label>
                <input
                  type="text"
                  value={prescription.duration}
                  onChange={(e) => handlePrescriptionChange(index, "duration", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., 7 days"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removePrescription(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  disabled={prescriptions.length === 1}
                >
                  Remove
                </button>
              </div>
              <div className="md:col-span-5">
                <label className="block text-gray-700 text-sm mb-1">Instructions</label>
                <textarea
                  value={prescription.instructions}
                  onChange={(e) => handlePrescriptionChange(index, "instructions", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="2"
                  placeholder="Special instructions for this medication"
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
        
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Patient"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm;