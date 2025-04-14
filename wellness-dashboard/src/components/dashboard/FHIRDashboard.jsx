import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/config';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const FHIRDashboard = () => {
  const { token } = useAuth();
  const [ageDistribution, setAgeDistribution] = useState(null);
  const [genderDistribution, setGenderDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch age distribution data
        const ageResponse = await axios.get(`${config.API_URL}/patients/age-distribution`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch gender distribution data
        const genderResponse = await axios.get(`${config.API_URL}/patients/gender-distribution`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Process age distribution data
        const ageData = ageResponse.data;
        if (ageData && ageData.entry) {
          const processedAgeData = {
            labels: [],
            values: []
          };
          
          ageData.entry.forEach(entry => {
            const ageGroup = entry.resource.subject.reference.split('/')[1];
            const count = entry.resource.valueQuantity.value;
            
            processedAgeData.labels.push(ageGroup);
            processedAgeData.values.push(count);
          });
          
          setAgeDistribution(processedAgeData);
        }
        
        // Process gender distribution data
        const genderData = genderResponse.data;
        if (genderData && genderData.entry) {
          const processedGenderData = {
            labels: [],
            values: []
          };
          
          genderData.entry.forEach(entry => {
            const gender = entry.resource.subject.reference.split('/')[1];
            const count = entry.resource.valueQuantity.value;
            
            // Capitalize first letter for display
            const formattedGender = gender.charAt(0).toUpperCase() + gender.slice(1);
            
            processedGenderData.labels.push(formattedGender);
            processedGenderData.values.push(count);
          });
          
          setGenderDistribution(processedGenderData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Chart options and data
  const ageChartData = {
    labels: ageDistribution?.labels || [],
    datasets: [
      {
        label: 'Number of Patients',
        data: ageDistribution?.values || [],
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
    labels: genderDistribution?.labels || [],
    datasets: [
      {
        label: 'Gender Distribution',
        data: genderDistribution?.values || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">FHIR Patient Demographics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Patient Age Distribution</h3>
          {ageDistribution ? (
            <Bar data={ageChartData} options={chartOptions} />
          ) : (
            <p className="text-gray-500">No age distribution data available</p>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Patient Gender Distribution</h3>
          {genderDistribution ? (
            <Pie data={genderChartData} options={chartOptions} />
          ) : (
            <p className="text-gray-500">No gender distribution data available</p>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Data formatted according to FHIR standards</p>
      </div>
    </div>
  );
};

export default FHIRDashboard;