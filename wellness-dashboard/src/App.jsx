import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AddPatientForm from "./components/AddPatientForm";
import { useState, useEffect } from "react";
import axios from "axios";
import Appointments from "./components/Appointments";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ViewPrescription from './components/ViewPrescription';
import PatientList from "./components/PatientList";

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
            date: appointment.date,
            time: appointment.time || '10:00 AM',
            doctor: appointment.doctor,
            department: appointment.department,
            status: appointment.status || 'Pending'
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

  const handlePatientAdded = async () => {
    await fetchPatients();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, only show the login and register routes
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-gray-800">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Add a persistent toggle button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 z-50 p-2 rounded bg-[#f0f7ff] text-[#2c5282] hover:bg-[#e1effe] transition-transform duration-300 ${
          isSidebarOpen ? 'hidden' : 'block'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`transition-all duration-300 p-6 bg-gray-800 text-white overflow-auto ${
          isSidebarOpen ? "ml-64 w-[calc(100%-16rem)]" : "ml-16 w-[calc(100%-4rem)]"
        }`}
      >
        <Routes>
          <Route path="/login" element={<Navigate to={userType === 'doctor' ? '/patients' : '/appointments'} replace />} />
          <Route path="/register" element={<Navigate to={userType === 'doctor' ? '/patients' : '/appointments'} replace />} />
          <Route path="/" element={<Navigate to={userType === 'doctor' ? '/patients' : '/appointments'} replace />} />
          
          {/* Doctor routes */}
          <Route 
            path="/add-patient" 
            element={
              <ProtectedRoute allowedUserTypes={['doctor']}>
                <AddPatientForm onPatientAdded={handlePatientAdded} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patients" 
            element={
              <ProtectedRoute allowedUserTypes={['doctor']}>
                <PatientList patients={patients} setPatients={setPatients} />
              </ProtectedRoute>
            } 
          />
          {/* Edit patient route */}
          <Route 
            path="/edit-patient/:id" 
            element={
              <ProtectedRoute allowedUserTypes={['doctor']}>
                <AddPatientForm onPatientAdded={handlePatientAdded} />
              </ProtectedRoute>
            } 
          />
          {/* Both doctor and patient can access appointments */}
          <Route 
            path="/appointments" 
            element={
              <ProtectedRoute>
                <Appointments appointments={appointments} />
              </ProtectedRoute>
            } 
          />
          <Route path="/patients/:id/prescription" element={<ViewPrescription />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
