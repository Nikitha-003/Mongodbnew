import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const BookAppointment = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '09:00',
    reason: '',
    department: '',
    doctorId: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock data for departments and doctors - will be replaced with API calls later
  const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology'];
  const doctors = [
    { id: 1, name: 'Dr. John Smith', department: 'Cardiology' },
    { id: 2, name: 'Dr. Sarah Johnson', department: 'Neurology' },
    { id: 3, name: 'Dr. Michael Brown', department: 'Orthopedics' },
    { id: 4, name: 'Dr. Emily Davis', department: 'Pediatrics' },
    { id: 5, name: 'Dr. Robert Wilson', department: 'Dermatology' }
  ];

  // Filter doctors based on selected department
  const filteredDoctors = formData.department 
    ? doctors.filter(doctor => doctor.department === formData.department) 
    : [];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // This will be connected to backend later
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success notification
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
    } catch (error) {
      setNotification({ 
        show: true, 
        message: 'Failed to book appointment. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
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
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
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