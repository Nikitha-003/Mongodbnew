import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PatientDetails = ({ fetchPatients }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userType } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [],
    instructions: '',
    doctorNotes: '',
    followUpDate: ''
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/patients/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setPatient(response.data);
        setFormData(response.data);
        if (response.data.prescription) {
          setPrescriptionData(response.data.prescription);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patient:', error);
        setError('Failed to load patient data. Please try again.');
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3001/patients/${id}`, formData);
      setPatient(formData);
      setIsEditing(false);
      if (fetchPatients) fetchPatients();
    } catch (error) {
      console.error('Error updating patient:', error);
      setError('Failed to update patient. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await axios.delete(`http://localhost:3001/patients/${id}`);
        if (fetchPatients) fetchPatients();
        navigate('/patients');
      } catch (error) {
        console.error('Error deleting patient:', error);
        setError('Failed to delete patient. Please try again.');
      }
    }
  };

  const handleMedicationChange = (e) => {
    const { name, value } = e.target;
    setNewMedication({
      ...newMedication,
      [name]: value
    });
  };

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setPrescriptionData({
        ...prescriptionData,
        medications: [...prescriptionData.medications, newMedication]
      });
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: ''
      });
    }
  };

  const removeMedication = (index) => {
    const updatedMedications = [...prescriptionData.medications];
    updatedMedications.splice(index, 1);
    setPrescriptionData({
      ...prescriptionData,
      medications: updatedMedications
    });
  };

  const handlePrescriptionChange = (e) => {
    const { name, value } = e.target;
    setPrescriptionData({
      ...prescriptionData,
      [name]: value
    });
  };

  const generatePrescription = async () => {
    try {
      await axios.post(`http://localhost:3001/patients/${id}/prescription`, prescriptionData);
      alert('Prescription generated successfully!');
      navigate(`/patients/${id}/prescription`);
    } catch (error) {
      console.error('Error generating prescription:', error);
      setError('Failed to generate prescription. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
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

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Details</h1>
        <div className="space-x-2">
          {userType === 'doctor' && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="patient_id">
                Patient ID
              </label>
              <input
                type="text"
                id="patient_id"
                name="patient_id"
                value={formData.patient_id || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="age">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="phone">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="3"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="medical_history">
                Medical History
              </label>
              <textarea
                id="medical_history"
                name="medical_history"
                value={formData.medical_history || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Name</h2>
              <p className="mt-1">{patient.name}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Patient ID</h2>
              <p className="mt-1">{patient.patient_id}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Age</h2>
              <p className="mt-1">{patient.age}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Gender</h2>
              <p className="mt-1">{patient.gender}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Phone</h2>
              <p className="mt-1">{patient.phone}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Email</h2>
              <p className="mt-1">{patient.email}</p>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-700">Address</h2>
              <p className="mt-1">{patient.address}</p>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-700">Medical History</h2>
              <p className="mt-1">{patient.medical_history}</p>
            </div>
          </div>
        </div>
      )}

      {userType === 'doctor' && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Generate Prescription</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Medications</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <input
                type="text"
                placeholder="Medication Name"
                name="name"
                value={newMedication.name}
                onChange={handleMedicationChange}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="text"
                placeholder="Dosage"
                name="dosage"
                value={newMedication.dosage}
                onChange={handleMedicationChange}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="text"
                placeholder="Frequency"
                name="frequency"
                value={newMedication.frequency}
                onChange={handleMedicationChange}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <input
                type="text"
                placeholder="Duration"
                name="duration"
                value={newMedication.duration}
                onChange={handleMedicationChange}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button
                type="button"
                onClick={addMedication}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>
            
            {prescriptionData.medications.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prescriptionData.medications.map((med, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">{med.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{med.dosage}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{med.frequency}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{med.duration}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => removeMedication(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="instructions">
                Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                value={prescriptionData.instructions}
                onChange={handlePrescriptionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
              ></textarea>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="doctorNotes">
                Doctor's Notes
              </label>
              <textarea
                id="doctorNotes"
                name="doctorNotes"
                value={prescriptionData.doctorNotes}
                onChange={handlePrescriptionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
              ></textarea>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="followUpDate">
              Follow-up Date
            </label>
            <input
              type="date"
              id="followUpDate"
              name="followUpDate"
              value={prescriptionData.followUpDate}
              onChange={handlePrescriptionChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={generatePrescription}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              disabled={prescriptionData.medications.length === 0}
            >
              Generate Prescription
            </button>
          </div>
        </div>
      )}

      {patient.appointments && patient.appointments.length > 0 && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Appointment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patient.appointments.map((appointment, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(appointment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;