const mongoose = require('mongoose');
module.exports = mongoose.model('OTSurgery', new mongoose.Schema({
  patientName: String,
  patientEmail: String,
  surgeryType: String,
  department: String,
  surgeonName: String,
  surgeonEmail: String,
  anesthetistName: String,
  assistantDoctors: [String],
  nurseNames: [String],
  otNo: String,
  date: String,
  startTime: String,
  endTime: String,
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  notes: String,
  bookedBy: String,
  createdAt: { type: Date, default: Date.now }
}));
