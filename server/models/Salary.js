const mongoose = require('mongoose');
const s = new mongoose.Schema({
  staffEmail: String,
  staffName: String,
  employeeId: String,
  designation: String,
  department: String,
  employmentType: String,
  month: String,
  basicPay: Number, hra: Number, da: Number, medical: Number, transport: Number,
  grossPay: Number,
  pf: Number, esi: Number, tax: Number, totalDeductions: Number,
  netPay: Number,
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidDate: Date,
  generatedAt: { type: Date, default: Date.now }
});
s.index({ staffEmail: 1, month: 1 }, { unique: true });
module.exports = mongoose.model('Salary', s);
