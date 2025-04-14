const Patient = require('../models/Patient');

// Get patient age distribution in FHIR format
exports.getPatientAgeDistribution = async (req, res) => {
  try {
    // Check if user is admin or doctor
    if (req.user.userType !== 'admin' && req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }
    
    // Get all patients
    const patients = await Patient.find({}, 'dob age gender');
    
    // Calculate age distribution
    const ageGroups = {
      '0-17': 0,
      '18-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61-75': 0,
      '76+': 0
    };
    
    // Process each patient
    patients.forEach(patient => {
      // If patient has age directly, use it
      if (patient.age && !isNaN(parseInt(patient.age))) {
        const age = parseInt(patient.age);
        
        // Assign to age group based on the numeric age
        if (age <= 17) ageGroups['0-17']++;
        else if (age <= 30) ageGroups['18-30']++;
        else if (age <= 45) ageGroups['31-45']++;
        else if (age <= 60) ageGroups['46-60']++;
        else if (age <= 75) ageGroups['61-75']++;
        else ageGroups['76+']++;
      }
      // If no age but has DOB, calculate age from DOB
      else if (patient.dob) {
        try {
          const dob = new Date(patient.dob);
          if (!isNaN(dob.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            
            // Adjust age if birthday hasn't occurred yet this year
            if (today.getMonth() < dob.getMonth() || 
                (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
              age--;
            }
            
            // Assign to age group based on calculated age
            if (age <= 17) ageGroups['0-17']++;
            else if (age <= 30) ageGroups['18-30']++;
            else if (age <= 45) ageGroups['31-45']++;
            else if (age <= 60) ageGroups['46-60']++;
            else if (age <= 75) ageGroups['61-75']++;
            else ageGroups['76+']++;
          }
        } catch (error) {
          console.error('Error calculating age from DOB:', error);
        }
      }
    });
    
    // Format for FHIR-like structure
    const fhirData = {
      resourceType: "Bundle",
      type: "collection",
      entry: Object.keys(ageGroups).map(group => ({
        resource: {
          resourceType: "Observation",
          category: [{
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "survey",
              display: "Survey"
            }]
          }],
          code: {
            coding: [{
              system: "http://loinc.org",
              code: "80977-2",
              display: "Patient age distribution"
            }]
          },
          valueQuantity: {
            value: ageGroups[group],
            unit: "patients",
            system: "http://unitsofmeasure.org",
            code: "{patients}"
          },
          subject: {
            reference: `AgeGroup/${group}`
          }
        }
      }))
    };
    
    res.json(fhirData);
  } catch (error) {
    console.error('Error fetching age distribution:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get gender distribution
exports.getPatientGenderDistribution = async (req, res) => {
  try {
    // Check if user is admin or doctor
    if (req.user.userType !== 'admin' && req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }
    
    // Get all patients
    const patients = await Patient.find({}, 'gender');
    
    // Calculate gender distribution
    const genderCount = {
      male: 0,
      female: 0,
      other: 0,
      unknown: 0
    };
    
    // Process each patient
    patients.forEach(patient => {
      const gender = (patient.gender || '').toLowerCase();
      
      if (gender === 'male') genderCount.male++;
      else if (gender === 'female') genderCount.female++;
      else if (gender) genderCount.other++;
      else genderCount.unknown++;
    });
    
    // Format for FHIR-like structure
    const fhirData = {
      resourceType: "Bundle",
      type: "collection",
      entry: Object.keys(genderCount).map(gender => ({
        resource: {
          resourceType: "Observation",
          category: [{
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "survey",
              display: "Survey"
            }]
          }],
          code: {
            coding: [{
              system: "http://loinc.org",
              code: "76689-9",
              display: "Patient gender distribution"
            }]
          },
          valueQuantity: {
            value: genderCount[gender],
            unit: "patients",
            system: "http://unitsofmeasure.org",
            code: "{patients}"
          },
          subject: {
            reference: `Gender/${gender}`
          }
        }
      }))
    };
    
    res.json(fhirData);
  } catch (error) {
    console.error('Error fetching gender distribution:', error);
    res.status(500).json({ message: error.message });
  }
};