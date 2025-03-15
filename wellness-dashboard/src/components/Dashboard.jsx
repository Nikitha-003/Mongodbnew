import React, { useState } from "react";
import axios from "axios";

const Dashboard = ({ patients, setPatients }) => {
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
  
      // Update the state immediately
      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient._id === selectedPatient._id ? response.data : patient
        )
      );
  
      // Close the modal after successful update
      setIsModalOpen(false);
      setSelectedPatient(null); // Reset selected patient
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
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Records</h1>
        <div className="relative w-full md:w-1/3 lg:w-1/4 max-w-lg ml-4">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-2 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <table className="w-full border-collapse border border-gray-600 shadow-lg">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="p-3 border">ID</th>
            <th className="p-3 border">Name</th>
            <th className="p-3 border">Age</th>
            <th className="p-3 border">Gender</th>
            <th className="p-3 border">Medical History</th>
            <th className="p-3 border">Appointments</th>
            <th className="p-3 border">Diagnostics</th>
            <th className="p-3 border">Mental Health</th>
            <th className="p-3 border">Physiotherapy</th>
            <th className="p-3 border">Nutrition</th>
            <th className="p-3 border">Yoga</th>
            <th className="p-3 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((patient) => (
            <tr key={patient._id} className="bg-gray-800 border-b border-gray-600">
              <td className="p-3 border">{patient.patient_id}</td>
              <td className="p-3 border">{patient.name}</td>
              <td className="p-3 border">{patient.age}</td>
              <td className="p-3 border">{patient.gender}</td>
              <td className="p-3 border">{patient.medical_history?.map((m) => m.condition).join(", ")}</td>
              <td className="p-3 border">{patient.appointments?.map((a) => `${a.date} - ${a.doctor}`).join(", ")}</td>
              <td className="p-3 border">{patient.diagnostics?.map((d) => d.test_name).join(", ")}</td>
              <td className="p-3 border">{patient.mental_health?.map((mh) => mh.evaluation).join(", ")}</td>
              <td className="p-3 border">{patient.physiotherapy?.map((p) => p.progress_log).join(", ")}</td>
              <td className="p-3 border">{patient.nutrition?.map((n) => n.dietary_plan).join(", ")}</td>
              <td className="p-3 border">{patient.yoga?.map((y) => y.session_plan).join(", ")}</td>
              <td className="p-4 flex gap-3 justify-end">
                <button
                  onClick={() => handleEdit(patient)}
                  className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded"
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(patient._id)}
                  className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Updating Patient */}
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
              {["medical_history", "appointments", "diagnostics", "mental_health", "physiotherapy", "nutrition", "yoga"].map((category) => {
                const defaultFields = {
                  medical_history: ["condition", "diagnosed_on"],
                  appointments: ["date", "doctor", "department"],
                  diagnostics: ["test_name", "result", "date"],
                  mental_health: ["session_notes", "evaluation", "therapist"],
                  physiotherapy: ["progress_log", "session_date"],
                  nutrition: ["dietary_plan", "calorie_intake", "progress"],
                  yoga: ["session_plan", "wearable_data"]
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
                                (category === "appointments" && field === "date") ||
                                (category === "diagnostics" && field === "date")
                                  ? "date"
                                  : field.includes("calorie")
                                  ? "number"
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
