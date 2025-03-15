import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedUserTypes = ['doctor', 'patient'] }) => {
  const { isAuthenticated, userType, loading } = useAuth();

  console.log('ProtectedRoute - Auth State:', { isAuthenticated, userType, loading });

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If user type is not allowed, redirect to appropriate page
  if (!allowedUserTypes.includes(userType)) {
    console.log('User type not allowed:', userType);
    return <Navigate to={userType === 'doctor' ? '/patients' : '/appointments'} replace />;
  }

  // If authenticated and allowed, render the children
  return children;
};

export default ProtectedRoute;