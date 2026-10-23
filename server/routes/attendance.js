const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

// POST /api/attendance/checkin { staffEmail, staffName, role }
r.post('/checkin', protect, async (req, res) => {
  try {
    const { staffEmail, staffName, role } = req.body;
    let rec = await Attendance.findOne({ staffEmail, date: todayStr() });
    if (!rec) rec = await Attendance.create({ staffEmail, staffName, role, date: todayStr(), checkIn: new Date(), status: 'present' });
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/attendance/checkout { staffEmail }
r.post('/checkout', protect, async (req, res) => {
  try {
    const rec = await Attendance.findOne({ staffEmail: req.body.staffEmail, date: todayStr() });
    if (!rec) return res.status(404).json({ message: 'Not checked in today' });
    rec.checkOut = new Date();
    await rec.save();
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/attendance/summary?month=YYYY-MM -> per-staff monthly aggregates
r.get('/summary', protect, async (req, res) => {
  try {
    const month = req.query.month || todayStr().slice(0, 7);
    const agg = await Attendance.aggregate([
      { $match: { date: { $regex: '^' + month } } },
      { $group: { _id: '$staffEmail', name: { $first: '$staffName' }, role: { $first: '$role' },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        days: { $sum: 1 } } },
      { $sort: { name: 1 } }
    ]);
    res.json(agg);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/attendance (?staffEmail=, ?date=YYYY-MM-DD, ?month=YYYY-MM)
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.staffEmail) q.staffEmail = req.query.staffEmail;
    if (req.query.date) q.date = req.query.date;
    if (req.query.month) q.date = { $regex: '^' + req.query.month };
    res.json(await Attendance.find(q).sort({ date: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/attendance/leaves -> apply for leave
r.post('/leaves', protect, async (req, res) => {
  try { res.status(201).json(await LeaveRequest.create({ ...req.body, status: 'pending' })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/attendance/leaves (?staffEmail=, ?status=)
r.get('/leaves', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.staffEmail) q.staffEmail = req.query.staffEmail;
    if (req.query.status) q.status = req.query.status;
    res.json(await LeaveRequest.find(q).sort({ appliedAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/attendance/leaves/:id -> approve/reject (approved dates auto-marked as leave)
r.patch('/leaves/:id', protect, async (req, res) => {
  try {
    const l = await LeaveRequest.findByIdAndUpdate(
      req.params.id, { status: req.body.status, decidedBy: req.body.decidedBy }, { new: true });
    if (l && req.body.status === 'approved') {
      const from = new Date(l.fromDate), to = new Date(l.toDate);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        await Attendance.findOneAndUpdate(
          { staffEmail: l.staffEmail, date: ds },
          { $setOnInsert: { staffName: l.staffName, role: l.role, status: 'leave' } },
          { upsert: true }
        );
      }
    }
    res.json(l);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
