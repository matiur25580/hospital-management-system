const r = require('express').Router();
const { protect } = require('../middleware/auth');
const DoctorSchedule = require('../models/DoctorSchedule');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const blankWeekly = () => DAYS.map(d => ({ day: d, start: '09:00', end: '17:00', active: d !== 'Sunday' }));

// GET /api/schedules (?doctorEmail=)
r.get('/', protect, async (req, res) => {
  try {
    if (req.query.doctorEmail) {
      const s = await DoctorSchedule.findOne({ doctorEmail: req.query.doctorEmail });
      return res.json(s || { doctorEmail: req.query.doctorEmail, weekly: blankWeekly(), leaves: [] });
    }
    res.json(await DoctorSchedule.find().sort({ doctorName: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/schedules/check?doctorEmail=&date=YYYY-MM-DD -> is doctor available?
r.get('/check', protect, async (req, res) => {
  try {
    const { doctorEmail, date } = req.query;
    const s = await DoctorSchedule.findOne({ doctorEmail });
    if (!s) return res.json({ available: true, reason: 'No schedule set' });
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const slot = (s.weekly || []).find(w => w.day === dayName && w.active);
    const isLeave = (s.leaves || []).some(l => new Date(l).toDateString() === d.toDateString());
    if (isLeave) return res.json({ available: false, reason: 'Doctor on leave' });
    if (!slot) return res.json({ available: false, reason: 'No OPD on ' + dayName });
    res.json({ available: true, slot });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/schedules (upsert weekly schedule)
r.post('/', protect, async (req, res) => {
  try {
    const { doctorEmail, doctorName, weekly } = req.body;
    if (!doctorEmail) return res.status(400).json({ message: 'doctorEmail required' });
    const s = await DoctorSchedule.findOneAndUpdate(
      { doctorEmail },
      { $set: { doctorName, weekly, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/schedules/leave { doctorEmail, date }
r.post('/leave', protect, async (req, res) => {
  try {
    const { doctorEmail, date } = req.body;
    const s = await DoctorSchedule.findOneAndUpdate(
      { doctorEmail },
      { $push: { leaves: new Date(date) } },
      { upsert: true, new: true }
    );
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// DELETE /api/schedules/leave { doctorEmail, date }
r.delete('/leave', protect, async (req, res) => {
  try {
    const { doctorEmail, date } = req.body;
    const target = new Date(date);
    const s = await DoctorSchedule.findOne({ doctorEmail });
    if (s) {
      s.leaves = s.leaves.filter(l => new Date(l).toDateString() !== target.toDateString());
      await s.save();
    }
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
