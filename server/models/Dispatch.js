const mongoose = require('mongoose');
module.exports = mongoose.model('Dispatch', new mongoose.Schema({
  ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  vehicleNo: String,
  driverName: String,
  patientName: String,
  patientPhone: String,
  pickupLocation: String,
  destination: String,
  emergencyType: String,
  status: { type: String, enum: ['requested', 'dispatched', 'arrived', 'completed', 'cancelled'], default: 'requested' },
  requestedBy: String,
  requestedAt: { type: Date, default: Date.now },
  dispatchedAt: Date,
  completedAt: Date
}));
