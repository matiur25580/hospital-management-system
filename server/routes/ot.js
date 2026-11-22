const r = require('express').Router();
const { protect } = require('../middleware/auth');
const OTRoom = require('../models/OTRoom');
const OTSurgery = require('../models/OTSurgery');
const User = require('../models/User');
const { canManageOT } = require('../utils/hrOtAccess');

const DEFAULT_OTS = [
  { otNo: 'OT-1', floor: '3rd Floor, OT Complex', type: 'General Surgery' },
  { otNo: 'OT-2', floor: '3rd Floor, OT Complex', type: 'Orthopedic / Cardiac' },
  { otNo: 'OT-3', floor: '3rd Floor, OT Complex', type: 'Gynecology' },
  { otNo: 'OT-4', floor: 'Ground Floor, Emergency', type: 'Emergency (24x7)' }
];
const adminOnly = (req, res) => canManageOT(req.user) ? true : (res.status(403).json({ message: 'Admin access required' }), false);
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(value).getTime());
const validTime = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || '');

r.get('/rooms', protect, async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    let rooms = await OTRoom.find().sort({ otNo: 1 });
    if (!rooms.length) rooms = await OTRoom.insertMany(DEFAULT_OTS);
    res.json(rooms);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/rooms', protect, async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const { otNo, floor, type } = req.body || {};
    if (!String(otNo || '').trim() || !String(floor || '').trim() || !String(type || '').trim()) return res.status(400).json({ message: 'OT number, floor and type are required' });
    res.status(201).json(await OTRoom.create({ otNo: String(otNo).trim().slice(0, 40), floor: String(floor).trim().slice(0, 120), type: String(type).trim().slice(0, 120), status: 'available' }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/rooms/:id', protect, async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const { status, floor, type } = req.body || {};
    const update = {};
    if (status !== undefined) {
      if (!['available', 'occupied', 'maintenance'].includes(status)) return res.status(400).json({ message: 'Invalid OT room status' });
      update.status = status;
    }
    if (floor !== undefined) update.floor = String(floor).trim().slice(0, 120);
    if (type !== undefined) update.type = String(type).trim().slice(0, 120);
    const room = await OTRoom.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ message: 'OT room not found' });
    res.json(room);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.get('/bookings', protect, async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const q = {};
    if (req.query.date) {
      if (!validDate(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
      q.date = req.query.date;
    }
    if (req.query.status) {
      if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid booking status' });
      q.status = req.query.status;
    }
    res.json(await OTSurgery.find(q).sort({ date: 1, startTime: 1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/bookings', protect, async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const body = req.body || {};
    const { patientName, patientEmail, surgeryType, department, surgeonEmail, anesthetistName, assistantDoctors, nurseNames, otNo, date, startTime, endTime, notes } = body;
    if (!String(patientName || '').trim() || !String(surgeryType || '').trim() || !String(otNo || '').trim() || !validDate(date) || !validTime(startTime) || !validTime(endTime) || startTime >= endTime || !String(surgeonEmail || '').trim()) {
      return res.status(400).json({ message: 'Valid patient, surgery, OT, surgeon and time details are required' });
    }
    const room = await OTRoom.findOne({ otNo: String(otNo).trim() });
    if (!room || room.status === 'maintenance') return res.status(409).json({ message: 'OT room is unavailable' });
    const surgeon = await User.findOne({ email: String(surgeonEmail).trim().toLowerCase(), role: 'Doctor' }).select('name email');
    if (!surgeon) return res.status(404).json({ message: 'Surgeon account not found' });
    const clash = await OTSurgery.findOne({
      otNo: room.otNo, date, status: { $in: ['scheduled', 'in-progress'] },
      startTime: { $lt: endTime }, endTime: { $gt: startTime }
    });
    if (clash) return res.status(409).json({ message: 'OT clash with ' + clash.patientName + ' (' + clash.startTime + '-' + clash.endTime + ')' });
    const booking = await OTSurgery.create({
      patientName: String(patientName).trim().slice(0, 160), patientEmail: String(patientEmail || '').trim().toLowerCase(),
      surgeryType: String(surgeryType).trim().slice(0, 200), department: String(department || '').trim().slice(0, 120),
      surgeonName: surgeon.name || '', surgeonEmail: surgeon.email, anesthetistName: String(anesthetistName || '').slice(0, 160),
      assistantDoctors: Array.isArray(assistantDoctors) ? assistantDoctors.slice(0, 20).map(x => String(x).slice(0, 160)) : [],
      nurseNames: Array.isArray(nurseNames) ? nurseNames.slice(0, 30).map(x => String(x).slice(0, 160)) : [],
      otNo: room.otNo, date, startTime, endTime, notes: String(notes || '').slice(0, 3000),
      status: 'scheduled', bookedBy: String(req.user.email || '').trim().toLowerCase()
    });
    res.status(201).json(booking);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/bookings/:id', protect, async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const { status } = req.body || {};
    if (!['in-progress', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid booking status' });
    const existing = await OTSurgery.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Booking not found' });
    const transitions = {
      scheduled: new Set(['in-progress', 'cancelled']),
      'in-progress': new Set(['completed', 'cancelled']),
      completed: new Set(),
      cancelled: new Set()
    };
    if (!transitions[existing.status] || !transitions[existing.status].has(status)) return res.status(409).json({ message: 'Invalid booking status transition' });
    const booking = await OTSurgery.findOneAndUpdate(
      { _id: existing._id, status: existing.status },
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!booking) return res.status(409).json({ message: 'Booking was updated by another request' });
    if (status === 'in-progress') await OTRoom.findOneAndUpdate({ otNo: booking.otNo }, { $set: { status: 'occupied' } });
    if (['completed', 'cancelled'].includes(status)) {
      const active = await OTSurgery.findOne({ otNo: booking.otNo, status: 'in-progress' });
      if (!active) await OTRoom.findOneAndUpdate({ otNo: booking.otNo, status: { $ne: 'maintenance' } }, { $set: { status: 'available' } });
    }
    res.json(booking);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
