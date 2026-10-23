const mongoose = require('mongoose');
const s = new mongoose.Schema({
  staffEmail: String,
  staffName: String,
  role: String,
  date: String,
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' }
});
s.index({ staffEmail: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('Attendance', s);
