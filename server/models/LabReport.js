const mongoose = require('mongoose');
const labReportSchema = new mongoose.Schema({
  patientEmail: { type: String, required: true, index: true },
  patientName: String,
  doctorEmail: { type: String, index: true },
  testName: { type: String, required: true },
  testCategory: String,
  result: String,
  normalRange: String,
  isCritical: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'reviewed', 'retest'], default: 'pending' },
  reviewedBy: String,
  reviewNote: String,
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('LabReport', labReportSchema);
