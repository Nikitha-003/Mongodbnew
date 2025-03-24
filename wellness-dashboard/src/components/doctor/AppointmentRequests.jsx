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
      await axios.put(`${config.API_URL}/doctors/appointments/${appointmentId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === appointmentId ? { ...req, status: 'Approved' } : req
        )
      );
      showNotification('Appointment approved successfully');
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
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === appointmentId ? { ...req, status: 'Rejected' } : req
        )
      );
      showNotification('Appointment rejected successfully');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Appointment Requests</h2>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointmentRequests.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                    <div className="text-sm text-gray-500">ID: {appointment.patientId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(appointment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.time || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.department || 'General'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {appointment.reason || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${appointment.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        appointment.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {appointment.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleApprove(appointment.id)}
                      className="text-green-600 hover:text-green-900 mr-4"
                      disabled={appointment.status !== 'Pending'}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(appointment.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={appointment.status !== 'Pending'}
                    >
                      Reject
                    </button>
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