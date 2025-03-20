import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config/config';

const BookAppointment = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '09:00',
    reason: '',
    department: '',
    doctorId: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Replace mock data with state
  const [doctors, setDoctors] = useState([]);
  // Update this line - remove the default value
  const [departments, setDepartments] = useState([]);
  
  // Add this useEffect to fetch departments
  // Update the fetchDepartments function
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Use the dedicated endpoint for departments
        const response = await axios.get(`${config.API_URL}/patients/doctors/departments`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.departments && response.data.departments.length > 0) {
          setDepartments(response.data.departments);
        } else {
          // Fallback to common departments but NOT General Physician as default
          setDepartments(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology']);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Fallback without General Physician as default
        setDepartments(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology']);
      }
    };
    
    fetchDepartments();
  }, [token]);
  const [loading, setLoading] = useState(true);

  // Fetch real doctors from the backend
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.API_URL}/doctors`, {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        
        // Extract doctors and departments from response
        const doctorData = response.data;
        console.log('Fetched doctors:', doctorData);
        
        if (Array.isArray(doctorData) && doctorData.length > 0) {
          // Log the structure of the first doctor to understand the data format
          console.log('First doctor structure:', JSON.stringify(doctorData[0]));
          setDoctors(doctorData);
          
          // Extract unique departments with better error handling
          const departments = doctorData
            .map(doc => doc.specialization) // Only use specialization field
            .filter(Boolean);
          const uniqueDepartments = [...new Set(departments)];
          
          console.log('Extracted departments:', uniqueDepartments);
          setDepartments(uniqueDepartments.length > 0 ? uniqueDepartments : ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology']);
        } else {
          // Fallback to mock data if API returns empty array
          setDoctors([
            { _id: '1', name: 'Dr. John Smith', department: 'Cardiology' },
            { _id: '2', name: 'Dr. Sarah Johnson', department: 'Neurology' },
            { _id: '3', name: 'Dr. Michael Brown', department: 'Orthopedics' },
            { _id: '4', name: 'Dr. Emily Davis', department: 'Pediatrics' },
            { _id: '5', name: 'Dr. Robert Wilson', department: 'Dermatology' }
          ]);
          setDepartments(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology']);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        // Fallback to mock data if API fails
        setDoctors([
          { _id: '1', name: 'Dr. John Smith', department: 'Cardiology' },
          { _id: '2', name: 'Dr. Sarah Johnson', department: 'Neurology' },
          { _id: '3', name: 'Dr. Michael Brown', department: 'Orthopedics' },
          { _id: '4', name: 'Dr. Emily Davis', department: 'Pediatrics' },
          { _id: '5', name: 'Dr. Robert Wilson', department: 'Dermatology' }
        ]);
        setDepartments(['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology']);
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, [token]);

  // Filter doctors based on selected department
  const filteredDoctors = formData.department 
    ? doctors.filter(doctor => doctor.specialization === formData.department) 
    : [];
  
  console.log('Selected department:', formData.department);
  console.log('Filtered doctors:', filteredDoctors);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Reset doctor selection when department changes
    if (name === 'department') {
      setFormData(prev => ({
        ...prev,
        doctorId: ''
      }));
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Connect to the backend API
      const response = await axios.post(`${config.API_URL}/patients/appointments`, {
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        department: formData.department,
        doctorId: formData.doctorId, // This should now be a valid MongoDB ID
        status: 'Pending'
      }, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      
      setNotification({ 
        show: true, 
        message: 'Appointment booked successfully! You will receive a confirmation soon.', 
        type: 'success' 
      });
      
      // Reset form
      setFormData({
        date: '',
        time: '09:00',
        reason: '',
        department: '',
        doctorId: ''
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      // Show more detailed error message if available
      const errorMessage = error.response?.data?.message || 'Failed to book appointment. Please try again.';
      setNotification({ 
        show: true, 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time slots from 9 AM to 5 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const formattedHour = hour.toString().padStart(2, '0');
      slots.push(`${formattedHour}:00`);
      slots.push(`${formattedHour}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get tomorrow's date as the minimum date for booking
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Book an Appointment</h1>
        <p className="text-lg text-blue-600">Schedule a visit with one of our specialists</p>
      </div>

      {notification.show && (
        <div className={`p-4 mb-6 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="department">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="doctorId">
                Doctor
              </label>
              <select
                id="doctorId"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                disabled={!formData.department}
              >
                <option value="">Select Doctor</option>
                {filteredDoctors.map((doctor) => (
                  <option key={doctor._id || doctor.id} value={doctor._id || doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              {!formData.department && (
                <p className="text-sm text-gray-500 mt-1">Please select a department first</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="date">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={getTomorrowDate()}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2" htmlFor="time">
                Time
              </label>
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                {timeSlots.map((time, index) => (
                  <option key={index} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="reason">
                Reason for Visit
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows="4"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Please describe your symptoms or reason for the appointment"
                required
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded text-white font-semibold ${
                isSubmitting ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;