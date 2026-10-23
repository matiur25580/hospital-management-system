const mongoose = require('mongoose');
module.exports = mongoose.model('LeaveRequest', new mongoose.Schema({
  staffEmail: String,
  staffName: String,
  designation: String,
  department: String,
  leaveType: { type: String, enum: ['sick', 'casual', 'earned', 'maternity', 'paternity'], default: 'casual' },
  fromDate: String,
  toDate: String,
  days: Number,
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedDate: { type: Date, default: Date.now },
  decidedBy: String,
  decidedDate: Date,
  remarks: String
}));
