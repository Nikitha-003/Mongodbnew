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
  }, [token]);

  const fetchAppointmentRequests = async () => {
    try {
      setLoading(true);
      // Make a real API call to fetch pending appointments
      const response = await axios.get(`${config.API_URL}/doctors/appointment-requests`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAppointmentRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      setError('Failed to load appointment requests. Please try again.');
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleApprove = async (appointmentId, patientId) => {
    try {
      // Call API to approve appointment
      await axios.put(`${config.API_URL}/doctors/appointments/${appointmentId}/approve`, 
        { patientId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state to reflect the change
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === appointmentId ? { ...req, status: 'Approved' } : req
        )
      );
      
      showNotification('Appointment approved successfully');
      
      // Refresh the list after a short delay
      setTimeout(() => {
        fetchAppointmentRequests();
      }, 1000);
    } catch (error) {
      console.error('Error approving appointment:', error);
      showNotification('Failed to approve appointment', 'error');
    }
  };

  const handleReject = async (appointmentId, patientId) => {
    try {
      // Call API to reject appointment
      await axios.put(`${config.API_URL}/doctors/appointments/${appointmentId}/reject`, 
        { patientId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state to reflect the change
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === appointmentId ? { ...req, status: 'Rejected' } : req
        )
      );
      
      showNotification('Appointment rejected');
      
      // Refresh the list after a short delay
      setTimeout(() => {
        fetchAppointmentRequests();
      }, 1000);
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      showNotification('Failed to reject appointment', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Appointment Requests</h1>
      
      {/* Notification */}
      {notification.show && (
        <div className={`mb-4 p-3 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchAppointmentRequests}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : appointmentRequests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No appointment requests found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointmentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.patientName}</div>
                      <div className="text-sm text-gray-500">ID: {request.patientId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${request.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id, request.patientId)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request.patientId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequests;