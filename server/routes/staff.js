const r = require('express').Router();
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const StaffProfile = require('../models/StaffProfile');
const Salary = require('../models/Salary');
const User = require('../models/User');
const Department = require('../models/Department');

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
async function nextEmpId() {
  const n = await StaffProfile.countDocuments();
  return 'CC-' + String(n + 1).padStart(4, '0');
}

// ---------------- Management team (12) ----------------
const MANAGEMENT = [
  { name: 'Mr. Rajesh Agarwal', email: 'chairman@citycare.hospital', designation: 'Chairman (Owner)', department: 'Trust Board', level: 1, employmentType: 'private', basicPay: 0, reportingTo: 'Trust Board',
    functions: ['Trust ownership & policy decisions', 'Major investments & expansion', 'Annual budget approval', 'Appoints Managing Director'] },
  { name: 'Mrs. Sunita Agarwal', email: 'md@citycare.hospital', designation: 'Managing Director', department: 'Top Management', level: 2, employmentType: 'private', basicPay: 200000, reportingTo: 'Chairman',
    functions: ['Overall hospital control', 'Budget & finance approval', 'Senior appointments', 'Government liaison & PPP compliance'] },
  { name: 'Dr. Bikash Banerjee', email: 'ms@citycare.hospital', designation: 'Medical Superintendent (Hospital Head)', department: 'Administration', level: 3, employmentType: 'government', basicPay: 95000, reportingTo: 'Managing Director',
    functions: ['All medical operations control', 'Doctor discipline & duty allocation', 'Clinical protocols & quality', 'Medico-legal cases approval'] },
  { name: 'Mr. Anupam Ghosh', email: 'gm@citycare.hospital', designation: 'General Manager', department: 'Administration', level: 3, employmentType: 'private', basicPay: 85000, reportingTo: 'Managing Director',
    functions: ['Non-medical operations', 'Vendor & AMC contracts', 'Infrastructure & expansion', 'Coordinates all managers'] },
  { name: 'Ms. Priyanka Das', email: 'hr.manager@citycare.hospital', designation: 'HR Manager', department: 'HR', level: 4, employmentType: 'private', basicPay: 55000, reportingTo: 'General Manager',
    functions: ['Recruitment & onboarding', 'Attendance & leave management', 'Salary processing', 'Staff welfare & grievances'] },
  { name: 'Mr. Debashis Roy', email: 'finance.manager@citycare.hospital', designation: 'Finance Manager', department: 'Finance', level: 4, employmentType: 'private', basicPay: 60000, reportingTo: 'General Manager',
    functions: ['Billing oversight', 'Accounts & audit', 'Govt insurance (Swasthya Sathi) claims', 'Salary fund release'] },
  { name: 'Mr. Sourav Pal', email: 'ops.manager@citycare.hospital', designation: 'Operations Manager', department: 'Operations', level: 4, employmentType: 'private', basicPay: 50000, reportingTo: 'General Manager',
    functions: ['Housekeeping & maintenance', 'Ambulance fleet management', 'Inventory & purchase', 'Security coordination'] },
  { name: 'Mrs. Gita Sen', email: 'nursing.supdt@citycare.hospital', designation: 'Nursing Superintendent', department: 'Nursing', level: 4, employmentType: 'government', basicPay: 65000, reportingTo: 'Medical Superintendent',
    functions: ['All nurses roster (3 shifts)', 'Nursing quality & training', 'Ward discipline', 'Night supervision'] },
  { name: '【entity-Mr. Rahul Dutta¦canonical_name=Rahul Dutta】', email: 'dm.morning@citycare.hospital', designation: 'Duty Manager (Morning 07:00-14:00)', department: 'Floor Control', level: 5, employmentType: 'private', basicPay: 45000, reportingTo: 'General Manager',
    functions: ['Shift floor control', 'Emergency coordination', 'Patient complaints', 'Staff attendance of shift'] },
  { name: 'Mr. Koushik Mondal', email: 'dm.evening@citycare.hospital', designation: 'Duty Manager (Evening 14:00-21:00)', department: 'Floor Control', level: 5, employmentType: 'private', basicPay: 45000, reportingTo: 'General Manager',
    functions: ['Shift floor control', 'Emergency coordination', 'Patient complaints', 'Staff attendance of shift'] },
  { name: 'Mr. Tanmay Sarkar', email: 'dm.night@citycare.hospital', designation: 'Duty Manager (Night 21:00-07:00)', department: 'Floor Control', level: 5, employmentType: 'private', basicPay: 48000, reportingTo: 'General Manager',
    functions: ['Night floor control (10-hr duty)', 'Emergency coordination', 'Night staff supervision', 'Incident reporting'] },
  { name: 'Mr. Bablu Singh', email: 'security.incharge@citycare.hospital', designation: 'Security In-charge', department: 'Security', level: 5, employmentType: 'private', basicPay: 25000, reportingTo: 'Operations Manager',
    functions: ['Guard roster (10 guards, 3 shifts)', 'Gate & entry control', 'CCTV monitoring', 'Fire safety drills'] }
];

const ROLE_DEFAULTS = {
  Doctor: { roleCategory: 'doctor', employmentType: 'private', basicPay: 150000, level: 6, reportingTo: 'HOD / Medical Superintendent',
    functions: ['OPD consultation (9-1, 5-8)', 'Patient rounds', 'Surgeries & procedures', 'Case documentation'] },
  Nurse: { roleCategory: 'nurse', employmentType: 'private', basicPay: 22000, level: 6, reportingTo: 'Nursing Superintendent',
    functions: ['Patient care (7-hr / 10-hr shifts)', 'Medication administration', 'Ward management', 'Doctor assistance'] },
  Receptionist: { roleCategory: 'receptionist', employmentType: 'private', basicPay: 15000, level: 6, reportingTo: 'Duty Manager',
    functions: ['Front desk & registration', 'Appointment scheduling', 'Billing assistance', 'Patient guidance'] }
};

// POST /api/staff/seed-management - create 12 management logins + profiles
r.post('/seed-management', protect, async (req, res) => {
  try {
    const nf = nameFieldOf();
    const hashes = modelHashesPw();
    let created = 0;
    for (const m of MANAGEMENT) {
      if (await StaffProfile.findOne({ email: m.email })) continue;
      if (!await User.findOne({ email: m.email })) {
        const pw = hashes ? 'Admin@123' : await bcrypt.hash('Admin@123', 10);
        const doc = { email: m.email, role: 'Admin', password: pw, uniqueId: 'A' + m.name.replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() + '01011980' };
        doc[nf] = m.name;
        try { await User.create(doc); } catch (e) { /* skip */ }
      }
      const u = await User.findOne({ email: m.email });
      await StaffProfile.create({ ...m, employeeId: await nextEmpId(), roleCategory: 'management', status: 'active', linkedUser: !!u, joinDate: '2024-01-15' });
      created++;
    }
    res.json({ created });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/staff/sync-users - profiles for existing doctors/nurses/receptionists
r.post('/sync-users', protect, async (req, res) => {
  try {
    const nf = nameFieldOf();
    const depts = await Department.find();
    const docMap = {};
    depts.forEach(d => (d.doctors || []).forEach(doc => { docMap[doc.email] = { designation: doc.designation, department: d.name }; }));
    const users = await User.find({ role: { $in: ['Doctor', 'Nurse', 'Receptionist'] } });
    let created = 0;
    for (const u of users) {
      if (await StaffProfile.findOne({ email: u.email })) continue;
      const d = ROLE_DEFAULTS[u.role];
      if (!d) continue;
      const info = docMap[u.email] || {};
      await StaffProfile.create({
        name: u[nf] || u.email, email: u.email, employeeId: await nextEmpId(),
        designation: info.designation || u.role,
        department: info.department || (u.role === 'Receptionist' ? 'Front Desk' : u.role === 'Nurse' ? 'Nursing' : ''),
        roleCategory: d.roleCategory, employmentType: d.employmentType, level: d.level,
        basicPay: d.basicPay, reportingTo: d.reportingTo, functions: d.functions,
        status: 'active', linkedUser: true, joinDate: '2024-06-01'
      });
      created++;
    }
    res.json({ created });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/staff/hierarchy - grouped by org level
r.get('/hierarchy', protect, async (req, res) => {
  try {
    const all = await StaffProfile.find({ status: 'active' }).sort({ level: 1, designation: 1 });
    const levels = {};
    all.forEach(p => { (levels[p.level] = levels[p.level] || []).push(p); });
    res.json(levels);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/staff/profiles
r.get('/profiles', protect, async (req, res) => {
  try {
    const q = { status: 'active' };
    if (req.query.roleCategory) q.roleCategory = req.query.roleCategory;
    if (req.query.employmentType) q.employmentType = req.query.employmentType;
    res.json(await StaffProfile.find(q).sort({ level: 1, name: 1 }).limit(500));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/profiles', protect, async (req, res) => {
  try {
    if (!req.body.employeeId) req.body.employeeId = await nextEmpId();
    res.status(201).json(await StaffProfile.create(req.body));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/profiles/:id', protect, async (req, res) => {
  try { res.json(await StaffProfile.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// ---------------- Salary ----------------
function computeSalary(p) {
  const basic = Number(p.basicPay) || 0;
  const round = (n) => Math.round(n);
  const medical = 1500, transport = 2000;
  let da, hra;
  if (p.employmentType === 'government') { da = round(basic * 0.42); hra = round(basic * 0.18); }
  else { da = round(basic * 0.10); hra = round(basic * 0.20); }
  const gross = basic + hra + da + medical + transport;
  const pf = round(basic * 0.12);
  const esi = gross <= 21000 ? round(gross * 0.0075) : 0;
  const tax = gross > 50000 ? round((gross - 50000) * 0.05) : 0;
  const totalDeductions = pf + esi + tax;
  return { basicPay: basic, hra, da, medical, transport, grossPay: gross, pf, esi, tax, totalDeductions, netPay: gross - totalDeductions };
}

// POST /api/staff/salary/generate { month: YYYY-MM }
r.post('/salary/generate', protect, async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ message: 'month required (YYYY-MM)' });
    const profiles = await StaffProfile.find({ status: 'active', basicPay: { $gt: 0 } });
    let count = 0;
    for (const p of profiles) {
      const c = computeSalary(p);
      await Salary.findOneAndUpdate(
        { staffEmail: p.email, month },
        { staffEmail: p.email, staffName: p.name, employeeId: p.employeeId, designation: p.designation, department: p.department, employmentType: p.employmentType, month, ...c, status: 'pending' },
        { upsert: true, new: true }
      );
      count++;
    }
    res.json({ month, count });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/staff/salary (?month=)
r.get('/salary', protect, async (req, res) => {
  try {
    const q = req.query.month ? { month: req.query.month } : {};
    res.json(await Salary.find(q).sort({ staffName: 1 }).limit(500));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/staff/salary/:id/pay
r.patch('/salary/:id/pay', protect, async (req, res) => {
  try { res.json(await Salary.findByIdAndUpdate(req.params.id, { status: 'paid', paidDate: new Date() }, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
