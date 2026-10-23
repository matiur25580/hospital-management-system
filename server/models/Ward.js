const mongoose = require('mongoose');
module.exports = mongoose.model('Ward', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['General', 'ICU', 'Emergency', 'Private'], default: 'General' },
  floor: String,
  createdAt: { type: Date, default: Date.now }
}));
