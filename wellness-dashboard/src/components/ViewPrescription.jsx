import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ViewPrescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        // Direct download approach
        window.location.href = `http://localhost:3000/patients/${id}/prescription`;
        
        // Give some time for the download to start, then go back
        setTimeout(() => {
          setLoading(false);
          // Optional: navigate back after download starts
          // navigate(-1);
        }, 1000);
      } catch (err) {
        console.error('Error fetching prescription:', err);
        setError('Failed to load prescription. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      fetchPrescription();
    } else {
      setError('No patient ID provided');
      setLoading(false);
    }
  }, [id, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-lg">Loading prescription...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-bold">Your prescription is downloading</p>
          <p className="text-sm">If the download doesn't start automatically, please try again.</p>
          <button 
            className="mt-4 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => navigate(-1)}
          >
            Return to Patient List
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewPrescription;