const mongoose = require('mongoose');
const bedSchema = new mongoose.Schema({
  bedNo: { type: String, required: true, unique: true },
  ward: { type: String, enum: ['General','ICU','Emergency','Cabin'], required: true },
  status: { type: String, enum: ['available','occupied','maintenance'], default: 'available' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
module.exports = mongoose.model('Bed', bedSchema);
