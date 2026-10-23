const mongoose = require('mongoose');
module.exports = mongoose.model('BloodRequest', new mongoose.Schema({
  patientName: String,
  patientEmail: String,
  bloodGroup: String,
  units: Number,
  urgency: { type: String, enum: ['normal', 'urgent', 'emergency'], default: 'normal' },
  reason: String,
  requestedBy: String,
  status: { type: String, enum: ['pending', 'fulfilled', 'rejected'], default: 'pending' },
  date: { type: Date, default: Date.now }
}));
