import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';

const Dashboard = ({ appointments: propAppointments, isPatientView = false }) => {
  const [appointments, setAppointments] = useState(propAppointments || []);
  const [loading, setLoading] = useState(!propAppointments);
  const [error, setError] = useState(null);
  const { user, token, userType } = useAuth();

  useEffect(() => {
    // If appointments are passed as props, use those
    if (propAppointments) {
      setAppointments(propAppointments);
      setLoading(false);
      return;
    }

    // Otherwise fetch them based on user type
    const fetchAppointments = async () => {
      try {
        let response;
        
        if (userType === 'doctor') {
          // Fetch doctor's approved appointments
          response = await axios.get(`${config.API_URL}/doctors/appointments`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } else {
          // Fetch all patient appointments (for admin view)
          response = await axios.get(`${config.API_URL}/patients`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }
        
        // Process the appointments data
        let appointmentsData = [];
        if (userType === 'doctor') {
          // For doctors, use the appointments directly from the response
          appointmentsData = response.data.filter(appt => appt.status === 'Approve');
        } else {
          // For admin view, extract appointments from all patients
          response.data.forEach(patient => {
            if (patient.appointments && patient.appointments.length > 0) {
              patient.appointments.forEach(appt => {
                appointmentsData.push({
                  id: appt._id,
                  patientId: patient._id,
                  patientName: patient.name,
                  date: appt.date,
                  time: appt.time,
                  reason: appt.reason,
                  status: appt.status,
                  department: appt.department
                });
              });
            }
          });
        }
        
        setAppointments(appointmentsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userType, token, propAppointments]);

  // Filter appointments to show only upcoming ones
  const upcomingAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Convert appointment date to Date object
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
      return appointmentDate >= today;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [appointments]);

  // Add this formatDate function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Check if the date is in ISO format or MM/DD/YYYY format
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return the original string if it's not a valid date
      }
      
      // Format the date as MM/DD/YYYY
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return the original string in case of error
    }
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium';
      case 'rejected':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium';
      case 'completed':
        return 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium';
      default:
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">
          {isPatientView ? "My Upcoming Appointments" : "Dashboard"}
        </h1>
        <p className="text-gray-600 mb-6">
          {isPatientView
            ? "View and manage your scheduled appointments"
            : "Overview of patient appointments"}
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No upcoming appointments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isPatientView ? "Patient" : "Patient"}
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
                    Doctor Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {appointment.patientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {appointment.patientId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(appointment.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.time || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.department || "General"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.doctorName || "Not assigned"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {appointment.reason || "No reason provided"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(appointment.status)}>
                        {appointment.status || "Pending"}
                      </span>
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

export default Dashboard;
