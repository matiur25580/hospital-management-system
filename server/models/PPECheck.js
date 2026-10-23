const mongoose = require('mongoose');
module.exports = mongoose.models.PPECheck || mongoose.model('PPECheck', new mongoose.Schema({
  personName: String,
  personRole: { type: String, enum: ['patient','attendant','doctor','nurse','receptionist','staff','other'], default: 'other' },
  zone: { type: String, enum: ['main-gate','opd','ipd','ot','lab','pharmacy','emergency','billing'], default: 'main-gate' },
  maskWorn: { type: Boolean, default: false },
  glovesWorn: { type: Boolean, default: false },
  maskProvided: { type: Boolean, default: false },
  compliant: { type: Boolean, default: false },
  remarks: String,
  checkedBy: String,
  createdAt: { type: Date, default: Date.now }
}));
