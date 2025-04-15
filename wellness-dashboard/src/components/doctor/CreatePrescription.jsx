import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/config';

const CreatePrescription = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [selectedConditionId, setSelectedConditionId] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Prescription form data
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [],
    instructions: '',
    followUpDate: ''
  });
  
  // New medication form
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.API_URL}/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatient(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data. Please try again later.');
        setLoading(false);
      }
    };

    if (token && patientId) {
      fetchPatientData();
    }
  }, [token, patientId]);

  const handleAddMedication = () => {
    // Validate medication data
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
      setNotification({
        show: true,
        message: 'Please fill in all required medication fields',
        type: 'error'
      });
      return;
    }

    // Add medication to the list
    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, { ...newMedication }]
    }));

    // Reset the form
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: ''
    });
  };

  const handleRemoveMedication = (index) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPrescriptionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicationChange = (e) => {
    const { name, value } = e.target;
    setNewMedication(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update the handleSubmit function to ensure proper prescription format
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (prescriptionData.medications.length === 0) {
        setNotification({
          show: true,
          message: 'Please add at least one medication',
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Format the prescription data
      const newPrescription = {
        date: new Date().toISOString(),
        doctorId: user.id,
        doctorName: user.name,
        medications: prescriptionData.medications,
        instructions: prescriptionData.instructions,
        followUpDate: prescriptionData.followUpDate,
        // Include the selected condition if any
        diagnosis: selectedConditionId ? 
          patient.medical_history.find(c => c._id === selectedConditionId)?.condition : 
          'General Consultation'
      };
      
      console.log('Submitting prescription:', newPrescription);
      
      // Get the current patient data first
      const patientResponse = await axios.get(`${config.API_URL}/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const currentPatient = patientResponse.data;
      
      // Add the new prescription to the patient's prescriptions array
      const updatedPrescriptions = [...(currentPatient.prescriptions || []), newPrescription];
      
      // Update the patient with the new prescription
      await axios.put(
        `${config.API_URL}/patients/${patientId}`,
        {
          ...currentPatient,
          prescriptions: updatedPrescriptions
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setNotification({
        show: true,
        message: 'Prescription created successfully',
        type: 'success'
      });
      
      // Reset form
      setPrescriptionData({
        medications: [],
        instructions: '',
        followUpDate: ''
      });
      
      // Navigate back to patient details
      setTimeout(() => {
        navigate(`/patients/${patientId}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating prescription:', error);
      setNotification({
        show: true,
        message: 'Failed to create prescription',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Create Prescription</h1>
        <p className="text-lg text-blue-600">
          Patient: {patient?.name} (ID: {patient?.patient_id})
        </p>
      </div>

      {notification.show && (
        <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          {/* Medical Condition Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Related Medical Condition
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={selectedConditionId}
              onChange={(e) => setSelectedConditionId(e.target.value)}
              required
            >
              <option value="">Select a condition</option>
              {patient?.medical_history?.map((condition) => (
                <option key={condition._id} value={condition._id}>
                  {condition.condition} (Diagnosed: {new Date(condition.diagnosedOn).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Medications Section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">Medications</h3>
            
            {/* Add Medication Form */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Medication Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newMedication.name}
                    onChange={handleMedicationChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., Amoxicillin"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Dosage*
                  </label>
                  <input
                    type="text"
                    name="dosage"
                    value={newMedication.dosage}
                    onChange={handleMedicationChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., 500mg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Frequency*
                  </label>
                  <input
                    type="text"
                    name="frequency"
                    value={newMedication.frequency}
                    onChange={handleMedicationChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., Twice daily"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={newMedication.duration}
                    onChange={handleMedicationChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddMedication}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Medication
              </button>
            </div>

            {/* Medications List */}
            {prescriptionData.medications.length > 0 ? (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Added Medications:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {prescriptionData.medications.map((med, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}
                        {med.duration && <span> for {med.duration}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 italic mb-4">No medications added yet.</p>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Instructions
            </label>
            <textarea
              name="instructions"
              value={prescriptionData.instructions}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              placeholder="Additional instructions for the patient"
            ></textarea>
          </div>

          {/* Follow-up Date */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              name="followUpDate"
              value={prescriptionData.followUpDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/patients/${patientId}`)}
              className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Prescription'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePrescription;