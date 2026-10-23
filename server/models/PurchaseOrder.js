const mongoose = require('mongoose');
module.exports = mongoose.model('PurchaseOrder', new mongoose.Schema({
  poNo: { type: String, unique: true },
  supplier: String,
  items: [{ itemName: String, quantity: Number, unit: String, rate: Number, batchNo: String, expiryDate: String }],
  totalAmount: Number,
  status: { type: String, enum: ['draft', 'sent', 'received', 'cancelled'], default: 'draft' },
  orderDate: { type: Date, default: Date.now },
  expectedDate: String,
  receivedDate: String,
  orderedBy: String,
  notes: String
}));
