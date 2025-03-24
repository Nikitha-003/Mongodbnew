const mongoose = require("mongoose");

// FHIR Patient Resource Schema
const fhirPatientSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    default: 'Patient',
    required: true
  },
  id: {
    type: String,
    required: true,
    // Remove the unique: true from here since we'll define it with schema.index()
    unique: false
  },
  identifier: [{
    system: String,
    value: String
  }],
  active: {
    type: Boolean,
    default: true
  },
  name: [{
    use: String,
    family: String,
    given: [String]
  }],
  telecom: [{
    system: String,
    value: String,
    use: String
  }],
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unknown']
  },
  birthDate: String,
  address: [{
    use: String,
    line: [String],
    city: String,
    state: String,
    postalCode: String,
    country: String
  }],
  maritalStatus: {
    coding: [{
      system: String,
      code: String,
      display: String
    }]
  },
  contact: [{
    relationship: [{
      coding: [{
        system: String,
        code: String,
        display: String
      }]
    }],
    name: {
      family: String,
      given: [String]
    },
    telecom: [{
      system: String,
      value: String
    }]
  }],
  communication: [{
    language: {
      coding: [{
        system: String,
        code: String,
        display: String
      }]
    },
    preferred: Boolean
  }],
  managingOrganization: {
    reference: String,
    display: String
  }
});

// Add indexes for better query performance
fhirPatientSchema.index({ resourceType: 1 });
fhirPatientSchema.index({ id: 1 }, { unique: true });

const FHIRPatient = mongoose.model("FHIRPatient", fhirPatientSchema, "fhir_patients");

module.exports = FHIRPatient;