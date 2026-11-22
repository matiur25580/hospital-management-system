const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  sequence: { type: Number, required: true, default: 0 }
});
schema.index({ doctor: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('AppointmentCounter', schema);
