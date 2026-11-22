const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const { isStaff, canManageAttendance, attendanceScope, normalizedEmail, userEmail } = require('../utils/clinicalWorkflowAccess');

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const validMonth = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');

r.post('/checkin', protect, async (req, res) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Staff access required' });
    const email = userEmail(req.user);
    const rec = await Attendance.findOneAndUpdate(
      { staffEmail: email, date: todayStr() },
      { $setOnInsert: { staffEmail: email, staffName: req.user.name || '', role: req.user.role, date: todayStr(), checkIn: new Date(), status: 'present' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (rec.checkIn && rec.checkOut) return res.status(409).json({ message: 'Attendance already completed for today' });
    res.json(rec);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Attendance already exists for today' });
    res.status(400).json({ message: e.message });
  }
});

r.post('/checkout', protect, async (req, res) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Staff access required' });
    const rec = await Attendance.findOneAndUpdate(
      { staffEmail: userEmail(req.user), date: todayStr(), checkOut: null },
      { $set: { checkOut: new Date() } },
      { new: true }
    );
    if (!rec) return res.status(409).json({ message: 'No open check-in found for today' });
    res.json(rec);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.get('/summary', protect, async (req, res) => {
  try {
    if (!canManageAttendance(req.user)) return res.status(403).json({ message: 'Admin access required' });
    const month = req.query.month || todayStr().slice(0, 7);
    if (!validMonth(month)) return res.status(400).json({ message: 'Invalid month' });
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

r.get('/', protect, async (req, res) => {
  try {
    const scope = attendanceScope(req.user, req.query.staffEmail);
    if (!scope) return res.status(403).json({ message: 'Access denied' });
    const q = { ...scope };
    if (req.query.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
      q.date = req.query.date;
    }
    if (req.query.month) {
      if (!validMonth(req.query.month)) return res.status(400).json({ message: 'Invalid month' });
      q.date = { $regex: '^' + req.query.month };
    }
    res.json(await Attendance.find(q).sort({ date: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/leaves', protect, async (req, res) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Staff access required' });
    const { fromDate, toDate, reason, leaveType } = req.body || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(toDate || '') || toDate < fromDate) {
      return res.status(400).json({ message: 'Valid leave dates are required' });
    }
    const doc = await LeaveRequest.create({
      staffEmail: userEmail(req.user), staffName: req.user.name || '', designation: '', department: '',
      fromDate, toDate, reason: String(reason || '').slice(0, 2000), leaveType, status: 'pending'
    });
    res.status(201).json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.get('/leaves', protect, async (req, res) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Staff access required' });
    const q = {};
    const scope = attendanceScope(req.user, req.query.staffEmail);
    if (!scope) return res.status(403).json({ message: 'Access denied' });
    if (scope.staffEmail) q.staffEmail = scope.staffEmail;
    if (req.query.status) {
      if (!['pending', 'approved', 'rejected'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid status' });
      q.status = req.query.status;
    }
    res.json(await LeaveRequest.find(q).sort({ appliedDate: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.patch('/leaves/:id', protect, async (req, res) => {
  try {
    if (!canManageAttendance(req.user)) return res.status(403).json({ message: 'Admin access required' });
    const { status } = req.body || {};
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid leave decision' });
    const l = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status, decidedBy: userEmail(req.user), decidedDate: new Date() } },
      { new: true }
    );
    if (!l) return res.status(409).json({ message: 'Leave request not found or already decided' });
    if (status === 'approved') {
      const from = new Date(l.fromDate), to = new Date(l.toDate);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        await Attendance.findOneAndUpdate(
          { staffEmail: normalizedEmail(l.staffEmail), date: ds },
          { $setOnInsert: { staffEmail: normalizedEmail(l.staffEmail), staffName: l.staffName, role: 'Staff', date: ds, status: 'leave' } },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }
    res.json(l);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
