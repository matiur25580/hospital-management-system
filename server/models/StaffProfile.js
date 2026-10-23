const mongoose = require('mongoose');
const s = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  employeeId: { type: String, unique: true },
  designation: String,
  department: String,
  roleCategory: { type: String, enum: ['management', 'doctor', 'nurse', 'receptionist', 'security', 'support'] },
  employmentType: { type: String, enum: ['government', 'private'], default: 'private' },
  level: Number,
  basicPay: Number,
  reportingTo: String,
  functions: [String],
  joinDate: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  linkedUser: Boolean,
  photo: String,
  bloodGroup: String,
  dateOfBirth: String,
  validUntil: String
});
module.exports = mongoose.model('StaffProfile', s);
