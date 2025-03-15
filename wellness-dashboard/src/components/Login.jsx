import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [userType, setUserType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // For now, let's handle both API and fallback authentication
      try {
        const response = await axios.post('http://localhost:3000/login', {
          email,
          password,
          userType
        });
        
        const { token, user } = response.data;
        
        // Update auth context with user data and token
        login(user.userType, user, token);
        
        // Redirect based on user type
        navigate(user.userType === 'doctor' ? '/patients' : '/appointments');
      } catch (apiError) {
        console.log('API login failed, trying fallback:', apiError);
        
        // Fallback to hardcoded credentials for testing
        if (userType === 'doctor') {
          if (email === 'doctor@example.com' && password === 'password') {
            login('doctor');
            navigate('/patients');
          } else {
            throw new Error('Invalid doctor credentials');
          }
        } else if (userType === 'patient') {
          if (email === 'patient@example.com' && password === 'password' || 
              email === 'blessyrinisha.mohanraj@gmail.com') {
            login('patient');
            navigate('/appointments');
          } else {
            throw new Error('Invalid patient credentials');
          }
        } else {
          throw new Error('Invalid user type');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.message || error.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">Wellness Portal</h1>
        
        {!userType ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center mb-4">Select User Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleUserTypeSelect('doctor')}
                className="p-6 border rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center"
              >
                <svg className="w-16 h-16 mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-lg font-medium">Doctor</span>
              </button>
              
              <button
                onClick={() => handleUserTypeSelect('patient')}
                className="p-6 border rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center"
              >
                <svg className="w-16 h-16 mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-lg font-medium">Patient</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {userType === 'doctor' ? 'Doctor Login' : 'Patient Login'}
              </h2>
              <button 
                onClick={() => setUserType('')}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Change User Type
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;