const mongoose = require('mongoose');
module.exports = mongoose.model('LabCatalog', new mongoose.Schema({
  code: { type: String, unique: true },
  name: String,
  category: String,
  price: Number,
  sampleType: String,
  normalRange: String,
  tatHours: Number
}));
