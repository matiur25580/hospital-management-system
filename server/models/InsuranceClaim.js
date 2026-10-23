const mongoose = require('mongoose');
module.exports = mongoose.model('InsuranceClaim', new mongoose.Schema({
  claimNo: { type: String, unique: true },
  patientName: String,
  patientEmail: String,
  scheme: { type: String, enum: ['swasthya-sathi', 'ayushman', 'private', 'esi'], default: 'swasthya-sathi' },
  cardNo: String,
  billNo: String,
  billAmount: Number,
  claimAmount: Number,
  admissionDate: String,
  dischargeDate: String,
  diagnosis: String,
  documents: [String],
  status: { type: String, enum: ['draft', 'submitted', 'under-review', 'query-raised', 'approved', 'rejected', 'settled'], default: 'draft' },
  statusHistory: [{ status: String, date: Date, remarks: String, by: String }],
  remarks: String,
  handledBy: String,
  createdAt: { type: Date, default: Date.now }
}));
