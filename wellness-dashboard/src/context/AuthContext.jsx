import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Clear any existing auth state first
    const clearAuthState = () => {
      setIsAuthenticated(false);
      setUserType(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    };

    // Check if user is authenticated from localStorage
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUserType = localStorage.getItem('userType');
      
      console.log('AuthContext - Checking auth:', { token: !!token, userType: storedUserType });
      
      if (token && storedUserType) {
        // Set default authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
        setUserType(storedUserType);
        
        // Create a basic user object if we don't have full user data
        if (!user) {
          setUser({
            userType: storedUserType
          });
        }
      } else {
        // Clear any existing auth state if token or userType is missing
        clearAuthState();
        // Also clear localStorage to ensure consistency
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
      }
      
      setLoading(false);
    };

    // Run the auth check
    clearAuthState();
    checkAuth();
  }, []);

  const login = (type, userData = null, token = null) => {
    console.log('AuthContext - Login:', { type, userData, hasToken: !!token });
    
    setIsAuthenticated(true);
    setUserType(type);
    localStorage.setItem('userType', type); // Changed from response.data.userType to type
    
    if (userData) {
      setUser(userData);
    }
    
    if (token) {
      localStorage.setItem('token', token); // Changed from response.data.token to token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const logout = () => {
    console.log('AuthContext - Logout');
    
    setIsAuthenticated(false);
    setUserType(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userType, 
      loading, 
      user,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);