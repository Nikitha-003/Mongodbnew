import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import AddPatientForm from "./components/AddPatientForm";
import { useState, useEffect } from "react";
import axios from "axios";
import PatientList from "./components/PatientList";
import PatientDetails from "./components/PatientDetails";
import Login from "./components/Login";
import Register from "./components/Register";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ViewPrescription from "./components/ViewPrescription";
import AddDoctor from './components/AddDoctor';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, userType, loading } = useAuth();

  console.log('AppContent - Auth State:', { isAuthenticated, userType, loading });

  const fetchPatients = async () => {
    try {
      const response = await axios.get("http://localhost:3000/patients");
      setPatients(response.data);
      
      // Extract appointments from all patients
      const allAppointments = response.data.reduce((acc, patient) => {
        if (patient.appointments && Array.isArray(patient.appointments)) {
          const patientAppointments = patient.appointments.map(appointment => ({
            id: appointment._id || `${patient._id}-${Math.random().toString(36).substr(2, 9)}`,
            patientId: patient.patient_id,  // Make sure this is included
            patientName: patient.name,
            ...appointment
          }));
          return [...acc, ...patientAppointments];
        }
        return acc;
      }, []);
      
      setAppointments(allAppointments);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPatients();
    }
  }, [isAuthenticated]);

  // If still loading auth state, show loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {isAuthenticated && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          userType={userType}
        />
      )}
      
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isAuthenticated ? (isSidebarOpen ? 'ml-64' : 'ml-20') : ''}`}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            isAuthenticated ? (
              userType === 'admin' ? <Navigate to="/admin" /> :
              userType === 'doctor' ? <Navigate to="/patients" /> :
              <Navigate to="/appointments" />
            ) : <Navigate to="/login" />
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Doctor routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedUserTypes={['doctor']}>
              <Dashboard appointments={appointments} />
            </ProtectedRoute>
          } />
          
          <Route path="/patients" element={
            <ProtectedRoute allowedUserTypes={['doctor', 'admin']}>
              <PatientList patients={patients} setPatients={setPatients} />
            </ProtectedRoute>
          } />
          
          <Route path="/add-patient" element={
            <ProtectedRoute allowedUserTypes={['doctor']}>
              <AddPatientForm setPatients={setPatients} />
            </ProtectedRoute>
          } />
          
          <Route path="/patients/:id" element={
            <ProtectedRoute allowedUserTypes={['doctor', 'patient']}>
              <PatientDetails fetchPatients={fetchPatients} />
            </ProtectedRoute>
          } />
          
          <Route path="/patients/:id/prescription" element={
            <ProtectedRoute allowedUserTypes={['doctor', 'patient']}>
              <ViewPrescription />
            </ProtectedRoute>
          } />
          
          {/* Patient routes */}
          <Route path="/appointments" element={
            <ProtectedRoute allowedUserTypes={['patient']}>
              <Dashboard appointments={appointments} isPatientView={true} />
            </ProtectedRoute>
          } />
          
          {/* Add Doctor route */}
          <Route path="/add-doctor" element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <AddDoctor />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;
