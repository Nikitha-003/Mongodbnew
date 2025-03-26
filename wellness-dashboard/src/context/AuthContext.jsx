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
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUserType(user.userType);
          setUser(user);
          setToken(storedToken);
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
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

  // Login function
  const login = (type, userData, authToken) => {
    try {
      // Store token and user data in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setIsAuthenticated(true);
      setUserType(type);
      setUser(userData);
      setToken(authToken);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
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

  const logout = () => {
    console.log('AuthContext - Logout');
    
    setIsAuthenticated(false);
    setUserType(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Update user data function
  const updateUserData = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
    
    // Update localStorage with the new user data
    if (updatedUserData) {
      const updatedUser = { ...user, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
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