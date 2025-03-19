import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/config';

const AppointmentRequests = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchAppointmentRequests();
  }, []);

  const fetchAppointmentRequests = async () => {
    try {
      setLoading(true);
      // This will be replaced with actual API call
      // For now, using mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for appointment requests
      const mockRequests = [
        {
          id: '1',
          patientId: 'PT1001',
          patientName: 'John Doe',
          date: '2023-12-15',
          time: '10:00',
          department: 'Cardiology',
          reason: 'Chest pain and shortness of breath',
          status: 'Pending'
        },
        {
          id: '2',
          patientId: 'PT1002',
          patientName: 'Jane Smith',
          date: '2023-12-16',
          time: '14:30',
          department: 'Cardiology',
          reason: 'Follow-up for hypertension',
          status: 'Pending'
        },
        {
          id: '3',
          patientId: 'PT1003',
          patientName: 'Robert Johnson',
          date: '2023-12-17',
          time: '09:00',
          department: 'Cardiology',
          reason: 'Irregular heartbeat',
          status: 'Pending'
        }
      ];
      
      setAppointmentRequests(mockRequests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      setError('Failed to load appointment requests. Please try again.');
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // This will be replaced with actual API call
      // For now, just updating the state
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setAppointmentRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === id ? { ...request, status: newStatus } : request
        )
      );
      
      // Show notification
      setNotification({
        show: true,
        message: `Appointment ${newStatus.toLowerCase()} successfully`,
        type: 'success'
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setNotification({
        show: true,
        message: 'Failed to update appointment status',
        type: 'error'
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
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
        <h1 className="text-3xl font-bold text-blue-800">Appointment Requests</h1>
        <p className="text-lg text-blue-600">Manage patient appointment requests</p>
      </div>

      {notification.show && (
        <div className={`p-4 mb-6 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {appointmentRequests.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No appointment requests found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
                  <th className="py-3 px-4 text-left">Patient</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Time</th>
                  <th className="py-3 px-4 text-left">Department</th>
                  <th className="py-3 px-4 text-left">Reason</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointmentRequests.map(request => (
                  <tr key={request.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{request.patientName}</div>
                        <div className="text-sm text-gray-500">ID: {request.patientId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{new Date(request.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{request.time}</td>
                    <td className="py-3 px-4">{request.department}</td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {request.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(request.id, 'Approved')}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(request.id, 'Rejected')}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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

export default AppointmentRequests;