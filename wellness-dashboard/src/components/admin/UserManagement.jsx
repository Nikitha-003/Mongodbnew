import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config/config';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users with token:', token ? `${token.substring(0, 10)}...` : 'No token');
        setLoading(true);
        
        // Log the full request details
        console.log('Making request to:', `${config.API_URL}/admin/users`);
        console.log('With headers:', { Authorization: `Bearer ${token}` });
        
        // Make sure token is included in the request
        if (!token) {
          console.error('No authentication token available');
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${config.API_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Log the full response
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
        if (Array.isArray(response.data)) {
          console.log('Users fetched successfully:', response.data.length);
          setUsers(response.data);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Received invalid data format from server');
        }
        
        setError('');
      } catch (err) {
        console.error('Error fetching users:', err);
        
        // More detailed error logging
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response status:', err.response.status);
          console.error('Error response data:', err.response.data);
        } else if (err.request) {
          // The request was made but no response was received
          console.error('No response received:', err.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request setup error:', err.message);
        }
        
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]); // Add token as a dependency

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">User Type</th>
                <th className="py-2 px-4 border-b">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user._id}>
                    <td className="py-2 px-4 border-b">{user.name}</td>
                    <td className="py-2 px-4 border-b">{user.email}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.userType === 'doctor' ? 'bg-green-100 text-green-800' :
                        user.userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.userType}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-4 text-center">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;