import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    doctors: 0,
    patients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:3000/admin/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Admin Dashboard</h1>
        <p className="text-lg text-blue-600">Welcome, {user?.name || 'Admin User'}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800">Total Users</h3>
              {/* Change from <p> to <div> to avoid nesting a div inside a p */}
              <div className="text-3xl font-bold mt-2 text-blue-700">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                ) : stats.totalUsers}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-lg font-medium text-green-800">Doctors</h3>
              {/* Change from <p> to <div> */}
              <div className="text-3xl font-bold mt-2 text-green-700">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                ) : stats.doctors}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-lg font-medium text-purple-800">Patients</h3>
              {/* Change from <p> to <div> */}
              <div className="text-3xl font-bold mt-2 text-purple-700">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                ) : stats.patients}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-800">User Management</h2>
          </div>
          <UserManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;