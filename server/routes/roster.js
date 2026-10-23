const r = require('express').Router();
const { protect } = require('../middleware/auth');
const DutyRoster = require('../models/DutyRoster');
const Department = require('../models/Department');
const User = require('../models/User');

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const dayName = (ds) => new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });

// POST /api/roster/generate { date: YYYY-MM-DD } - auto-build full day roster
r.post('/generate', protect, async (req, res) => {
  try {
    const date = req.body.date;
    if (!date) return res.status(400).json({ message: 'date required' });
    await DutyRoster.deleteMany({ date });
    const entries = [];
    const weekday = dayName(date);
    const dayOfYear = Math.floor((new Date(date + 'T00:00:00') - new Date(date.slice(0, 4) + '-01-01T00:00:00')) / 86400000);

    const depts = await Department.find();
    const emgShifts = [
      { shift: 'morning', startTime: '07:00', endTime: '15:00', hours: 8 },
      { shift: 'evening', startTime: '15:00', endTime: '23:00', hours: 8 },
      { shift: 'night', startTime: '23:00', endTime: '07:00', hours: 8 }
    ];
    for (const d of depts) {
      if (d.code === 'EMG') {
        d.doctors.forEach((doc, i) => {
          const s = emgShifts[(dayOfYear + i) % 3];
          entries.push({ date, staffEmail: doc.email, staffName: doc.name, role: 'Doctor', department: d.name, ...s });
        });
      } else if ((d.opdDays || []).includes(weekday)) {
        d.doctors.forEach(doc => {
          entries.push({ date, staffEmail: doc.email, staffName: doc.name, role: 'Doctor', department: d.name, shift: 'morning', startTime: '09:00', endTime: '13:00', hours: 4 });
          entries.push({ date, staffEmail: doc.email, staffName: doc.name, role: 'Doctor', department: d.name, shift: 'evening', startTime: '17:00', endTime: '20:00', hours: 3 });
        });
      }
    }

    const nShifts = [
      { shift: 'morning', startTime: '07:00', endTime: '14:00', hours: 7 },
      { shift: 'evening', startTime: '14:00', endTime: '21:00', hours: 7 },
      { shift: 'night', startTime: '21:00', endTime: '07:00', hours: 10 }
    ];
    const nurses = await User.find({ role: 'Nurse' }).sort({ email: 1 });
    nurses.forEach((n, i) => {
      const s = nShifts[(i + dayOfYear) % 3];
      entries.push({ date, staffEmail: n.email, staffName: n.name || n.fullName || n.email, role: 'Nurse', department: 'Ward / Floor', ...s });
    });

    const recps = await User.find({ role: 'Receptionist' }).sort({ email: 1 });
    recps.forEach((rcp, i) => {
      const s = nShifts[Math.floor(i / 2) % 3];
      entries.push({ date, staffEmail: rcp.email, staffName: rcp.name || rcp.fullName || rcp.email, role: 'Receptionist', department: 'Front Desk', ...s });
    });

    if (entries.length) await DutyRoster.insertMany(entries);
    res.json({ date, count: entries.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/roster?date=YYYY-MM-DD
r.get('/', protect, async (req, res) => {
  try { res.json(await DutyRoster.find({ date: req.query.date }).sort({ shift: 1, role: 1, staffName: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
