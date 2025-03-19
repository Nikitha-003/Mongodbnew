import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const MedicalHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('history');

  // Mock data - will be replaced with API calls later
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMedicalHistory([
        { id: 1, condition: 'Hypertension', diagnosedOn: '2022-03-15', notes: 'Prescribed medication for blood pressure control' },
        { id: 2, condition: 'Seasonal Allergies', diagnosedOn: '2021-05-20', notes: 'Recommended antihistamines during spring and fall' }
      ]);
      
      setPrescriptions([
        { 
          id: 1, 
          date: '2023-01-10', 
          doctor: 'Dr. John Smith',
          diagnosis: 'Hypertension',
          medications: [
            { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '3 months' }
          ],
          instructions: 'Take with food in the morning',
          followUpDate: '2023-04-10'
        },
        { 
          id: 2, 
          date: '2023-02-15', 
          doctor: 'Dr. Sarah Johnson',
          diagnosis: 'Upper Respiratory Infection',
          medications: [
            { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', duration: '10 days' },
            { name: 'Guaifenesin', dosage: '400mg', frequency: 'Every 4 hours as needed', duration: '7 days' }
          ],
          instructions: 'Complete full course of antibiotics. Rest and drink plenty of fluids.',
          followUpDate: '2023-03-01'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

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
        <h1 className="text-3xl font-bold text-blue-800">Medical History</h1>
        <p className="text-lg text-blue-600">View your medical records and prescriptions</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'history' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Medical Conditions
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'prescriptions' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Prescriptions
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'history' ? (
            <>
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Medical Conditions</h2>
              {medicalHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-blue-50 text-blue-800">
                        <th className="py-2 px-4 text-left">Condition</th>
                        <th className="py-2 px-4 text-left">Diagnosed On</th>
                        <th className="py-2 px-4 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalHistory.map(item => (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="py-2 px-4 font-medium">{item.condition}</td>
                          <td className="py-2 px-4">{new Date(item.diagnosedOn).toLocaleDateString()}</td>
                          <td className="py-2 px-4">{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No medical conditions recorded.</p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Prescriptions</h2>
              {prescriptions.length > 0 ? (
                <div className="space-y-6">
                  {prescriptions.map(prescription => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{prescription.diagnosis}</h3>
                          <p className="text-gray-600">Date: {new Date(prescription.date).toLocaleDateString()}</p>
                          <p className="text-gray-600">Doctor: {prescription.doctor}</p>
                        </div>
                        <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          View Details
                        </button>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Medications:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {prescription.medications.map((med, index) => (
                            <li key={index}>
                              <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}
                              {med.duration && <span> for {med.duration}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {prescription.instructions && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Instructions:</h4>
                          <p className="text-gray-600">{prescription.instructions}</p>
                        </div>
                      )}
                      
                      {prescription.followUpDate && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Follow-up:</h4>
                          <p className="text-gray-600">{new Date(prescription.followUpDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No prescriptions found.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;