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
          appointmentsData = response.data.filter(appt => appt.status === 'approved');
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
                  department: appt.department || 'General'
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">
        {userType === 'doctor' ? 'My Upcoming Appointments' : 'All Appointments'}
      </h2>
      
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
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-100">
              <tr>
                {userType !== 'patient' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                )}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {upcomingAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  {userType !== 'patient' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                      {appointment.patientId && (
                        <div className="text-sm text-gray-500">ID: {appointment.patientId}</div>
                      )}
                    </td>
                  )}
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
                      ${appointment.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        appointment.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {appointment.status || 'Pending'}
                    </span>
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

export default Dashboard;
