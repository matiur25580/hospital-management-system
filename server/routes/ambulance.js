const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Ambulance = require('../models/Ambulance');
const AmbulanceTrip = require('../models/AmbulanceTrip');

// GET /api/ambulance (?status=available)
r.get('/', protect, async (req, res) => {
  try {
    const q = req.query.status ? { status: req.query.status } : {};
    res.json(await Ambulance.find(q).sort({ vehicleNo: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/ambulance -> add ambulance
r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Ambulance.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/ambulance/:id -> update (status/location/driver)
r.patch('/:id', protect, async (req, res) => {
  try { res.json(await Ambulance.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/ambulance/:id
r.delete('/:id', protect, async (req, res) => {
  try { await Ambulance.findByIdAndDelete(req.params.id); res.json({ message: 'deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/ambulance/dispatch -> dispatch available ambulance
r.post('/dispatch', protect, async (req, res) => {
  try {
    const amb = await Ambulance.findById(req.body.ambulanceId);
    if (!amb) return res.status(404).json({ message: 'Ambulance not found' });
    if (amb.status !== 'available') return res.status(400).json({ message: 'Ambulance not available (status: ' + amb.status + ')' });
    amb.status = 'on-trip';
    await amb.save();
    const trip = await AmbulanceTrip.create({
      ambulanceId: amb._id, vehicleNo: amb.vehicleNo,
      driverName: amb.driverName, driverPhone: amb.driverPhone,
      patientName: req.body.patientName, patientPhone: req.body.patientPhone,
      pickupLocation: req.body.pickupLocation, destination: req.body.destination || 'Hospital',
      currentLocation: amb.baseLocation, status: 'dispatched',
      stages: { dispatched: new Date() }, notes: req.body.notes,
      dispatchedBy: req.user.email || req.user.name
    });
    res.status(201).json(trip);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/ambulance/trips (?status= / ?active=true)
r.get('/trips', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.active === 'true') q.status = { $nin: ['completed', 'cancelled'] };
    res.json(await AmbulanceTrip.find(q).sort({ dispatchedAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/ambulance/trips/:id -> update stage/location
// body: { status: 'en-route'|'on-scene'|'to-hospital'|'completed'|'cancelled', currentLocation }
r.patch('/trips/:id', protect, async (req, res) => {
  try {
    const trip = await AmbulanceTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    const stageKey = { 'en-route': 'enRoute', 'on-scene': 'onScene', 'to-hospital': 'toHospital', 'completed': 'completed' }[req.body.status];
    if (req.body.status) trip.status = req.body.status;
    if (stageKey) trip.stages[stageKey] = new Date();
    if (req.body.currentLocation) trip.currentLocation = req.body.currentLocation;
    if (req.body.notes) trip.notes = req.body.notes;
    await trip.save();
    if (['completed', 'cancelled'].includes(trip.status)) {
      await Ambulance.findByIdAndUpdate(trip.ambulanceId, { status: 'available', baseLocation: trip.destination });
    }
    res.json(trip);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
