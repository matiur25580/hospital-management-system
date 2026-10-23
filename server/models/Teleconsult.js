const mongoose = require('mongoose');
module.exports = mongoose.model('Teleconsult', new mongoose.Schema({
  patientName: String,
  patientEmail: String,
  patientPhone: String,
  doctorName: String,
  doctorEmail: String,
  department: String,
  date: String,
  timeSlot: String,
  symptoms: String,
  fee: Number,
  status: { type: String, enum: ['requested', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'requested' },
  meetingLink: String,
  prescription: String,
  notes: String,
  bookedAt: { type: Date, default: Date.now }
}));
