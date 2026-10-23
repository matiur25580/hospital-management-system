const mongoose = require('mongoose');
module.exports = mongoose.model('BloodStock', new mongoose.Schema({
  bloodGroup: { type: String, unique: true },
  units: { type: Number, default: 0 }
}));
