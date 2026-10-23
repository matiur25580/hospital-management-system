const mongoose = require('mongoose');
module.exports = mongoose.model('Inventory', new mongoose.Schema({
  itemName: { type: String, unique: true },
  category: { type: String, enum: ['medicine', 'consumable', 'surgical', 'equipment'], default: 'medicine' },
  batchNo: String,
  quantity: Number,
  unit: String,
  expiryDate: String,
  supplier: String,
  purchasePrice: Number,
  reorderLevel: Number,
  location: String
}));
