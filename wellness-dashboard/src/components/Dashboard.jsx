import React, { useState } from "react";
import axios from "axios";

const Dashboard = ({ patients, setPatients, onPatientUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter patients based on search term
  const filteredPatients = patients
    .filter((patient) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        patient.patient_id.toLowerCase().includes(searchLower) ||
        patient.name.toLowerCase().includes(searchLower) ||
        patient.age.toString().includes(searchLower) ||
        patient.gender.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => a.patient_id.localeCompare(b.patient_id)); // Changed sorting to use patient_id

  // Open the modal and set the selected patient
  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  // Handle update submission
  const handleUpdate = async () => {
    try {
      const response = await axios.put(`http://localhost:3000/patients/${selectedPatient._id}`, selectedPatient);
      
      // Update the patients list
      const updatedPatients = patients.map(patient => 
        patient._id === selectedPatient._id ? response.data : patient
      );
      setPatients(updatedPatients);
      
      // Close the modal
      handleCloseModal();
      
      // Call the onPatientUpdated callback to refresh appointments
      if (onPatientUpdated) {
        onPatientUpdated();
      }
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };
  
  

  // Handle input change
  const handleInputChange = (e, category, index, field) => {
    const updatedPatient = { ...selectedPatient };
    if (category) {
      // Handle nested fields (medical history, appointments, etc.)
      if (!updatedPatient[category]) {
        updatedPatient[category] = [];
      }
      if (!updatedPatient[category][index]) {
        updatedPatient[category][index] = {};
      }
      updatedPatient[category][index][field] = e.target.value;
    } else {
      // Handle basic fields (name, age, gender)
      updatedPatient[e.target.name] = e.target.value;
    }
    setSelectedPatient(updatedPatient);
  };
  

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/patients/${id}`);
      setPatients((prevPatients) => prevPatients.filter((patient) => patient._id !== id));
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  // const handleUpdate = async () => {
  //   try {
  //     await axios.put(`http://localhost:3000/patients/${selectedPatient._id}`, selectedPatient);
  //     setPatients((prevPatients) =>
  //       prevPatients.map((patient) =>
  //         patient._id === selectedPatient._id ? selectedPatient : patient
  //       )
  //     );
  //     setIsModalOpen(false);
  //     setSelectedPatient(null);
  //   } catch (error) {
  //     console.error("Error updating patient:", error);
  //   }
  // };
    

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Records</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute right-3 top-3 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-300 text-lg">No patients found.</p>
          <p className="text-gray-400">Add a new patient to get started.</p>
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Medical History
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Appointments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Prescriptions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-600">
                  <td className="px-6 py-4 whitespace-nowrap">{patient.patient_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.age}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.gender}</td>
                  <td className="px-6 py-4">
                    {patient.medical_history && patient.medical_history.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {patient.medical_history.map((history, index) => (
                          <li key={index}>
                            {history.condition}{" "}
                            {history.diagnosed_on && `(${history.diagnosed_on})`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No medical history</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {patient.appointments && patient.appointments.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {patient.appointments.map((appointment, index) => (
                          <li key={index}>
                            {appointment.date}{" "}
                            {appointment.doctor && `with ${appointment.doctor}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No appointments</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {patient.prescriptions && patient.prescriptions.length > 0 ? (
                      <div>
                        <span className="text-blue-400 cursor-pointer" onClick={() => window.open(patient.prescription_pdf)}>
                          View Prescription
                        </span>
                        <ul className="list-disc list-inside mt-1">
                          {patient.prescriptions.slice(0, 2).map((prescription, index) => (
                            <li key={index} className="text-sm">
                              {prescription.medicine} ({prescription.dosage})
                            </li>
                          ))}
                          {patient.prescriptions.length > 2 && (
                            <li className="text-sm text-gray-400">
                              +{patient.prescriptions.length - 2} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-gray-400">No prescriptions</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(patient)}
                      className="text-blue-400 hover:text-blue-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(patient._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for editing patient */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
          <div className="bg-gray-900 p-6 rounded-lg w-11/12 md:w-3/4 lg:w-1/2 max-h-[90vh] overflow-y-auto my-4">
            <h2 className="text-2xl font-bold mb-4 sticky top-0 bg-gray-900 py-2">Update Patient</h2>
            <form className="space-y-4">
              {/* Basic Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm mb-1">Patient ID</label>
                  <input
                    type="text"
                    value={selectedPatient.patient_id}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={selectedPatient.name}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={selectedPatient.age}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Gender</label>
                  <select
                    name="gender"
                    value={selectedPatient.gender}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Sections */}
              {["medical_history", "appointments"].map((category) => {
                const defaultFields = {
                  medical_history: ["condition", "diagnosed_on"],
                  appointments: ["date", "time", "doctor", "department", "status"]
                };

                return (
                  <div key={category} className="border-t border-gray-700 pt-3">
                    <label className="block text-sm capitalize mb-1">{category.replace("_", " ")}</label>
                    {(selectedPatient[category] || []).map((entry, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        {defaultFields[category].map((field) => (
                          <div key={field} className="flex-1">
                            <label className="block text-xs capitalize mb-1">{field.replace("_", " ")}</label>
                            <input
                              type={
                                (category === "appointments" && field === "date")
                                  ? "date"
                                  : (category === "appointments" && field === "time")
                                  ? "time"
                                  : "text"
                              }
                              value={entry[field] || ""}
                              onChange={(e) => handleInputChange(e, category, index, field)}
                              className="w-full p-2 rounded bg-gray-700 text-white"
                              placeholder={field.replace("_", " ")}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPatient = { ...selectedPatient };
                        const emptyEntry = {};
                        defaultFields[category].forEach(field => {
                          emptyEntry[field] = "";
                        });
                        updatedPatient[category] = [...(updatedPatient[category] || []), emptyEntry];
                        setSelectedPatient(updatedPatient);
                      }}
                      className="text-blue-400 text-sm mt-2"
                    >
                      + Add More
                    </button>
                  </div>
                );
              })}

              {/* Submit & Close Buttons */}
              <div className="sticky bottom-0 bg-gray-900 pt-4 pb-2 flex justify-end space-x-4">
                <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded">
                  Cancel
                </button>
                <button type="button" onClick={handleUpdate} className="bg-green-500 text-white px-4 py-2 rounded">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
