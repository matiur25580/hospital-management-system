const r = require('express').Router();
const { protect } = require('../middleware/auth');
const DoctorSchedule = require('../models/DoctorSchedule');
const User = require('../models/User');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const blankWeekly = () => DAYS.map(d => ({ day: d, start: '09:00', end: '17:00', active: d !== 'Sunday' }));
const emailOf = user => String(user && user.email || '').trim().toLowerCase();
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(value + 'T00:00:00').getTime());
const validTime = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || '');
const canManageDoctor = (user, email) => Boolean(user && (user.role === 'Admin' || (user.role === 'Doctor' && emailOf(user) === email)));

r.get('/check', protect, async (req, res) => {
  try {
    const doctorEmail = String(req.query.doctorEmail || '').trim().toLowerCase();
    const date = req.query.date;
    if (!doctorEmail || !validDate(date)) return res.status(400).json({ message: 'Valid doctor email and date are required' });
    const s = await DoctorSchedule.findOne({ doctorEmail });
    if (!s) return res.json({ available: true, reason: 'No schedule set' });
    const d = new Date(date + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const slot = (s.weekly || []).find(w => w.day === dayName && w.active);
    const isLeave = (s.leaves || []).some(l => new Date(l).toDateString() === d.toDateString());
    if (isLeave) return res.json({ available: false, reason: 'Doctor on leave' });
    if (!slot) return res.json({ available: false, reason: 'No OPD on ' + dayName });
    res.json({ available: true, slot });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.get('/', protect, async (req, res) => {
  try {
    if (req.query.doctorEmail) {
      const doctorEmail = String(req.query.doctorEmail).trim().toLowerCase();
      if (!canManageDoctor(req.user, doctorEmail)) return res.status(403).json({ message: 'Only the doctor or an administrator can view this schedule' });
      const s = await DoctorSchedule.findOne({ doctorEmail });
      return res.json(s || { doctorEmail, weekly: blankWeekly(), leaves: [] });
    }
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    res.json(await DoctorSchedule.find().sort({ doctorName: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try {
    const doctorEmail = String(req.body && req.body.doctorEmail || '').trim().toLowerCase();
    if (!doctorEmail || !canManageDoctor(req.user, doctorEmail)) return res.status(403).json({ message: 'Only the doctor or an administrator can update this schedule' });
    const doctor = await User.findOne({ email: doctorEmail, role: 'Doctor' }).select('name email');
    if (!doctor) return res.status(404).json({ message: 'Doctor account not found' });
    const weekly = req.body.weekly;
    if (!Array.isArray(weekly) || weekly.length !== DAYS.length) return res.status(400).json({ message: 'A complete weekly schedule is required' });
    const normalizedWeekly = [];
    for (const day of DAYS) {
      const slot = weekly.find(item => item && item.day === day);
      if (!slot || typeof slot.active !== 'boolean' || !validTime(slot.start) || !validTime(slot.end) || (slot.active && slot.start >= slot.end)) {
        return res.status(400).json({ message: 'Invalid schedule for ' + day });
      }
      normalizedWeekly.push({ day, start: slot.start, end: slot.end, active: slot.active });
    }
    const s = await DoctorSchedule.findOneAndUpdate(
      { doctorEmail },
      { $set: { doctorEmail, doctorName: doctor.name || doctorEmail, weekly: normalizedWeekly, updatedAt: new Date() } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.post('/leave', protect, async (req, res) => {
  try {
    const doctorEmail = String(req.body && req.body.doctorEmail || '').trim().toLowerCase();
    const date = req.body && req.body.date;
    if (!doctorEmail || !validDate(date) || !canManageDoctor(req.user, doctorEmail)) return res.status(403).json({ message: 'Only the doctor or an administrator can manage this leave' });
    const doctor = await User.findOne({ email: doctorEmail, role: 'Doctor' }).select('name email');
    if (!doctor) return res.status(404).json({ message: 'Doctor account not found' });
    const s = await DoctorSchedule.findOneAndUpdate(
      { doctorEmail },
      { $setOnInsert: { doctorEmail, doctorName: doctor.name || doctorEmail, weekly: blankWeekly() }, $addToSet: { leaves: new Date(date + 'T00:00:00') } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.delete('/leave', protect, async (req, res) => {
  try {
    const doctorEmail = String(req.body && req.body.doctorEmail || '').trim().toLowerCase();
    const date = req.body && req.body.date;
    if (!doctorEmail || !validDate(date) || !canManageDoctor(req.user, doctorEmail)) return res.status(403).json({ message: 'Only the doctor or an administrator can manage this leave' });
    const s = await DoctorSchedule.findOneAndUpdate(
      { doctorEmail },
      { $pull: { leaves: new Date(date + 'T00:00:00') } },
      { new: true }
    );
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
