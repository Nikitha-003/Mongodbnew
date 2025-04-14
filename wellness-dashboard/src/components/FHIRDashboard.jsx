import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const FHIRDashboard = () => {
  const { token } = useAuth();
  const [patientData, setPatientData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ageDistribution, setAgeDistribution] = useState({
    labels: [],
    values: []
  });
  const [genderDistribution, setGenderDistribution] = useState({
    labels: [],
    values: []
  });

  // Helper function to calculate age from DOB - this needs fixing
  const calculateAge = (dob) => {
    if (!dob) return 0;
    
    try {
      const birthDate = new Date(dob);
      
      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        console.warn('Invalid date format:', dob);
        return 0;
      }
      
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        
        // Fetch patients from your actual backend
        const response = await axios.get(`${config.API_URL}/patients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPatientData(response.data);
        
        // Process age distribution
        const ageGroups = {
          '0-17': 0,
          '18-30': 0,
          '31-45': 0,
          '46-60': 0,
          '61-75': 0,
          '76+': 0
        };
        
        // Process gender distribution
        const genderCount = {
          'Male': 0,
          'Female': 0,
          'Other': 0
        };
        
        // Calculate distributions from actual patient data
        response.data.forEach(patient => {
          // Debug log to check DOB values
          console.log(`Patient ${patient.name} DOB:`, patient.dob);
          
          // Age distribution
          const age = calculateAge(patient.dob);
          console.log(`Calculated age for ${patient.name}:`, age);
          
          // Assign to correct age group
          if (age <= 17) ageGroups['0-17']++;
          else if (age <= 30) ageGroups['18-30']++;
          else if (age <= 45) ageGroups['31-45']++;
          else if (age <= 60) ageGroups['46-60']++;
          else if (age <= 75) ageGroups['61-75']++;
          else ageGroups['76+']++;
          
          // Gender distribution
          const gender = patient.gender || 'Other';
          if (gender.toLowerCase() === 'male') genderCount['Male']++;
          else if (gender.toLowerCase() === 'female') genderCount['Female']++;
          else genderCount['Other']++;
        });
        
        console.log('Age groups after processing:', ageGroups);
        
        // Set state for charts
        setAgeDistribution({
          labels: Object.keys(ageGroups),
          values: Object.values(ageGroups)
        });
        
        setGenderDistribution({
          labels: Object.keys(genderCount),
          values: Object.values(genderCount)
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data. Please try again later.');
        setLoading(false);
      }
    };

    if (token) {
      fetchPatientData();
    }
  }, [token]);

  // Chart data
  const ageChartData = {
    labels: ageDistribution.labels,
    datasets: [
      {
        label: 'Number of Patients',
        data: ageDistribution.values,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const genderChartData = {
    labels: genderDistribution.labels,
    datasets: [
      {
        label: 'Gender Distribution',
        data: genderDistribution.values,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Patient Demographics',
      },
    },
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
      <h1 className="text-2xl font-bold text-blue-800 mb-6">FHIR Patient Demographics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Patient Age Distribution</h2>
          <Bar data={ageChartData} options={chartOptions} />
          <div className="mt-4 text-sm text-gray-500">
            <p>Total Patients: {patientData.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Patient Gender Distribution</h2>
          <Pie data={genderChartData} options={chartOptions} />
        </div>
      </div>
      
      {/* Patient Data Summary section removed */}
    </div>
  );
};

export default FHIRDashboard;