const mongoose = require('mongoose');
module.exports = mongoose.model('Dispense', new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicineName: String,
  quantity: Number,
  patientName: String,
  patientEmail: String,
  caseId: String,
  dispensedBy: String,
  date: { type: Date, default: Date.now }
}));
