import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';

const Dashboard = ({ appointments: propAppointments, isPatientView = false }) => {
  const [appointments, setAppointments] = useState(propAppointments || []);
  const [loading, setLoading] = useState(!propAppointments);
  const [error, setError] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    // If appointments are passed as props, use those
    if (propAppointments) {
      setAppointments(propAppointments);
      setLoading(false);
      return;
    }

    // Otherwise fetch them
    const fetchAppointments = async () => {
      try {
        config.logApiRequest('/patients', 'GET');
        
        // Instead of fetching from /appointments, fetch from /patients
        const response = await axios.get(`${config.API_URL}/patients`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Extract appointments from all patients
        const allAppointments = response.data.reduce((acc, patient) => {
          if (patient.appointments && Array.isArray(patient.appointments)) {
            const patientAppointments = patient.appointments.map(appointment => ({
              id: appointment._id || `${patient._id}-${Math.random().toString(36).substr(2, 9)}`,
              patientId: patient.patient_id,
              patientName: patient.name,
              ...appointment
            }));
            return [...acc, ...patientAppointments];
          }
          return acc;
        }, []);
        
        setAppointments(allAppointments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments. Please try again.');
        setLoading(false);
      }
    };

    if (token) {
      fetchAppointments();
    }
  }, [propAppointments, token]);

  // Make sure appointments is an array before filtering
  const upcomingAppointments = Array.isArray(appointments) 
    ? appointments.filter(appointment => new Date(appointment.date) >= new Date())
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Dashboard</h1>
        <p className="text-lg text-blue-600">Welcome, {user?.name || 'User'}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Upcoming Appointments</h2>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : upcomingAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
                  <th className="py-2 px-4 text-left">Patient</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Time</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map(appointment => (
                  <tr key={appointment._id} className="border-b border-gray-200">
                    <td className="py-2 px-4">{appointment.patientName}</td>
                    <td className="py-2 px-4">{new Date(appointment.date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">{appointment.time}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No upcoming appointments.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
