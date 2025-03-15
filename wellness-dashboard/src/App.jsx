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

function AppContent() {
  const [patients, setPatients] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, userType, loading } = useAuth();

  console.log('AppContent - Auth State:', { isAuthenticated, userType, loading });

  const fetchPatients = async () => {
    try {
      const response = await axios.get("http://localhost:3000/patients");
      setPatients(response.data);
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
                <Dashboard patients={patients} setPatients={setPatients} />
              </ProtectedRoute>
            } 
          />
          
          {/* Both doctor and patient can access appointments */}
          <Route 
            path="/appointments" 
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            } 
          />
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
