const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  sequence: { type: Number, required: true, default: 0 }
});
schema.index({ year: 1 }, { unique: true });
module.exports = mongoose.model('GatePassCounter', schema);
