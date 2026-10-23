const mongoose = require('mongoose');
const noteSchema = new mongoose.Schema({
  author: String,
  role: String,
  text: String,
  date: { type: Date, default: Date.now }
});
const billItemSchema = new mongoose.Schema({
  description: String,
  amount: Number
});
module.exports = mongoose.model('PatientCase', new mongoose.Schema({
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  age: String,
  gender: String,
  phone: String,
  address: String,
  disease: String,
  symptoms: String,
  duration: String,
  medicalHistory: String,
  allergies: String,
  status: { type: String, enum: ['new', 'under-treatment', 'discharged'], default: 'new' },
  notes: [noteSchema],
  billItems: [billItemSchema],
  doctorFee: { type: Number, default: 0 },
  billPdfUrl: String,
  dischargedAt: Date,
  pdfUrl: String,
  dischargePdfUrl: String,
  submittedAt: { type: Date, default: Date.now }
}));
