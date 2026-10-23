const mongoose = require('mongoose');
const slotSchema = new mongoose.Schema({
  day: String,
  start: String,
  end: String,
  active: { type: Boolean, default: true }
});
module.exports = mongoose.model('DoctorSchedule', new mongoose.Schema({
  doctorEmail: { type: String, required: true, unique: true },
  doctorName: String,
  weekly: [slotSchema],
  leaves: [Date],
  updatedAt: { type: Date, default: Date.now }
}));
