import React, { useState, useEffect } from "react";

const Appointments = ({ appointments }) => {
  const [sortedAppointments, setSortedAppointments] = useState([]);
  
  // Sort appointments by date and time when appointments prop changes
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const sorted = [...appointments].sort((a, b) => {
        // First sort by date
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        
        // If dates are the same, sort by time
        const timeA = a.time ? a.time : '00:00';
        const timeB = b.time ? b.time : '00:00';
        
        return timeA.localeCompare(timeB);
      });
      
      setSortedAppointments(sorted);
    } else {
      setSortedAppointments([]);
    }
  }, [appointments]);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>
      
      {sortedAppointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-300 text-lg">No appointments found.</p>
          <p className="text-gray-400">Add appointments to patients to see them here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {sortedAppointments.map((appointment, index) => (
                <tr key={appointment.id || index} className="hover:bg-gray-600">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.time || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.doctor || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.department || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === "Confirmed"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {appointment.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Appointments;