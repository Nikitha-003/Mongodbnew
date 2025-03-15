import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker"; // Add this import
import "react-datepicker/dist/react-datepicker.css"; // Add this import

const AddPatientForm = ({ onPatientAdded }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  // Initial patient data state
  const [patientData, setPatientData] = useState({
    patient_id: "", // Will be auto-generated
    name: "",
    age: "",
    gender: "",
    medical_history: [{ condition: "", diagnosed_on: "" }],
    appointments: [{ date: "", doctor: "", department: "" }],
    diagnostics: [{ test_name: "", result: "", date: "" }],
    mental_health: [{ session_notes: "", evaluation: "", therapist: "" }],
    physiotherapy: [{ progress_log: "", session_date: "" }],
    nutrition: [{ dietary_plan: "", calorie_intake: "", progress: "" }],
    yoga: [{ session_plan: "", wearable_data: "" }],
  });

  // Generate patient ID function
  const generatePatientId = async () => {
    try {
      const response = await axios.get("http://localhost:3000/patients/next-id");
      return response.data.nextId;
    } catch (error) {
      console.error("Error generating patient ID:", error);
      return "P001";
    }
  };

  // Generate ID on form load
  useEffect(() => {
    if (!isEditing) {
      generatePatientId().then(id => {
        setPatientData(prev => ({ ...prev, patient_id: id }));
      });
    }
  }, [isEditing]);

  // Load patient data if editing
  useEffect(() => {
    const storedPatient = localStorage.getItem("editPatient");
    if (storedPatient) {
      setPatientData(JSON.parse(storedPatient));
      setIsEditing(true);
      localStorage.removeItem("editPatient");
    }
  }, []);

  // **Handle Input Changes**
  const handleChange = (e, category, index, field) => {
    const updatedData = { ...patientData };
    if (category) {
      updatedData[category][index][field] = e.target.value;
    } else {
      updatedData[e.target.name] = e.target.value;
    }
    setPatientData(updatedData);
  };

  // **Add More Fields**
  // Update the addNewEntry function
  const addNewEntry = (category) => {
    const emptyEntry = {
      medical_history: { condition: "", diagnosed_on: "" },
      appointments: { date: "", doctor: "", department: "" },
      diagnostics: { test_name: "", result: "", date: "" },
      mental_health: { session_notes: "", evaluation: "", therapist: "" },
      physiotherapy: { progress_log: "", session_date: "" },
      nutrition: { dietary_plan: "", calorie_intake: "", progress: "" },
      yoga: { session_plan: "", wearable_data: "" }
    };

    setPatientData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), emptyEntry[category]]
    }));
  };

  // **Handle Form Submit**
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:3000/patients/${patientData._id}`, patientData);
      } else {
        await axios.post("http://localhost:3000/patients", patientData);
      }
      
      onPatientAdded(); // This will trigger a refresh of the patient list
      
      // Reset form and navigate
      setPatientData({
        patient_id: "",
        name: "",
        age: "",
        gender: "",
        medical_history: [{ condition: "", diagnosed_on: "" }],
        appointments: [{ date: "", doctor: "", department: "" }],
        diagnostics: [{ test_name: "", result: "", date: "" }],
        mental_health: [{ session_notes: "", evaluation: "", therapist: "" }],
        physiotherapy: [{ progress_log: "", session_date: "" }],
        nutrition: [{ dietary_plan: "", calorie_intake: "", progress: "" }],
        yoga: [{ session_plan: "", wearable_data: "" }],
      });
      navigate("/patients");
    } catch (error) {
      console.error("Error saving patient:", error);
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">{isEditing ? "Update Patient" : "Add New Patient"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Modify the Patient ID input to be read-only */}
        <div>
          <label className="block text-sm">Patient ID</label>
          <input 
            type="text" 
            name="patient_id" 
            value={patientData.patient_id} 
            className="w-full p-2 rounded bg-gray-700 text-white cursor-not-allowed" 
            readOnly 
          />
        </div>
        {/* Basic Details */}
        <div>
          <label className="block text-sm">Name</label>
          <input type="text" name="name" value={patientData.name} onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block text-sm">Age</label>
          <input type="number" name="age" value={patientData.age} onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block text-sm">Gender</label>
          <select name="gender" value={patientData.gender} onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white" required>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* All Other Sections */}
        {["medical_history", "appointments", "diagnostics", "mental_health", "physiotherapy", "nutrition", "yoga"].map((category) => (
          <div key={category}>
            <label className="block text-sm capitalize">{category.replace("_", " ")}</label>
            {patientData[category].map((entry, index) => (
              <div key={index} className="flex gap-2">
                {Object.keys(entry).map((field) => (
                  <div key={field} className="flex-1">
                    {(category === "appointments" && field === "date") || 
                     (category === "diagnostics" && field === "date") ? (
                      <DatePicker
                        selected={entry[field] ? new Date(entry[field]) : null}
                        onChange={(date) => {
                          const updatedData = { ...patientData };
                          updatedData[category][index][field] = date ? date.toISOString().split('T')[0] : '';
                          setPatientData(updatedData);
                        }}
                        dateFormat="yyyy-MM-dd"
                        className="w-full p-2 rounded bg-gray-700 text-white"
                        placeholderText={field.replace("_", " ")}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={field.replace("_", " ")}
                        value={entry[field] || ""}
                        onChange={(e) => handleChange(e, category, index, field)}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addNewEntry(category)}
              className="text-blue-400 mt-2 hover:text-blue-600"
            >
              + Add More
            </button>
          </div>
        ))}

        {/* Submit Button */}
        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          {isEditing ? "Update Patient" : "Add Patient"}
        </button>
      </form>
    </div>
  );
};

export default AddPatientForm;
