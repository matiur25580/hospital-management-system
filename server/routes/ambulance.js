const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Ambulance = require('../models/Ambulance');
const AmbulanceTrip = require('../models/AmbulanceTrip');

// POST /api/ambulance/seed
r.post('/seed', protect, async (req, res) => {
  try {
    if (await Ambulance.countDocuments() > 0) return res.json({ seeded: 0 });
    const V = [
      { vehicleNo: 'WB 11 C 4521', driverName: 'Ramesh Yadav', driverPhone: '9830011223', type: 'advanced', status: 'available', baseLocation: 'Hospital Gate' },
      { vehicleNo: 'WB 11 C 7834', driverName: 'Sanjay Das', driverPhone: '9830044556', type: 'basic', status: 'available', baseLocation: 'Hospital Gate' },
      { vehicleNo: 'WB 12 D 2210', driverName: 'Prakash Singh', driverPhone: '9830077889', type: 'basic', status: 'maintenance', baseLocation: 'Garage' },
      { vehicleNo: 'WB 11 E 9090', driverName: 'Anil Kumar', driverPhone: '9830011998', type: 'advanced', status: 'available', baseLocation: 'Raiganj Stand' }
    ];
    await Ambulance.insertMany(V);
    res.json({ seeded: V.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.get('/vehicles', protect, async (req, res) => {
  try { res.json(await Ambulance.find().sort({ vehicleNo: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/vehicles', protect, async (req, res) => {
  try { res.status(201).json(await Ambulance.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/vehicles/:id', protect, async (req, res) => {
  try { res.json(await Ambulance.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/ambulance/trips (?active=1)
r.get('/trips', protect, async (req, res) => {
  try {
    const q = req.query.active ? { status: { $nin: ['completed', 'cancelled'] } } : {};
    res.json(await AmbulanceTrip.find(q).sort({ dispatchedAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/ambulance/trips - dispatch
r.post('/trips', protect, async (req, res) => {
  try {
    const v = await Ambulance.findById(req.body.ambulanceId);
    if (!v || v.status !== 'available') return res.status(400).json({ message: 'Ambulance not available' });
    const trip = await AmbulanceTrip.create({
      ...req.body, vehicleNo: v.vehicleNo, driverName: v.driverName, driverPhone: v.driverPhone,
      status: 'dispatched', stages: { dispatched: new Date() }
    });
    v.status = 'on-trip'; await v.save();
    res.status(201).json(trip);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

const STAGE_KEY = { 'en-route': 'enRoute', 'on-scene': 'onScene', 'to-hospital': 'toHospital', 'completed': 'completed' };

// PATCH /api/ambulance/trips/:id - update status/location
r.patch('/trips/:id', protect, async (req, res) => {
  try {
    const trip = await AmbulanceTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Not found' });
    if (req.body.status && req.body.status !== trip.status) {
      trip.status = req.body.status;
      const key = STAGE_KEY[req.body.status];
      if (key) trip.stages[key] = new Date();
      if (['completed', 'cancelled'].includes(req.body.status)) {
        await Ambulance.findByIdAndUpdate(trip.ambulanceId, { status: 'available', baseLocation: trip.currentLocation || undefined });
      }
    }
    if (req.body.currentLocation !== undefined) trip.currentLocation = req.body.currentLocation;
    if (req.body.notes !== undefined) trip.notes = req.body.notes;
    await trip.save();
    res.json(trip);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
