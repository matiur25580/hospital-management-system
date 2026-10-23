const mongoose = require('mongoose');
module.exports = mongoose.model('Department', new mongoose.Schema({
  code: { type: String, unique: true },
  name: String,
  floor: String,
  opdRooms: [String],
  hod: String,
  doctors: [{ name: String, email: String, designation: String, qualification: String }],
  nurseCount: Number,
  opdDays: [String],
  sessions: [String],
  scheduleNote: String,
  description: String
}));
