const mongoose = require('mongoose');
const bedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
  patientName: String,
  patientEmail: String,
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientCase' },
  assignedAt: Date,
  assignedBy: String
});
bedSchema.index({ bedNumber: 1, ward: 1 }, { unique: true });
module.exports = mongoose.model('Bed', bedSchema);
