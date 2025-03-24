const mongoose = require("mongoose");

// FHIR Observation Resource Schema
const fhirObservationSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    default: 'Observation',
    required: true
  },
  id: {
    type: String,
    required: true,
    // Remove the unique: true from here since we'll define it with schema.index()
    unique: false
  },
  status: {
    type: String,
    enum: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'],
    required: true
  },
  category: [{
    coding: [{
      system: String,
      code: String,
      display: String
    }]
  }],
  code: {
    coding: [{
      system: String,
      code: String,
      display: String
    }],
    text: String
  },
  subject: {
    reference: String,
    display: String
  },
  effectiveDateTime: String,
  issued: String,
  performer: [{
    reference: String,
    display: String
  }],
  valueQuantity: {
    value: Number,
    unit: String,
    system: String,
    code: String
  },
  valueString: String,
  valueBoolean: Boolean,
  valueInteger: Number,
  valueRange: {
    low: {
      value: Number,
      unit: String
    },
    high: {
      value: Number,
      unit: String
    }
  },
  interpretation: [{
    coding: [{
      system: String,
      code: String,
      display: String
    }]
  }],
  note: [{
    text: String
  }]
});

// Add indexes for better query performance
fhirObservationSchema.index({ resourceType: 1 });
fhirObservationSchema.index({ id: 1 }, { unique: true });
fhirObservationSchema.index({ "subject.reference": 1 });

const FHIRObservation = mongoose.model("FHIRObservation", fhirObservationSchema, "fhir_observations");

module.exports = FHIRObservation;