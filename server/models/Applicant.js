const mongoose = require('mongoose');
module.exports = mongoose.model('Applicant', new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting' },
  name: String,
  email: String,
  phone: String,
  qualification: String,
  experienceYears: Number,
  resumeNote: String,
  stage: { type: String, enum: ['applied', 'screening', 'interview', 'offered', 'hired', 'rejected'], default: 'applied' },
  appliedDate: { type: Date, default: Date.now },
  interviewDate: String,
  remarks: String,
  decidedBy: String
}));
