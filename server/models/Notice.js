const mongoose = require('mongoose');
module.exports = mongoose.model('Notice', new mongoose.Schema({
  title: String,
  message: String,
  category: { type: String, enum: ['general', 'emergency', 'event', 'holiday'], default: 'general' },
  priority: { type: String, enum: ['normal', 'high'], default: 'normal' },
  validUntil: String,
  postedBy: String,
  createdAt: { type: Date, default: Date.now }
}));
