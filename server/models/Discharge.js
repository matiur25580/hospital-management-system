const mongoose = require('mongoose');
module.exports = mongoose.model('Discharge', new mongoose.Schema({
  patientName: String,
  patientEmail: String,
  admissionDate: String,
  dischargeDate: String,
  department: String,
  doctorName: String,
  diagnosis: String,
  proceduresDone: [String],
  treatmentGiven: String,
  medications: [{ name: String, dosage: String, duration: String }],
  followUpDate: String,
  followUpDoctor: String,
  dietAdvice: String,
  activityAdvice: String,
  conditionOnDischarge: String,
  status: { type: String, enum: ['ready', 'completed'], default: 'ready' },
  preparedBy: String,
  createdAt: { type: Date, default: Date.now }
}));
