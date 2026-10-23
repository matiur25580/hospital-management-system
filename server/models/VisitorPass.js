const mongoose = require('mongoose');
module.exports = mongoose.model('VisitorPass', new mongoose.Schema({
  passNo: { type: String, unique: true },
  visitorName: String,
  phone: String,
  idProofType: String,
  idProofNo: String,
  purpose: { type: String, enum: ['patient-visit', 'doctor-meet', 'vendor', 'interview', 'delivery', 'other'], default: 'patient-visit' },
  patientName: String,
  personToMeet: String,
  department: String,
  vehicleNo: String,
  gateNo: String,
  checkIn: { type: Date, default: Date.now },
  checkOut: Date,
  status: { type: String, enum: ['checked-in', 'checked-out'], default: 'checked-in' },
  issuedBy: String
}));
