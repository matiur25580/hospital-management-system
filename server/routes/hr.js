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

const STAFF_ROLES = new Set(['Doctor', 'Nurse', 'Receptionist']);
const isStaff = user => Boolean(user && STAFF_ROLES.has(user.role) && user.email);
const actorEmail = user => String(user && user.email || '').trim().toLowerCase();

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
    if (req.user.role === 'Admin') {
      if (req.query.staffEmail) q.staffEmail = String(req.query.staffEmail).trim().toLowerCase();
    } else if (isStaff(req.user)) q.staffEmail = actorEmail(req.user);
    else return res.status(403).json({ message: 'Access denied' });
    if (req.query.status) {
      if (!['pending', 'approved', 'rejected'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid leave status' });
      q.status = req.query.status;
    }
    res.json(await LeaveRequest.find(q).sort({ appliedDate: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/leave/apply', protect, async (req, res) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Staff access required' });
    const { leaveType, fromDate, toDate, reason } = req.body || {};
    if (!['sick', 'casual', 'earned', 'maternity', 'paternity'].includes(leaveType) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(fromDate || '') || !/^\\d{4}-\\d{2}-\\d{2}$/.test(toDate || '') || toDate < fromDate || !String(reason || '').trim()) return res.status(400).json({ message: 'Valid leave details are required' });
    const staff = await User.findById(req.user.id).select('name email role');
    if (!staff) return res.status(401).json({ message: 'Account unavailable' });
    const days = Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;
    const doc = await LeaveRequest.create({ staffEmail: actorEmail(req.user), staffName: staff.name || '', designation: staff.role, leaveType, fromDate, toDate, days, reason: String(reason).trim().slice(0, 2000), status: 'pending' });
    res.status(201).json(doc);
  }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/leave/:id/decide', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    if (!['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid leave decision' });
    const doc = await LeaveRequest.findOneAndUpdate({ _id: req.params.id, status: 'pending' },
      { $set: { status: req.body.status, remarks: String(req.body.remarks || '').slice(0, 2000), decidedBy: actorEmail(req.user), decidedDate: new Date() } },
      { new: true });
    if (!doc) return res.status(409).json({ message: 'Leave request not found or already decided' });
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ---------------- Appraisal ----------------
r.get('/appraisal', protect, async (req, res) => {
  try {
    const q = {};
    if (req.user.role === 'Admin') {
      if (req.query.staffEmail) q.staffEmail = String(req.query.staffEmail).trim().toLowerCase();
    } else if (isStaff(req.user)) q.staffEmail = actorEmail(req.user);
    else return res.status(403).json({ message: 'Access denied' });
    if (req.query.period) q.reviewPeriod = req.query.period;
    res.json(await Appraisal.find(q).sort({ reviewPeriod: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST upsert by staffEmail + reviewPeriod
r.post('/appraisal', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const { staffEmail, reviewPeriod, ratings, strengths, improvements, goals, status } = req.body || {};
    const normalizedStaffEmail = String(staffEmail || '').trim().toLowerCase();
    if (!normalizedStaffEmail || !/^\\d{4}-(H1|H2)$/.test(reviewPeriod || '') || !['draft', 'submitted'].includes(status)) return res.status(400).json({ message: 'Valid appraisal details are required' });
    const keys = ['punctuality', 'patientCare', 'teamwork', 'skills', 'discipline'];
    const vals = keys.map(key => Number(ratings && ratings[key]));
    if (vals.some(value => !Number.isInteger(value) || value < 1 || value > 5)) return res.status(400).json({ message: 'Ratings must be integers from 1 to 5' });
    const staff = await StaffProfile.findOne({ email: normalizedStaffEmail }).select('name email designation department');
    if (!staff) return res.status(404).json({ message: 'Staff profile not found' });
    const overall = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10;
    const doc = await Appraisal.findOneAndUpdate(
      { staffEmail: normalizedStaffEmail, reviewPeriod },
      { $set: { staffEmail: normalizedStaffEmail, staffName: staff.name, designation: staff.designation, department: staff.department, reviewPeriod, ratings: Object.fromEntries(keys.map((key, i) => [key, vals[i]])), strengths: String(strengths || '').slice(0, 3000), improvements: String(improvements || '').slice(0, 3000), goals: String(goals || '').slice(0, 3000), reviewedBy: actorEmail(req.user), status, overallScore: overall, reviewDate: new Date() } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/appraisal/:id/acknowledge', protect, async (req, res) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Staff access required' });
    const doc = await Appraisal.findOneAndUpdate(
      { _id: req.params.id, staffEmail: actorEmail(req.user), status: 'submitted' },
      { $set: { status: 'acknowledged', employeeComments: String(req.body.employeeComments || '').slice(0, 2000) } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Submitted appraisal not found for this account' });
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ---------------- Recruitment ----------------
r.get('/recruitment/jobs', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const q = req.query.status ? { status: req.query.status } : {};
    res.json(await JobPosting.find(q).sort({ postedDate: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/recruitment/jobs', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' }); res.status(201).json(await JobPosting.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/recruitment/jobs/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' }); res.json(await JobPosting.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.get('/recruitment/applicants', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const q = {};
    if (req.query.jobId) q.jobId = req.query.jobId;
    if (req.query.stage) q.stage = req.query.stage;
    res.json(await Applicant.find(q).populate('jobId', 'title designation').sort({ appliedDate: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/recruitment/applicants', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' }); res.status(201).json(await Applicant.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/recruitment/applicants/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' }); res.json(await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/hr/recruitment/applicants/:id/hire - convert to staff (+login)
r.post('/recruitment/applicants/:id/hire', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const ap = await Applicant.findById(req.params.id).populate('jobId');
    if (!ap || !ap.jobId) return res.status(404).json({ message: 'Applicant/job not found' });
    const job = ap.jobId;
    const title = ((job.designation || '') + ' ' + (job.title || '')).toLowerCase();
    let userRole = null, roleCategory = 'support', level = 6, basicPay = 20000, reportingTo = 'Duty Manager';
    if (title.includes('nurse')) { userRole = 'Nurse'; roleCategory = 'nurse'; basicPay = 22000; reportingTo = 'Nursing Superintendent'; }
    else if (title.includes('doctor') || title.includes('medical officer')) { userRole = 'Doctor'; roleCategory = 'doctor'; basicPay = 150000; reportingTo = 'HOD / Medical Superintendent'; }
    else if (title.includes('receptionist')) { userRole = 'Receptionist'; roleCategory = 'receptionist'; basicPay = 15000; }
    else if (title.includes('guard') || title.includes('security')) { roleCategory = 'security'; basicPay = 12000; reportingTo = 'Security In-charge'; }
    else if (title.includes('manager')) { roleCategory = 'management'; level = 4; basicPay = 50000; reportingTo = 'General Manager'; }
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
    ap.stage = 'hired'; ap.decidedBy = actorEmail(req.user); await ap.save();
    res.json({ profile, userRole: userRole || 'none (staff only)' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
