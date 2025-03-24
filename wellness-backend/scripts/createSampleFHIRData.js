require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const FHIRPatient = require('../models/FHIRPatient');
const FHIRObservation = require('../models/FHIRObservation');

async function createSampleFHIRData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await FHIRPatient.deleteMany({});
    await FHIRObservation.deleteMany({});
    
    console.log('Cleared existing FHIR data');
    
    // Create sample patients
    const patients = [];
    const patientIds = [];
    
    // Sample patient data
    const samplePatients = [
      {
        name: [{ family: 'Smith', given: ['John'] }],
        gender: 'male',
        birthDate: '1970-10-15'
      },
      {
        name: [{ family: 'Johnson', given: ['Emily'] }],
        gender: 'female',
        birthDate: '1985-05-23'
      },
      {
        name: [{ family: 'Williams', given: ['Robert'] }],
        gender: 'male',
        birthDate: '1962-12-10'
      },
      {
        name: [{ family: 'Brown', given: ['Sarah'] }],
        gender: 'female',
        birthDate: '1990-08-30'
      },
      {
        name: [{ family: 'Jones', given: ['Michael'] }],
        gender: 'male',
        birthDate: '1978-03-17'
      },
      {
        name: [{ family: 'Garcia', given: ['Maria'] }],
        gender: 'female',
        birthDate: '1995-11-05'
      },
      {
        name: [{ family: 'Miller', given: ['David'] }],
        gender: 'male',
        birthDate: '1982-07-22'
      },
      {
        name: [{ family: 'Davis', given: ['Jennifer'] }],
        gender: 'female',
        birthDate: '1975-01-14'
      }
    ];
    
    // Create FHIR patients
    for (const patientData of samplePatients) {
      const patientId = uuidv4();
      patientIds.push(patientId);
      
      const fhirPatient = new FHIRPatient({
        resourceType: 'Patient',
        id: patientId,
        identifier: [
          {
            system: 'http://example.org/fhir/ids',
            value: `patient-${patientId.substring(0, 8)}`
          }
        ],
        active: true,
        name: patientData.name,
        gender: patientData.gender,
        birthDate: patientData.birthDate,
        telecom: [
          {
            system: 'phone',
            value: `555-${Math.floor(1000 + Math.random() * 9000)}`,
            use: 'home'
          },
          {
            system: 'email',
            value: `${patientData.name[0].given[0].toLowerCase()}.${patientData.name[0].family.toLowerCase()}@example.com`,
            use: 'work'
          }
        ],
        address: [
          {
            use: 'home',
            line: [`${Math.floor(100 + Math.random() * 9900)} Main St`],
            city: 'Anytown',
            state: 'CA',
            postalCode: `${Math.floor(10000 + Math.random() * 90000)}`,
            country: 'USA'
          }
        ]
      });
      
      patients.push(fhirPatient);
    }
    
    // Save all patients
    await FHIRPatient.insertMany(patients);
    console.log(`Created ${patients.length} FHIR patients`);
    
    // Create sample observations
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
    
    console.log('Sample FHIR data creation complete!');
  } catch (error) {
    console.error('Error creating sample FHIR data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createSampleFHIRData();