/**
 * @swagger
 * tags:
 *   - name: Cleaning
 *     description: Cleaning module
 */
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const CleaningLog = require('../models/CleaningLog');
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
r.get('/schedule', protect, (req, res) => res.json(MASTER));
r.get('/logs', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.from) q.date = { $gte: req.query.from };
    if (req.query.to) q.date = { ...q.date, $lte: req.query.to };
    res.json(await CleaningLog.find(q).sort({ date: -1 }).limit(500));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
r.post('/log', protect, async (req, res) => {
  try {
    const { date, zone, task, shift, assignedTo, doneBy, notes } = req.body;
    const log = await CleaningLog.findOneAndUpdate(
      { date, zone, task, shift },
      { date, zone, task, shift, assignedTo, doneBy: doneBy || ((req.user && req.user.email) || 'staff'), notes, status: 'done' },
      { upsert: true, new: true }
    );
    res.json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = r;
