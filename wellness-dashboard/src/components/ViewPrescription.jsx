import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ViewPrescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userType } = useAuth();
  const [patient, setPatient] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patient data
        const patientResponse = await axios.get(`http://localhost:3001/patients/${id}`);
        setPatient(patientResponse.data);
        
        // Fetch prescription data
        const prescriptionResponse = await axios.get(`http://localhost:3001/patients/${id}/prescription`);
        setPrescription(prescriptionResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load prescription data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
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

  if (!patient || !prescription) {
    return <div>No prescription found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prescription</h1>
        <div className="space-x-2">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded print:hidden"
          >
            Print
          </button>
          <button
            onClick={() => navigate(`/patients/${id}`)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded print:hidden"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-8 mb-6 print:shadow-none">
        <div className="border-b pb-6 mb-6">
          <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">Wellness Portal Medical Center</h2>
          <p className="text-center text-gray-600">123 Health Street, Medical City, MC 12345</p>
          <p className="text-center text-gray-600">Phone: (123) 456-7890 | Email: info@wellnessportal.com</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Patient Information</h3>
            <p><span className="font-medium">Name:</span> {patient.name}</p>
            <p><span className="font-medium">Patient ID:</span> {patient.patient_id}</p>
            <p><span className="font-medium">Age:</span> {patient.age}</p>
            <p><span className="font-medium">Gender:</span> {patient.gender}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Prescription Details</h3>
            <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
            <p><span className="font-medium">Follow-up Date:</span> {prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : 'Not specified'}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Medications</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescription.medications && prescription.medications.map((med, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{med.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{med.dosage}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{med.frequency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{med.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {prescription.instructions && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <p className="p-4 bg-gray-50 rounded">{prescription.instructions}</p>
          </div>
        )}

        {prescription.doctorNotes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Doctor's Notes</h3>
            <p className="p-4 bg-gray-50 rounded">{prescription.doctorNotes}</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t">
          <div className="flex justify-end">
            <div className="text-center">
              <div className="mb-2 border-b border-black inline-block">
                <p className="mb-2">Doctor's Signature</p>
              </div>
              <p>Dr. {userType === 'doctor' ? 'You' : 'Medical Professional'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPrescription;