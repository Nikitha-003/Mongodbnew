import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MedicalHistory = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('history');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchMedicalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const historyResponse = await axios.get(`${config.API_URL}/patients/medical-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const prescriptionsResponse = await axios.get(`${config.API_URL}/patients/prescriptions`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Log the API response to check the data
        console.log('Medical History Response:', historyResponse.data);
        console.log('Prescriptions Response:', prescriptionsResponse.data);

        // Get the medical history data
        const medicalHistoryData = historyResponse.data || [];
        
        // Process prescriptions and match with medical history dates if possible
        const processedPrescriptions = prescriptionsResponse.data.map(prescription => {
          // Try to find a matching medical condition by ID or other criteria
          const matchingCondition = medicalHistoryData.find(condition => 
            condition._id === prescription.conditionId || 
            condition.condition === prescription.relatedCondition
          );
          
          return {
            ...prescription,
            // Use the matching condition's date if available, otherwise use prescription date
            date: matchingCondition?.diagnosedOn 
              ? new Date(matchingCondition.diagnosedOn) 
              : (prescription.date ? new Date(prescription.date) : new Date()),
            doctor: prescription.doctor?.name || prescription.doctor || 'Dr. Smith' // Default doctor name
          };
        });

        setMedicalHistory(medicalHistoryData);
        setPrescriptions(processedPrescriptions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching medical data:', err);
        setError('Failed to load your medical records. Please try again later.');
        setLoading(false);
      }
    };

    if (token) {
      fetchMedicalData();
    }
  }, [token]);

  const handleDownloadPrescription = async (prescription) => {
    try {
      setGeneratingPdf(true);
      
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '20px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      const formattedDate = prescription.date 
        ? prescription.date.toLocaleDateString() 
        : 'Not specified';

      tempDiv.innerHTML = `
        <div style="padding: 20px; border: 1px solid #ccc;">
          <h2 style="text-align: center; color: #2c5282; margin-bottom: 20px;">Medical Prescription</h2>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p><strong>Patient ID:</strong> ${user?.patient_id || 'N/A'}</p>
              <p><strong>Name:</strong> ${user?.name || 'N/A'}</p>
              <p><strong>Age:</strong> ${user?.age || 'N/A'}</p>
              <p><strong>Gender:</strong> ${user?.gender || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Date:</strong> ${formattedDate}</p>
            </div>
          </div>
          <div style="margin-top: 30px;">
            <h3 style="border-bottom: 1px solid #2c5282; padding-bottom: 5px;">Medications:</h3>
            <div style="margin-left: 20px; margin-top: 10px;">
              ${prescription.medications.map(med => `
                <p style="margin-bottom: 10px;">
                  <strong>${med.name}</strong> - ${med.dosage}
                  <br>
                  <span>Frequency: ${med.frequency}</span>
                  ${med.duration ? `<br><span>Duration: ${med.duration}</span>` : ''}
                </p>
              `).join('')}
            </div>
          </div>
          ${prescription.instructions ? `
            <div style="margin-top: 20px;">
              <h3 style="border-bottom: 1px solid #2c5282; padding-bottom: 5px;">Instructions:</h3>
              <p style="margin-left: 20px; margin-top: 10px;">${prescription.instructions}</p>
            </div>
          ` : ''}
          <div style="margin-top: 50px; text-align: right;">
            <p><strong>Dr. ${prescription.doctor}</strong></p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`prescription_${user?.patient_id || 'patient'}.pdf`);
      
      document.body.removeChild(tempDiv);
      setGeneratingPdf(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGeneratingPdf(false);
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
                      </tr>
                    </thead>
                    <tbody>
                      {medicalHistory.map(item => (
                        <tr key={item.id || item._id} className="border-b border-gray-200">
                          <td className="py-2 px-4 font-medium">{item.condition}</td>
                          <td className="py-2 px-4">{new Date(item.diagnosedOn).toLocaleDateString()}</td>
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
                    <div key={prescription.id || prescription._id} className="border rounded-lg p-4">
                      <div className="mb-4 flex justify-between items-start">
                        <div>
                          <p className="text-gray-600">
                            Date: {prescription.date ? prescription.date.toLocaleDateString() : 'Not specified'}
                          </p>
                          <p className="text-gray-600">
                            Doctor: {prescription.doctor.id || 'Not specified'}
                          </p>
                        </div>
                        <button 
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 flex items-center"
                          onClick={() => handleDownloadPrescription(prescription)}
                          disabled={generatingPdf}
                        >
                          {generatingPdf ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            'Download Prescription'
                          )}
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