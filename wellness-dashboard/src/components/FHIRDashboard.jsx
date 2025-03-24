import React from 'react';
import PatientAgeChart from './visualizations/PatientAgeChart';
import AppointmentStatusChart from './visualizations/AppointmentStatusChart';

const FHIRDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-blue-800">FHIR Data Visualization</h1>
        <p className="text-lg text-blue-600">Interactive healthcare data insights</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PatientAgeChart />
        <AppointmentStatusChart />
      </div>
    </div>
  );
};

export default FHIRDashboard;