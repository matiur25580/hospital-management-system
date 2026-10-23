const mongoose = require('mongoose');
module.exports = mongoose.model('Vital', new mongoose.Schema({
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  temperature: String,
  bp: String,
  pulse: String,
  notes: String,
  recordedBy: String,
  date: { type: Date, default: Date.now }
}));
