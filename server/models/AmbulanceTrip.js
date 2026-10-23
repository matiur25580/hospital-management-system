const mongoose = require('mongoose');
module.exports = mongoose.model('AmbulanceTrip', new mongoose.Schema({
  ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  vehicleNo: String,
  driverName: String,
  driverPhone: String,
  patientName: String,
  patientPhone: String,
  pickupLocation: String,
  destination: String,
  currentLocation: String,
  status: { type: String, enum: ['dispatched', 'en-route', 'on-scene', 'to-hospital', 'completed', 'cancelled'], default: 'dispatched' },
  stages: { dispatched: Date, enRoute: Date, onScene: Date, toHospital: Date, completed: Date },
  notes: String,
  dispatchedBy: String,
  dispatchedAt: { type: Date, default: Date.now }
}));
