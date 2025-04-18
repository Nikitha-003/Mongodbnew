import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import config from '../config/config'; // Make sure to import config

const PatientList = ({ patients, setPatients }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // Add modal state and selected patient state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  // Add details modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);
  // Add notification state
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  
  // Add this memoized filtered patients calculation
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    
    return patients.filter(patient => 
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);
  
  // Function to show notification
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ show: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  }, []);
  
  // Optimized delete handler with useCallback
  const handleDelete = useCallback(async (id) => {
    try {
      // Ensure the API URL is correct
      await axios.delete(`${config.API_URL}/patients/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPatients((prevPatients) => prevPatients.filter((patient) => patient._id !== id));
      showNotification("Patient deleted successfully");
    } catch (error) {
      console.error("Error deleting patient:", error);
      showNotification("Failed to delete patient", "error");
    }
  }, [setPatients, showNotification]);
  
  // Optimized edit handler with useCallback
  const handleEdit = useCallback((patient) => {
    // Make a fresh API call to get the latest patient data
    axios.get(`${config.API_URL}/patients/${patient._id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      setSelectedPatient(response.data);
      setIsModalOpen(true);
    })
    .catch(error => {
      console.error("Error fetching patient details for edit:", error);
      showNotification("Failed to load patient details for editing", "error");
    });
  }, [showNotification]);
  
  // Add the missing handleCloseModal function
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  }, []);
  
  // Add handleUpdate function for the edit modal
  // In the handleUpdate function, make sure prescriptions are included
  const handleUpdate = useCallback(async () => {
    try {
      if (!selectedPatient) return;
      
      // Make sure all fields are included in the update
      const patientToUpdate = {
        name: selectedPatient.name,
        email: selectedPatient.email,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        phone: selectedPatient.phone,
        address: selectedPatient.address,
        blood_group: selectedPatient.blood_group,
        patient_id: selectedPatient.patient_id,
        medical_history: selectedPatient.medical_history || [],
        appointments: selectedPatient.appointments || [],
        prescriptions: selectedPatient.prescriptions || [] // Ensure prescriptions are included
      };
      
      const response = await axios.put(
        `${config.API_URL}/patients/${selectedPatient._id}`, 
        patientToUpdate,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update the patients list
      setPatients(prevPatients => 
        prevPatients.map(patient => 
          patient._id === selectedPatient._id ? response.data : patient
        )
      );
      
      // Show success notification
      showNotification("Patient updated successfully");
      
      // Close the modal
      handleCloseModal();
    } catch (error) {
      console.error("Error updating patient:", error);
      showNotification("Failed to update patient", "error");
    }
  }, [selectedPatient, setPatients, showNotification, handleCloseModal]);
  
  // Also, let's add a function to generate a prescription
  const generatePrescription = useCallback(async (patient) => {
    try {
      setIsGenerating(true);
      
      // Create a more lightweight prescription template
      const prescriptionContent = `
        <div style="border: 2px solid #333; padding: 20px; margin-bottom: 20px; background-color: #ffffff;">
          <h2 style="text-align: center; margin-bottom: 30px;">Medical Prescription</h2>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <p><strong>Patient ID:</strong> ${patient.patient_id}</p>
              <p><strong>Name:</strong> ${patient.name}</p>
              <p><strong>Age:</strong> ${patient.age || 'N/A'}</p>
              <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 15px;">Medications</h3>
            <ul style="list-style-type: none; padding-left: 0;">
              ${patient.prescriptions && patient.prescriptions.length > 0 
                ? patient.prescriptions.map(p => {
                    // Check if medications array exists and has items
                    if (p.medications && p.medications.length > 0) {
                      return p.medications.map(med => 
                        `<li style="margin-bottom: 10px; padding: 10px; border-left: 3px solid #2563eb;">
                          <p><strong>${med.name || med.medicine}</strong> - ${med.dosage}</p>
                          <p>Frequency: ${med.frequency}</p>
                          <p>Instructions: ${p.instructions || 'As directed'}</p>
                          <p>Duration: ${med.duration}</p>
                        </li>`
                      ).join('')
                    } else {
                      // Handle single medication format
                      return `<li style="margin-bottom: 10px; padding: 10px; border-left: 3px solid #2563eb;">
                        <p><strong>${p.medicine || p.medication}</strong> - ${p.dosage}</p>
                        <p>Frequency: ${p.frequency}</p>
                        <p>Instructions: ${p.instructions || 'As directed'}</p>
                        <p>Duration: ${p.duration}</p>
                      </li>`
                    }
                  }).join('') 
                : '<li>No medications prescribed</li>'
              }
            </ul>
          </div>
        </div>
      `;
      
      // Create a temporary div to hold the prescription content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = prescriptionContent;
      document.body.appendChild(tempDiv);
      
      // Use html2canvas to capture the prescription as an image
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      // Remove the temporary div
      document.body.removeChild(tempDiv);
      
      // Create a PDF from the canvas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add the image to the PDF
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Save the PDF
      pdf.save(`prescription_${patient.patient_id}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating prescription:', error);
      setIsGenerating(false);
      showNotification('Failed to generate prescription', 'error');
    }
  }, [showNotification]);
  
  // Handle input changes in the edit modal
  const handleInputChange = useCallback((e, field) => {
    if (!selectedPatient) return;
    
    setSelectedPatient({
      ...selectedPatient,
      [field]: e.target.value
    });
  }, [selectedPatient]);
  
  const editPatient = (patientId) => {
    navigate(`/edit-patient/${patientId}`);
  };

  // Function to view patient details
  const viewPatientDetails = (patient) => {
    // Make a fresh API call to get the latest patient data
    axios.get(`${config.API_URL}/patients/${patient._id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      setPatientDetails(response.data);
      setIsDetailsModalOpen(true);
    })
    .catch(error => {
      console.error("Error fetching patient details:", error);
      showNotification("Failed to load patient details", "error");
    });
  };

  // Close the details modal
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setPatientDetails(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add notification display */}
      {notification.show && (
        <div className={`mb-4 p-3 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search patients..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Patient Table - Simplified with fewer columns */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-700 text-lg">No patients found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {isGenerating && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg">Generating prescription...</p>
              </div>
            </div>
          )}
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Appointment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">
                    {patient.patient_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.appointments && patient.appointments.length > 0 
                      ? `${patient.appointments[0].date} ${patient.appointments[0].time || ''}`
                      : 'No appointments'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewPatientDetails(patient)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleEdit(patient)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(patient._id)}
                      className="text-red-600 hover:text-red-900 mr-4"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => generatePrescription(patient)}
                      className="text-green-600 hover:text-green-900"
                      disabled={isGenerating}
                    >
                      Download Prescription
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Patient Details Modal */}
      {isDetailsModalOpen && patientDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Patient Details</h2>
              <button 
                onClick={closeDetailsModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Basic Information</h3>
                {/* // In the details modal rendering section */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="font-medium">{patientDetails.patient_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{patientDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{patientDetails.age || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{patientDetails.gender || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{patientDetails.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{patientDetails.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{patientDetails.address || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Group</p>
                    <p className="font-medium">{patientDetails.blood_group || "Not provided"}</p>
                  </div>
                </div>
              </div>
              
              {/* Medical History */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Medical History</h3>
                {patientDetails.medical_history && patientDetails.medical_history.length > 0 ? (
                  <div className="space-y-2">
                    {patientDetails.medical_history.map((history, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border">
                        <p className="font-medium">{history.condition}</p>
                        <p className="text-sm text-gray-500">
                          Diagnosed: {history.diagnosed_on || history.diagnosis_date || "Date not specified"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No medical history recorded</p>
                )}
              </div>
              
              {/* Appointments */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Appointments</h3>
                {patientDetails.appointments && patientDetails.appointments.length > 0 ? (
                  <div className="space-y-2">
                    {patientDetails.appointments.map((appointment, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border">
                        <div className="flex justify-between">
                          <p className="font-medium">
                            {appointment.date} {appointment.time && `at ${appointment.time}`}
                          </p>
                          <span className={`px-2 py-1 rounded text-xs ${
                            appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status || 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {appointment.doctor && `Doctor: ${appointment.doctor}`}
                          {appointment.department && `, Department: ${appointment.department}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No appointments scheduled</p>
                )}
              </div>
              
              {/* Prescriptions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 border-b pb-2">Prescriptions</h3>
                {patientDetails.prescriptions && patientDetails.prescriptions.length > 0 ? (
                  <div className="space-y-2">
                    {patientDetails.prescriptions.map((prescription, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border">
                        <p className="font-medium">
                          {prescription.medicine || prescription.medication} - {prescription.dosage}
                        </p>
                        <p className="text-sm text-gray-500">
                          Frequency: {prescription.frequency || "Not specified"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Duration: {prescription.duration || "Not specified"}
                        </p>
                        {prescription.instructions && (
                          <p className="text-sm text-gray-500">
                            Instructions: {prescription.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No prescriptions recorded</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto text-gray-800">
            <h2 className="text-xl font-bold mb-4">Edit Patient</h2>
            
            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                  <input
                    type="text"
                    value={selectedPatient.patient_id || ""}
                    onChange={(e) => handleInputChange(e, "patient_id")}
                    className="w-full p-2 border rounded"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedPatient.name || ""}
                    onChange={(e) => handleInputChange(e, "name")}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={selectedPatient.age || ""}
                    onChange={(e) => handleInputChange(e, "age")}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={selectedPatient.gender || ""}
                    onChange={(e) => handleInputChange(e, "gender")}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={selectedPatient.phone || ""}
                    onChange={(e) => handleInputChange(e, "phone")}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={selectedPatient.email || ""}
                    onChange={(e) => handleInputChange(e, "email")}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={selectedPatient.address || ""}
                    onChange={(e) => handleInputChange(e, "address")}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={selectedPatient.blood_group || ""}
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
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;