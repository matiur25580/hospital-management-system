const mongoose = require('mongoose');
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'reset'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 180 }
});
module.exports = mongoose.model('Otp', otpSchema);
