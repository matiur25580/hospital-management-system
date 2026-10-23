const mongoose = require('mongoose');
module.exports = mongoose.model('Feedback', new mongoose.Schema({
  patientName: String,
  patientEmail: String,
  department: String,
  doctorName: String,
  ratings: { cleanliness: Number, staffBehavior: Number, doctorCare: Number, waitingTime: Number, overall: Number },
  comments: String,
  submittedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'reviewed'], default: 'new' }
}));
