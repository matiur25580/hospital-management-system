const r = require('express').Router();
const { protect } = require('../middleware/auth');
const OTRoom = require('../models/OTRoom');
const OTSurgery = require('../models/OTSurgery');

const DEFAULT_OTS = [
  { otNo: 'OT-1', floor: '3rd Floor, OT Complex', type: 'General Surgery' },
  { otNo: 'OT-2', floor: '3rd Floor, OT Complex', type: 'Orthopedic / Cardiac' },
  { otNo: 'OT-3', floor: '3rd Floor, OT Complex', type: 'Gynecology' },
  { otNo: 'OT-4', floor: 'Ground Floor, Emergency', type: 'Emergency (24x7)' }
];

// GET /api/ot/rooms (auto-seeds 4 default OTs on first call)
r.get('/rooms', protect, async (req, res) => {
  try {
    let rooms = await OTRoom.find().sort({ otNo: 1 });
    if (!rooms.length) rooms = await OTRoom.insertMany(DEFAULT_OTS);
    res.json(rooms);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/rooms', protect, async (req, res) => {
  try { res.status(201).json(await OTRoom.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/rooms/:id', protect, async (req, res) => {
  try { res.json(await OTRoom.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/ot/bookings (?date=, ?status=)
r.get('/bookings', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.date) q.date = req.query.date;
    if (req.query.status) q.status = req.query.status;
    res.json(await OTSurgery.find(q).sort({ date: 1, startTime: 1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/ot/bookings - with OT time-clash check
r.post('/bookings', protect, async (req, res) => {
  try {
    const { otNo, date, startTime, endTime } = req.body;
    const clash = await OTSurgery.findOne({
      otNo, date, status: { $in: ['scheduled', 'in-progress'] },
      startTime: { $lt: endTime }, endTime: { $gt: startTime }
    });
    if (clash) return res.status(400).json({ message: 'OT clash with ' + clash.patientName + ' (' + clash.startTime + '-' + clash.endTime + ')' });
    res.status(201).json(await OTSurgery.create(req.body));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/ot/bookings/:id - status flow, syncs OT room status
r.patch('/bookings/:id', protect, async (req, res) => {
  try {
    const b = await OTSurgery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!b) return res.status(404).json({ message: 'Not found' });
    if (req.body.status === 'in-progress') await OTRoom.findOneAndUpdate({ otNo: b.otNo }, { status: 'occupied' });
    if (['completed', 'cancelled'].includes(req.body.status)) {
      const active = await OTSurgery.findOne({ otNo: b.otNo, status: 'in-progress' });
      if (!active) await OTRoom.findOneAndUpdate({ otNo: b.otNo }, { status: 'available' });
    }
    res.json(b);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
