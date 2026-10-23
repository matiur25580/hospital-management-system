const mongoose = require('mongoose');
module.exports = mongoose.model('JobPosting', new mongoose.Schema({
  title: String,
  department: String,
  designation: String,
  employmentType: { type: String, enum: ['government', 'private'], default: 'private' },
  vacancies: Number,
  qualification: String,
  experience: String,
  salaryRange: String,
  description: String,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  postedDate: { type: Date, default: Date.now },
  postedBy: String
}));
