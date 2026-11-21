const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  email: { type: String, lowercase: true, trim: true, index: true },
  patientId: { type: String, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ['male','female','other'] },
  phone: { type: String, required: true },
  address: String,
  bloodGroup: String,
  emergencyContact: String,
  medicalHistory: [{ date: Date, diagnosis: String, doctor: String, notes: String }]
}, { timestamps: true });
module.exports = mongoose.model('Patient', patientSchema);
