const mongoose = require('mongoose');
module.exports = mongoose.model('Ambulance', new mongoose.Schema({
  vehicleNo: { type: String, unique: true },
  driverName: String,
  driverPhone: String,
  type: { type: String, enum: ['basic', 'advanced', 'icu'], default: 'basic' },
  status: { type: String, enum: ['available', 'on-trip', 'maintenance'], default: 'available' },
  baseLocation: String
}));
