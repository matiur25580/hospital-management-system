const mongoose = require('mongoose');
module.exports = mongoose.model('Medicine', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  genericName: String,
  batchNo: String,
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'tablet' },
  price: { type: Number, default: 0 },
  expiryDate: Date,
  minStock: { type: Number, default: 10 },
  supplier: String,
  createdAt: { type: Date, default: Date.now }
}));
