import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/config';

const AppointmentRequests = () => {
  const { token } = useAuth();
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

  const handleApprove = async (appointmentId) => {
    try {
      // Change the URL from '/Approve' to '/approve' (lowercase)
      await axios.put(`${config.API_URL}/doctors/appointments/${appointmentId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state to reflect the change - use 'approved' instead of 'Approve'
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === appointmentId ? { ...req, status: 'approved' } : req
        )
      );
      
      showNotification('Appointment approved successfully');
      // Refresh the list after a short delay
      setTimeout(fetchAppointmentRequests, 1000);
    } catch (error) {
      console.error('Error approving appointment:', error);
      showNotification('Failed to approve appointment', 'error');
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      await axios.put(`${config.API_URL}/doctors/appointments/${appointmentId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state to reflect the change
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === appointmentId ? { ...req, status: 'Rejected' } : req
        )
      );
      
      showNotification('Appointment rejected');
      // Refresh the list after a short delay
      setTimeout(fetchAppointmentRequests, 1000);
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      showNotification('Failed to reject appointment', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': // Change from 'Approve' to 'approved'
        return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium';
      case 'rejected':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium';
      default:
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Appointment Requests</h1>
        <p className="text-gray-600 mb-6">Manage patient appointment requests</p>

        {notification.show && (
          <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading appointment requests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : appointmentRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No appointment requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointmentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    {/* // In the table row rendering */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{request.patientName}</div>
                      <div className="text-sm text-gray-500">ID: {request.patientId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.time || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.department || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.doctorName || 'You'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {request.reason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(request.status)}>
                        {request.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(request.status === 'Pending' || request.status === 'scheduled') && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {(request.status === 'approved') && ( // Change from 'Approve' to 'approved'
                        <span className="text-green-600">Approved</span>
                      )}
                      {(request.status === 'Rejected' || request.status === 'rejected') && (
                        <span className="text-red-600">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentRequests;