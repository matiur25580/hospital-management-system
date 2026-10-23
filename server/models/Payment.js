const mongoose = require('mongoose');
const payEntry = new mongoose.Schema({
  amount: Number,
  method: { type: String, enum: ['cash', 'card', 'upi', 'other'], default: 'cash' },
  receivedBy: String,
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Payment', new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientCase', unique: true },
  patientName: String,
  patientEmail: String,
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  payments: [payEntry],
  status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  createdAt: { type: Date, default: Date.now }
}));
