import React from 'react';
import FHIRDashboard from './FHIRDashboard';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-8">Admin Dashboard</h1>
      
      <div className="mb-8">
        <FHIRDashboard />
      </div>
      
      {/* Add other dashboard components here */}
    </div>
  );
};

export default AdminDashboard;