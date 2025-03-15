import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userType, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation items based on user type
  const navItems = userType === 'doctor' 
    ? [
        { path: "/patients", label: "Patient Records", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
        { path: "/add-patient", label: "Add Patient", icon: "M12 4v16m8-8H4" },
        { path: "/appointments", label: "Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      ]
    : [
        { path: "/appointments", label: "My Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
        { path: "/profile", label: "My Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
      ];

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 ease-in-out z-40 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h1 className={`font-bold text-xl transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
          Wellness Portal
        </h1>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
          </svg>
        </button>
      </div>

      <nav className="mt-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 transition-colors ${
                  location.pathname === item.path
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-700"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={item.icon}
                  />
                </svg>
                <span className={`ml-3 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-full border-t border-gray-700 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 hover:bg-gray-700 rounded transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className={`ml-3 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
            Logout
          </span>
        </button>
        <div className={`mt-4 text-sm text-gray-400 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
          Logged in as: {userType === 'doctor' ? 'Doctor' : 'Patient'}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
