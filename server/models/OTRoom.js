const mongoose = require('mongoose');
module.exports = mongoose.model('OTRoom', new mongoose.Schema({
  otNo: { type: String, unique: true },
  floor: String,
  type: String,
  status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' }
}));
