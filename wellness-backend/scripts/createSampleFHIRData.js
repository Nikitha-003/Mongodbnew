require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const FHIRPatient = require('../models/FHIRPatient');
const FHIRObservation = require('../models/FHIRObservation');
const Patient = require('../models/Patient'); // Add this to import your actual Patient model

async function createSampleFHIRData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing FHIR data
    await FHIRPatient.deleteMany({});
    await FHIRObservation.deleteMany({});
    
    console.log('Cleared existing FHIR data');
    
    // Fetch actual patients from your database
    const actualPatients = await Patient.find();
    console.log(`Found ${actualPatients.length} actual patients to convert to FHIR format`);
    
    if (actualPatients.length === 0) {
      console.log('No actual patients found. Please add patients to your system first.');
      return;
    }
    
    // Create FHIR patients from actual patients
    const patients = [];
    const patientIds = [];
    
    for (const actualPatient of actualPatients) {
      const patientId = uuidv4();
      patientIds.push(patientId);
      
      // Extract name parts (assuming name is in format "First Last")
      let given = ['Unknown'];
      let family = 'Unknown';
      
      if (actualPatient.name) {
        const nameParts = actualPatient.name.split(' ');
        if (nameParts.length > 1) {
          family = nameParts.pop(); // Last part is family name
          given = nameParts; // Remaining parts are given names
        } else {
          // If only one name part, use it as given name
          given = [actualPatient.name];
        }
      }
      
      // Create FHIR patient from actual patient data
      const fhirPatient = new FHIRPatient({
        resourceType: 'Patient',
        id: patientId,
        identifier: [
          {
            system: 'http://example.org/fhir/ids',
            value: actualPatient.patient_id || `patient-${patientId.substring(0, 8)}`
          }
        ],
        active: true,
        name: [{ 
          family: family,
          given: given
        }],
        gender: actualPatient.gender?.toLowerCase() || 'unknown',
        birthDate: calculateBirthDateFromAge(actualPatient.age),
        telecom: [
          {
            system: 'phone',
            value: actualPatient.phone || `555-${Math.floor(1000 + Math.random() * 9000)}`,
            use: 'home'
          },
          {
            system: 'email',
            value: actualPatient.email || `${given[0].toLowerCase()}.${family.toLowerCase()}@example.com`,
            use: 'work'
          }
        ],
        address: actualPatient.address ? [
          {
            use: 'home',
            line: [actualPatient.address],
            city: 'Anytown',
            state: 'CA',
            postalCode: `${Math.floor(10000 + Math.random() * 90000)}`,
            country: 'USA'
          }
        ] : []
      });
      
      patients.push(fhirPatient);
    }
    
    // Save all patients
    await FHIRPatient.insertMany(patients);
    console.log(`Created ${patients.length} FHIR patients from actual patient data`);
    
    // Create sample observations (similar to before)
    const observations = [];
    
    // Observation types
    const observationTypes = [
      {
        code: {
          coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }],
          text: 'Heart rate'
        },
        unit: 'beats/minute',
        valueRange: [60, 100]
      },
      {
        code: {
          coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }],
          text: 'Body temperature'
        },
        unit: 'degrees C',
        valueRange: [36.1, 37.2]
      },
      {
        code: {
          coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }],
          text: 'Systolic blood pressure'
        },
        unit: 'mm[Hg]',
        valueRange: [90, 140]
      },
      {
        code: {
          coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }],
          text: 'Diastolic blood pressure'
        },
        unit: 'mm[Hg]',
        valueRange: [60, 90]
      }
    ];
    
    // Create observations for each patient
    for (const patientId of patientIds) {
      // Create 3-5 observations per patient
      const numObservations = Math.floor(3 + Math.random() * 3);
      
      for (let i = 0; i < numObservations; i++) {
        // Pick a random observation type
        const obsType = observationTypes[Math.floor(Math.random() * observationTypes.length)];
        
        // Generate a random value within the range
        const value = obsType.valueRange[0] + Math.random() * (obsType.valueRange[1] - obsType.valueRange[0]);
        
        // Create a date within the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const effectiveDateTime = date.toISOString();
        
        const observation = new FHIRObservation({
          resourceType: 'Observation',
          id: uuidv4(),
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'vital-signs',
                  display: 'Vital Signs'
                }
              ]
            }
          ],
          code: obsType.code,
          subject: {
            reference: `Patient/${patientId}`,
            display: 'Patient'
          },
          effectiveDateTime: effectiveDateTime,
          issued: effectiveDateTime,
          valueQuantity: {
            value: parseFloat(value.toFixed(1)),
            unit: obsType.unit,
            system: 'http://unitsofmeasure.org',
            code: obsType.unit
          }
        });
        
        observations.push(observation);
      }
    }
    
    // Save all observations
    await FHIRObservation.insertMany(observations);
    console.log(`Created ${observations.length} FHIR observations`);
    
    console.log('FHIR data creation from actual patients complete!');
  } catch (error) {
    console.error('Error creating FHIR data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Helper function to calculate birth date from age
function calculateBirthDateFromAge(age) {
  if (!age || isNaN(parseInt(age))) {
    // Default to a random age between 20-80 if age is not provided
    age = Math.floor(20 + Math.random() * 60);
  }
  
  const today = new Date();
  const birthYear = today.getFullYear() - parseInt(age);
  const month = Math.floor(Math.random() * 12) + 1; // Random month 1-12
  const day = Math.floor(Math.random() * 28) + 1; // Random day 1-28 (to avoid invalid dates)
  
  return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Run the function
createSampleFHIRData();