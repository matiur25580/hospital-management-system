const mongoose = require('mongoose');
// Appointment records connect a patient, doctor, scheduled slot, and the visit's workflow status.
const appointmentSchema = new mongoose.Schema({
  tokenNo: { type: Number, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlot: String,
  status: { type: String, enum: ['booked','in-queue','consulting','completed','cancelled'], default: 'booked' },
  symptoms: String,
  prescription: String
}, { timestamps: true });
module.exports = mongoose.model('Appointment', appointmentSchema);
