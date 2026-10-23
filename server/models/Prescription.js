const mongoose = require('mongoose');
const medSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instruction: String,
}, { _id: false });
const prescriptionSchema = new mongoose.Schema({
  doctorEmail: { type: String, required: true, index: true },
  doctorName: String,
  patientEmail: { type: String, required: true, index: true },
  patientName: String,
  diagnosis: { type: String, required: true },
  medicines: { type: [medSchema], required: true },
  notes: String,
  followUpDate: Date,
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Prescription', prescriptionSchema);
