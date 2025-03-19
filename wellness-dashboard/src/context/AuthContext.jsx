import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { logAuthState } from '../utils/debugUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

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
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUserType(user.userType); // This is working correctly
          setUser(user);
          setToken(storedToken);
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Add this logging to debug token issues
          console.log('Setting auth token:', `Bearer ${storedToken.substring(0, 15)}...`);
          console.log('User type from localStorage:', user.userType); // Debug log
          
          logAuthState('AuthContext - Restored Auth', { 
            isAuthenticated: true, 
            userType: user.userType, 
            user, 
            token: storedToken 
          });
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

  // Login function - FIX HERE
  const login = (type, userData, authToken) => {
    try {
      // Store token and user data in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state - FIX: Use the passed type parameter instead of userType state
      setIsAuthenticated(true);
      setUserType(type); // FIXED: Use the type parameter passed to the function
      setUser(userData);
      setToken(authToken);
      
      // Debug log
      console.log('Login: Setting user type to:', type);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('Login: Setting auth token:', `Bearer ${authToken.substring(0, 15)}...`);
      
      logAuthState('AuthContext - Login', { 
        isAuthenticated: true, 
        userType: type, // FIXED: Use the type parameter
        user: userData, 
        token: authToken 
      });
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    console.log('AuthContext - Logout');
    
    setIsAuthenticated(false);
    setUserType(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userType, 
      loading, 
      user,
      token,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);