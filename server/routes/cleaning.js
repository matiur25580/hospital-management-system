/**
 * @swagger
 * tags:
 *   - name: Cleaning
 *     description: Cleaning module
 */
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const CleaningLog = require('../models/CleaningLog');
const STAFF_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
const actorEmail = user => String(user && user.email || '').trim().toLowerCase();
const validDate = value => /^\\d{4}-\\d{2}-\\d{2}$/.test(value || '') && !Number.isNaN(new Date(value + 'T00:00:00').getTime());
const ALL = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MASTER = [
  { zone: 'all', task: 'sweeping', days: ALL, shift: 'morning', time: '6:00-8:00 AM', assignedTo: 'Cleaning Team A' },
  { zone: 'all', task: 'mopping', days: ALL, shift: 'morning', time: '8:00-10:00 AM', assignedTo: 'Cleaning Team A' },
  { zone: 'bathroom', task: 'bathroom', days: ALL, shift: 'morning', time: '6:00-7:30 AM', assignedTo: 'Cleaning Team B' },
  { zone: 'bathroom', task: 'bathroom', days: ALL, shift: 'evening', time: '4:00-5:30 PM', assignedTo: 'Cleaning Team B' },
  { zone: 'ot', task: 'disinfection', days: ALL, shift: 'evening', time: '7:00-8:30 PM', assignedTo: 'OT Support Staff' },
  { zone: 'lab', task: 'disinfection', days: ALL, shift: 'evening', time: '6:00-7:00 PM', assignedTo: 'Lab Attendant' },
  { zone: 'emergency', task: 'disinfection', days: ALL, shift: 'night', time: '10:00-11:00 PM', assignedTo: 'Night Cleaning Team' },
  { zone: 'all', task: 'waste', days: ALL, shift: 'evening', time: '5:00-6:30 PM', assignedTo: 'Waste Mgmt Team' },
  { zone: 'opd', task: 'deep', days: ['Mon'], shift: 'morning', time: '6:00-9:00 AM', assignedTo: 'Deep Clean Team' },
  { zone: 'ipd', task: 'deep', days: ['Wed'], shift: 'morning', time: '6:00-9:00 AM', assignedTo: 'Deep Clean Team' },
  { zone: 'pharmacy', task: 'deep', days: ['Sat'], shift: 'morning', time: '6:00-9:00 AM', assignedTo: 'Deep Clean Team' },
  { zone: 'all', task: 'audit', days: ['Sun'], shift: 'morning', time: '10:00 AM', assignedTo: 'Housekeeping Supervisor' },
];
r.get('/schedule', protect, (req, res) => STAFF_ROLES.has(req.user && req.user.role) ? res.json(MASTER) : res.status(403).json({ message: 'Staff access required' }));
r.get('/logs', protect, async (req, res) => {
  try {
    if (!STAFF_ROLES.has(req.user && req.user.role)) return res.status(403).json({ message: 'Staff access required' });
    const q = {};
    if (req.query.from) { if (!validDate(req.query.from)) return res.status(400).json({ message: 'Invalid from date' }); q.date = { $gte: req.query.from }; }
    if (req.query.to) { if (!validDate(req.query.to) || (req.query.from && req.query.to < req.query.from)) return res.status(400).json({ message: 'Invalid to date' }); q.date = { ...q.date, $lte: req.query.to }; }
    res.json(await CleaningLog.find(q).sort({ date: -1 }).limit(500));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
r.post('/log', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const { date, zone, task, shift, notes } = req.body || {};
    if (!validDate(date) || !['morning', 'evening', 'night'].includes(shift)) return res.status(400).json({ message: 'Valid date and shift are required' });
    const weekday = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    const scheduled = MASTER.find(item => item.zone === zone && item.task === task && item.shift === shift && item.days.includes(weekday));
    if (!scheduled) return res.status(400).json({ message: 'Task is not scheduled for this zone, date and shift' });
    const log = await CleaningLog.findOneAndUpdate(
      { date, zone, task, shift },
      { $set: { date, zone, task, shift, assignedTo: scheduled.assignedTo, doneBy: actorEmail(req.user), notes: String(notes || '').slice(0, 2000), status: 'done' } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = r;
