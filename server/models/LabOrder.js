const mongoose = require('mongoose');
module.exports = mongoose.model('LabOrder', new mongoose.Schema({
  patientName: String,
  patientEmail: String,
  tests: [{
    code: String, name: String, price: Number, normalRange: String,
    result: { type: String, default: '' },
    flag: { type: String, enum: ['', 'normal', 'high', 'low'], default: '' }
  }],
  totalAmount: Number,
  orderedBy: String,
  orderDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['ordered', 'sample-collected', 'in-progress', 'reported'], default: 'ordered' },
  collectedBy: String,
  reportedBy: String,
  reportedAt: Date
}));
