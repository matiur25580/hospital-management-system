const mongoose = require('mongoose');
module.exports = mongoose.models.Appraisal || mongoose.model('Appraisal', new mongoose.Schema({
  staffEmail: String,
  staffName: String,
  designation: String,
  department: String,
  reviewPeriod: String,
  ratings: { punctuality: Number, patientCare: Number, teamwork: Number, skills: Number, discipline: Number },
  overallScore: Number,
  strengths: String,
  improvements: String,
  goals: String,
  reviewedBy: String,
  reviewDate: Date,
  status: { type: String, enum: ['draft', 'submitted', 'acknowledged'], default: 'draft' },
  employeeComments: String
}));
