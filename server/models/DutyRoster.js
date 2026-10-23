const mongoose = require('mongoose');
const s = new mongoose.Schema({
  date: String,
  staffEmail: String,
  staffName: String,
  role: String,
  department: String,
  shift: { type: String, enum: ['morning', 'evening', 'night'] },
  startTime: String,
  endTime: String,
  hours: Number
});
s.index({ date: 1, staffEmail: 1, shift: 1 });
module.exports = mongoose.model('DutyRoster', s);
