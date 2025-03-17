import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AddPatientForm = ({ onPatientAdded }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add notification state
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Initial patient data state with only required sections
  const [patientData, setPatientData] = useState({
    patient_id: "", // Will be auto-generated
    name: "",
    age: "",
    gender: "",
    // Add new fields
    phone: "",
    email: "",
    address: "",
    blood_group: "",
    // Existing fields
    medical_history: [{ condition: "", diagnosed_on: "" }],
    appointments: [{ date: "", time: "10:00", doctor: "", department: "", status: "Pending" }],
  });

  // Add prescription state
  const [prescriptions, setPrescriptions] = useState([
    { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  // Generate a unique patient ID
  // Optimize the patient ID generation
  useEffect(() => {
    const generatePatientId = async () => {
      try {
        setIsSubmitting(true); // Show loading state while fetching
        
        // Get all patients to determine the next ID
        const response = await axios.get("http://localhost:3000/patients");
        const patients = response.data;
        
        // Find the highest patient ID number
        let highestNum = 0;
        patients.forEach(patient => {
          if (patient.patient_id) {
            const idNum = parseInt(patient.patient_id.replace('PT', ''), 10);
            if (!isNaN(idNum) && idNum > highestNum) {
              highestNum = idNum;
            }
          }
        });
        
        // Generate the new ID
        const newId = `PT${(highestNum + 1).toString().padStart(4, '0')}`;
        
        // Update the patient data with the new ID
        setPatientData(prevData => ({
          ...prevData,
          patient_id: newId
        }));
      } catch (error) {
        console.error("Error generating patient ID:", error);
        // Fallback to a random ID if there's an error
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
  }, []);

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
      { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" },
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
    // Set loading state to true when submission starts
    setIsSubmitting(true);
    
    // Validate required fields
    if (!patientData.name || !patientData.age || !patientData.gender) {
      alert("Please fill in all required fields (Name, Age, and Gender)");
      setIsSubmitting(false);
      return;
    }
    
    // Format appointments to ensure valid dates
    const formattedAppointments = patientData.appointments.map(app => ({
      ...app,
      date: app.date || new Date().toISOString().split('T')[0], // Default to today if empty
      time: app.time || '10:00'
    }));
    
    // Format medical history to ensure valid dates
    const formattedMedicalHistory = patientData.medical_history.map(history => ({
      ...history,
      diagnosed_on: history.diagnosed_on || new Date().toISOString().split('T')[0]
    }));
    
    // Filter out empty prescriptions
    const validPrescriptions = prescriptions.filter(p => p.medicine.trim() !== "");
    
    // Prepare the data to send
    const patientToSubmit = {
      ...patientData,
      appointments: formattedAppointments,
      medical_history: formattedMedicalHistory,
      prescriptions: validPrescriptions,
      // Ensure age is a number
      age: parseInt(patientData.age, 10)
    };
    
    console.log("Submitting patient data:", patientToSubmit);
    
    // Send data to the server
    const response = await axios.post(
      "http://localhost:3000/patients",
      patientToSubmit
    );
    
    console.log("Patient added successfully:", response.data);
    
    // Call the callback function if provided
    if (onPatientAdded) {
      onPatientAdded(response.data);
    }
    
    // Navigate back to the patient list
    navigate("/patients");
  } catch (error) {
    console.error("Error adding patient:", error);
    
    // More detailed error handling
    if (error.response) {
      // The server responded with an error status
      console.error("Server error details:", error.response.data);
      alert(`Failed to save patient: ${error.response.data.message || 'Server error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      alert("Failed to save patient: No response from server. Please check your connection.");
    } else {
      // Something happened in setting up the request
      alert(`Failed to save patient: ${error.message}`);
    }
  } finally {
    // Set loading state back to false when submission completes
    setIsSubmitting(false);
  }
};

// Add this near the top of your component
const [formKey, setFormKey] = useState(Date.now());

// Add this function to reset the form
const resetForm = () => {
  setPatientData({
    patient_id: patientData.patient_id, // Keep the generated ID
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
  setPrescriptions([
    { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);
  setFormKey(Date.now()); // Force re-render with a new key
};

// Modify your return statement to include the key
return (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-6">Add New Patient</h1>
    
    <form key={formKey} onSubmit={(e) => e.preventDefault()} className="bg-white shadow-md rounded-lg p-6">
      {/* Basic Information */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID
            </label>
            <input
              type="text"
              value={patientData.patient_id}
              className="w-full p-2 border rounded bg-gray-100"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={patientData.name}
              onChange={(e) => handleInputChange(e, "name")}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              value={patientData.age}
              onChange={(e) => handleInputChange(e, "age")}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={patientData.gender}
              onChange={(e) => handleInputChange(e, "gender")}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* New fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={patientData.phone}
              onChange={(e) => handleInputChange(e, "phone")}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={patientData.email}
              onChange={(e) => handleInputChange(e, "email")}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={patientData.address}
              onChange={(e) => handleInputChange(e, "address")}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group
            </label>
            <select
              value={patientData.blood_group}
              onChange={(e) => handleInputChange(e, "blood_group")}
              className="w-full p-2 border rounded"
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
      </div>
      
      {/* Rest of the form remains unchanged */}
      {/* Medical History Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Medical History</h2>
        {patientData.medical_history.map((history, index) => (
          <div key={index} className="mb-4 p-4 border rounded">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Condition {index + 1}</h3>
              {patientData.medical_history.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedicalHistory(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <input
                  type="text"
                  value={history.condition}
                  onChange={(e) =>
                    handleMedicalHistoryChange(index, "condition", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis Date
                </label>
                <input
                  type="date"
                  value={history.diagnosed_on}
                  onChange={(e) =>
                    handleMedicalHistoryChange(
                      index,
                      "diagnosed_on",
                      e.target.value
                    )
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addMedicalHistory}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Another Condition
        </button>
      </div>

{/* Appointments Section */}
<div className="mb-6">
  <h2 className="text-xl font-semibold mb-4">Appointments</h2>
  {patientData.appointments.map((appointment, index) => (
    <div key={index} className="mb-4 p-4 border rounded">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={appointment.date}
            onChange={(e) => handleAppointmentChange(index, "date", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Time</label>
          <input
            type="time"
            value={appointment.time}
            onChange={(e) => handleAppointmentChange(index, "time", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Doctor</label>
          <input
            type="text"
            value={appointment.doctor}
            onChange={(e) => handleAppointmentChange(index, "doctor", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <input
            type="text"
            value={appointment.department}
            onChange={(e) => handleAppointmentChange(index, "department", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={appointment.status}
            onChange={(e) => handleAppointmentChange(index, "status", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      {patientData.appointments.length > 1 && (
        <button
          type="button"
          onClick={() => removeAppointment(index)}
          className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Remove
        </button>
      )}
    </div>
  ))}
  <button
    type="button"
    onClick={addAppointment}
    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    Add Appointment
  </button>
</div>

      {/* Prescription Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Prescriptions</h2>
        
        {/* Prescription Form */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-lg font-medium mb-3">Add Medications</h3>
          {prescriptions.map((prescription, index) => (
            <div key={index} className="mb-4 p-4 border rounded bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicine</label>
                  <input
                    type="text"
                    value={prescription.medicine}
                    onChange={(e) => handlePrescriptionChange(index, "medicine", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosage</label>
                  <input
                    type="text"
                    value={prescription.dosage}
                    onChange={(e) => handlePrescriptionChange(index, "dosage", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <input
                    type="text"
                    value={prescription.frequency}
                    onChange={(e) => handlePrescriptionChange(index, "frequency", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., Twice daily"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <input
                    type="text"
                    value={prescription.duration}
                    onChange={(e) => handlePrescriptionChange(index, "duration", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Instructions</label>
                  <input
                    type="text"
                    value={prescription.instructions}
                    onChange={(e) => handlePrescriptionChange(index, "instructions", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., Take after meals"
                  />
                </div>
              </div>
              {prescriptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePrescription(index)}
                  className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={addPrescription}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Medication
            </button>
            {/* <button
              type="button"
              onClick={generatePrescription}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Generate Prescription PDF
            </button> */}
          </div>
        </div>
      </div>

{/* Submit Button */}
<div className="mt-8 flex justify-end space-x-4">
  <button
    type="button"
    onClick={resetForm}
    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    Reset Form
  </button>
  
  <button
    type="button"
    onClick={handleSubmit}
    disabled={isSubmitting}
    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
      isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
  >
    {isSubmitting ? (
      <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Saving...
      </>
    ) : (
      'Save Patient'
    )}
  </button>
</div>
      </form>
    </div>
  );
};

export default AddPatientForm;