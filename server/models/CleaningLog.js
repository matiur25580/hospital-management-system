const mongoose = require('mongoose');
module.exports = mongoose.models.CleaningLog || mongoose.model('CleaningLog', new mongoose.Schema({
  date: String, zone: String, task: String, shift: String, assignedTo: String,
  status: { type: String, enum: ['pending', 'done'], default: 'done' },
  doneBy: String, verifiedBy: String, notes: String,
  createdAt: { type: Date, default: Date.now }
}));
