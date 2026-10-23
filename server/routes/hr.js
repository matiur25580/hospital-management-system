const r = require('express').Router();
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const LeaveRequest = require('../models/LeaveRequest');
const Appraisal = require('../models/Appraisal');
const JobPosting = require('../models/JobPosting');
const Applicant = require('../models/Applicant');
const StaffProfile = require('../models/StaffProfile');
const User = require('../models/User');

let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch (e) { try { bcrypt = require('bcrypt'); } catch (e2) {} }
function modelHashesPw() {
  try {
    const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'User.js'), 'utf8');
    return /pre\(['"]save['"]/.test(src) && /bcrypt/.test(src);
  } catch (e) { return false; }
}
function nameFieldOf() {
  const paths = Object.keys(User.schema.paths);
  return ['fullName', 'name', 'full_name'].find(f => paths.includes(f)) || 'name';
}

// ---------------- Leave ----------------
r.get('/leave', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.staffEmail) q.staffEmail = req.query.staffEmail;
    res.json(await LeaveRequest.find(q).sort({ appliedDate: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/leave/apply', protect, async (req, res) => {
  try { res.status(201).json(await LeaveRequest.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/leave/:id/decide', protect, async (req, res) => {
  try {
    res.json(await LeaveRequest.findByIdAndUpdate(req.params.id,
      { status: req.body.status, remarks: req.body.remarks || '', decidedBy: req.body.decidedBy, decidedDate: new Date() },
      { new: true }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ---------------- Appraisal ----------------
r.get('/appraisal', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.staffEmail) q.staffEmail = req.query.staffEmail;
    if (req.query.period) q.reviewPeriod = req.query.period;
    res.json(await Appraisal.find(q).sort({ reviewPeriod: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST upsert by staffEmail + reviewPeriod
r.post('/appraisal', protect, async (req, res) => {
  try {
    const rt = req.body.ratings || {};
    const vals = [rt.punctuality, rt.patientCare, rt.teamwork, rt.skills, rt.discipline].map(Number);
    const overall = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : 0;
    const doc = await Appraisal.findOneAndUpdate(
      { staffEmail: req.body.staffEmail, reviewPeriod: req.body.reviewPeriod },
      { ...req.body, overallScore: overall, reviewDate: new Date() },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/appraisal/:id/acknowledge', protect, async (req, res) => {
  try {
    res.json(await Appraisal.findByIdAndUpdate(req.params.id,
      { status: 'acknowledged', employeeComments: req.body.employeeComments || '' }, { new: true }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ---------------- Recruitment ----------------
r.get('/recruitment/jobs', protect, async (req, res) => {
  try {
    const q = req.query.status ? { status: req.query.status } : {};
    res.json(await JobPosting.find(q).sort({ postedDate: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/recruitment/jobs', protect, async (req, res) => {
  try { res.status(201).json(await JobPosting.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/recruitment/jobs/:id', protect, async (req, res) => {
  try { res.json(await JobPosting.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.get('/recruitment/applicants', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.jobId) q.jobId = req.query.jobId;
    if (req.query.stage) q.stage = req.query.stage;
    res.json(await Applicant.find(q).populate('jobId', 'title designation').sort({ appliedDate: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/recruitment/applicants', protect, async (req, res) => {
  try { res.status(201).json(await Applicant.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/recruitment/applicants/:id', protect, async (req, res) => {
  try { res.json(await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/hr/recruitment/applicants/:id/hire - convert to staff (+login)
r.post('/recruitment/applicants/:id/hire', protect, async (req, res) => {
  try {
    const ap = await Applicant.findById(req.params.id).populate('jobId');
    if (!ap || !ap.jobId) return res.status(404).json({ message: 'Applicant/job not found' });
    const job = ap.jobId;
    const title = ((job.designation || '') + ' ' + (job.title || '')).toLowerCase();
    let userRole = null, roleCategory = 'support', level = 6, basicPay = 20000, reportingTo = 'Duty Manager';
    if (title.includes('nurse')) { userRole = 'Nurse'; roleCategory = 'nurse'; basicPay = 22000; reportingTo = 'Nursing Superintendent'; }
    else if (title.includes('doctor') || title.includes('medical officer')) { userRole = 'Doctor'; roleCategory = 'doctor'; basicPay = 150000; reportingTo = 'HOD / Medical Superintendent'; }
    else if (title.includes('receptionist')) { userRole = 'Receptionist'; roleCategory = 'receptionist'; basicPay = 15000; }
    else if (title.includes('guard') || title.includes('security')) { roleCategory = 'security'; basicPay = 12000; reportingTo = 'Security In-charge'; }
    else if (title.includes('manager')) { userRole = 'Admin'; roleCategory = 'management'; level = 4; basicPay = 50000; reportingTo = 'General Manager'; }
    else if (title.includes('pharmacist')) { basicPay = 25000; }
    else if (title.includes('technician')) { basicPay = 20000; }

    if (await StaffProfile.findOne({ email: ap.email })) return res.status(400).json({ message: 'Staff profile already exists' });
    const n = await StaffProfile.countDocuments();
    const profile = await StaffProfile.create({
      name: ap.name, email: ap.email, employeeId: 'CC-' + String(n + 1).padStart(4, '0'),
      designation: job.designation, department: job.department,
      roleCategory, employmentType: job.employmentType, level, basicPay, reportingTo,
      functions: [job.description || 'As per role'],
      status: 'active', linkedUser: false, joinDate: new Date().toISOString().slice(0, 10)
    });

    if (userRole && !await User.findOne({ email: ap.email })) {
      const nf = nameFieldOf();
      const hashes = modelHashesPw();
      const pw = userRole === 'Admin' ? 'Admin@123' : 'Staff@123';
      const doc = { email: ap.email, role: userRole, password: hashes ? pw : await bcrypt.hash(pw, 10), uniqueId: 'H' + ap.name.replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() + '01011990' };
      doc[nf] = ap.name;
      try { await User.create(doc); profile.linkedUser = true; await profile.save(); } catch (e) { /* skip */ }
    }
    ap.stage = 'hired'; ap.decidedBy = req.body.decidedBy || ''; await ap.save();
    res.json({ profile, userRole: userRole || 'none (staff only)' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
