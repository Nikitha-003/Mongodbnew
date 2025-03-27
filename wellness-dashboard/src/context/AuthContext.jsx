import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { logAuthState } from '../utils/debugUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Clear auth state function
  const clearAuthState = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedUserData = localStorage.getItem('userData');
      
      if (storedToken) {
        try {
          let userData;
          
          // Try to get user data from either 'user' or 'userData' in localStorage
          if (storedUser) {
            userData = JSON.parse(storedUser);
          } else if (storedUserData) {
            userData = JSON.parse(storedUserData);
          }
          
          if (userData) {
            setIsAuthenticated(true);
            setUserType(userData.userType);
            setUser(userData);
            setToken(storedToken);
            
            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            
            // Add this logging to debug token issues
            console.log('Setting auth token:', `Bearer ${storedToken.substring(0, 15)}...`);
            console.log('User type from localStorage:', userData.userType);
            
            logAuthState('AuthContext - Restored Auth', { 
              isAuthenticated: true, 
              userType: userData.userType, 
              user: userData, 
              token: storedToken 
            });
          } else {
            clearAuthState();
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          clearAuthState();
        }
      } else {
        clearAuthState();
      }
      setLoading(false);
    };
    
    // Run the auth check
    checkAuth();
  }, []);

  // Login function - Combined and fixed
  const login = (type, userData, authToken) => {
    try {
      // Store token and user data in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Update state
      setIsAuthenticated(true);
      setUserType(type);
      setUser(userData);
      setToken(authToken);
      
      // Debug log
      console.log('Login: Setting user type to:', type);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('Login: Setting auth token:', `Bearer ${authToken.substring(0, 15)}...`);
      
      logAuthState('AuthContext - Login', { 
        isAuthenticated: true, 
        userType: type,
        user: userData, 
        token: authToken 
      });
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // Logout function
  const logout = () => {
    // Remove auth-related items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Note: We're not removing userData from localStorage
    // This allows the data to persist between sessions
    
    // Reset auth state
    setToken(null);
    setUserType(null);
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear axios headers
    delete axios.defaults.headers.common['Authorization'];
  };
  
  // Add a function to update user data
  const updateUserData = (newUserData) => {
    localStorage.setItem('userData', JSON.stringify(newUserData));
    localStorage.setItem('user', JSON.stringify(newUserData)); // Update both storage keys
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userType, 
      loading, 
      user,
      token,
      login, 
      logout,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);