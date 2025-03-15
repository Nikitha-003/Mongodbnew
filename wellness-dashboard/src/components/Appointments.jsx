import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userType, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('You must be logged in to view appointments');
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      try {
        // For now, we'll use mock data since the API endpoint might not be ready
        // In a real app, you would fetch from your backend
        // const response = await axios.get('http://localhost:3000/appointments');
        // setAppointments(response.data);
        
        // Mock data for testing
        const mockAppointments = [
          {
            id: '1',
            date: '2023-06-15',
            time: '10:00 AM',
            doctor: 'Dr. Smith',
            department: 'Cardiology',
            status: 'Confirmed'
          },
          {
            id: '2',
            date: '2023-06-20',
            time: '2:30 PM',
            doctor: 'Dr. Johnson',
            department: 'Neurology',
            status: 'Pending'
          },
          {
            id: '3',
            date: '2023-06-25',
            time: '11:15 AM',
            doctor: 'Dr. Williams',
            department: 'Orthopedics',
            status: 'Confirmed'
          }
        ];
        
        setAppointments(mockAppointments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments. Please try again later.');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {userType === 'patient' ? 'Book New Appointment' : 'Create Appointment'}
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-300 text-lg">No appointments found.</p>
          <p className="text-gray-400">Book a new appointment to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-600">
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.doctor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      appointment.status === 'Confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-400 hover:text-blue-300 mr-3">View</button>
                    {appointment.status !== 'Confirmed' && (
                      <button className="text-red-400 hover:text-red-300">Cancel</button>
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

export default Appointments;