import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config/config';

const MyDetails = () => {
  const { user, token, updateUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        age: user.age || '',
        gender: user.gender || '',
        blood_group: user.blood_group || '',
      });
    }
  }, [user]);

  // Add a function to fetch user data from the server
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/patients/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setFormData(response.data);
        // Update the user data in context if available
        if (updateUserData) {
          updateUserData(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setNotification({
        show: true,
        message: 'Failed to load your profile data. Please refresh the page.',
        type: 'error'
      });
    }
  };

  // Call fetchUserData when component mounts
  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Sending profile update:', formData);
      // Send updated profile data to backend
      const response = await axios.put(
        `${config.API_URL}/patients/profile`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Store the updated data in localStorage for persistence
      localStorage.setItem('userData', JSON.stringify(response.data));
      
      // Update local user data in context
      if (updateUserData) {
        updateUserData(response.data);
      }
      
      setIsEditing(false);
      setNotification({ show: true, message: 'Profile updated successfully!', type: 'success' });
      
      // Hide notification after 3 seconds
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({ 
        show: true, 
        message: error.response?.data?.message || 'Failed to update profile. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">My Details</h1>
        <p className="text-lg text-blue-600">View and update your personal information</p>
      </div>

      {notification.show && (
        <div className={`p-4 mb-6 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-blue-800">Personal Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2" htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2" htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2" htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2" htmlFor="blood_group">Blood Group</label>
                <select
                  id="blood_group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${
                  isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                } text-white px-4 py-2 rounded flex items-center`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 font-semibold">Name</p>
              <p className="text-gray-800">{formData.name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Email</p>
              <p className="text-gray-800">{formData.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Phone</p>
              <p className="text-gray-800">{formData.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Address</p>
              <p className="text-gray-800">{formData.address || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Age</p>
              <p className="text-gray-800">{formData.age || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Gender</p>
              <p className="text-gray-800">{formData.gender || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Blood Group</p>
              <p className="text-gray-800">{formData.blood_group || 'Not provided'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDetails;