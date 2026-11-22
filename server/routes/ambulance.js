const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Ambulance = require('../models/Ambulance');
const AmbulanceTrip = require('../models/AmbulanceTrip');
const { canOperateAmbulance, canAdministerFleet, allowedTripTransitions } = require('../utils/ambulanceAccess');
const actorEmail = user => String(user && user.email || '').trim().toLowerCase();
const textField = (value, max = 160) => String(value || '').trim().slice(0, max);

r.get('/', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    const q = {};
    if (req.query.status) {
      if (!['available', 'on-trip', 'maintenance'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid ambulance status' });
      q.status = req.query.status;
    }
    res.json(await Ambulance.find(q).sort({ vehicleNo: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.get('/vehicles', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    res.json(await Ambulance.find().sort({ vehicleNo: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/seed', protect, async (req, res) => {
  try {
    if (!canAdministerFleet(req.user)) return res.status(403).json({ message: 'Admin access required' });
    if (await Ambulance.countDocuments()) return res.json({ seeded: 0, message: 'Fleet already exists' });
    const defaults = [
      { vehicleNo: 'WB-01-AMB-001', driverName: 'Ambulance Driver 1', type: 'basic', status: 'available', baseLocation: 'Hospital' },
      { vehicleNo: 'WB-01-AMB-002', driverName: 'Ambulance Driver 2', type: 'advanced', status: 'available', baseLocation: 'Hospital' },
      { vehicleNo: 'WB-01-AMB-003', driverName: 'Ambulance Driver 3', type: 'icu', status: 'available', baseLocation: 'Hospital' }
    ];
    const created = await Ambulance.insertMany(defaults);
    res.json({ seeded: created.length });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try {
    if (!canAdministerFleet(req.user)) return res.status(403).json({ message: 'Admin access required' });
    const { vehicleNo, type, driverName, driverPhone, currentLocation, baseLocation } = req.body || {};
    if (!textField(vehicleNo, 40) || !['basic', 'advanced', 'icu'].includes(type)) return res.status(400).json({ message: 'Valid vehicle number and type are required' });
    const ambulance = await Ambulance.create({
      vehicleNo: textField(vehicleNo, 40), type, driverName: textField(driverName),
      driverPhone: textField(driverPhone, 40), baseLocation: textField(baseLocation || currentLocation, 160), status: 'available'
    });
    res.status(201).json(ambulance);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id', protect, async (req, res) => {
  try {
    if (!canAdministerFleet(req.user)) return res.status(403).json({ message: 'Admin access required' });
    const { status, driverName, driverPhone, baseLocation } = req.body || {};
    const update = {};
    if (status !== undefined) {
      if (!['available', 'maintenance'].includes(status)) return res.status(400).json({ message: 'Only available or maintenance can be set manually' });
      update.status = status;
    }
    if (driverName !== undefined) update.driverName = textField(driverName);
    if (driverPhone !== undefined) update.driverPhone = textField(driverPhone, 40);
    if (baseLocation !== undefined) update.baseLocation = textField(baseLocation, 160);
    const ambulance = await Ambulance.findOneAndUpdate(
      { _id: req.params.id, ...(status === 'available' ? { status: { $ne: 'on-trip' } } : {}) },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!ambulance) return res.status(409).json({ message: 'Ambulance not found or currently on a trip' });
    res.json(ambulance);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.delete('/:id', protect, async (req, res) => {
  try {
    if (!canAdministerFleet(req.user)) return res.status(403).json({ message: 'Admin access required' });
    const ambulance = await Ambulance.findOneAndDelete({ _id: req.params.id, status: { $ne: 'on-trip' } });
    if (!ambulance) return res.status(409).json({ message: 'Ambulance not found or currently on a trip' });
    res.json({ message: 'deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// AmbulanceMgmt request queue (request first, allocate a vehicle after review).
r.get('/dispatch', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    res.json(await AmbulanceTrip.find({ status: { $in: ['requested', 'dispatched', 'arrived', 'completed', 'cancelled'] } }).sort({ dispatchedAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/dispatch', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    const { patientName, patientPhone, pickupLocation, destination, emergencyType, notes } = req.body || {};
    if (!textField(patientName) || !textField(pickupLocation, 300)) return res.status(400).json({ message: 'Patient name and pickup location are required' });
    const trip = await AmbulanceTrip.create({
      patientName: textField(patientName), patientPhone: textField(patientPhone, 40),
      pickupLocation: textField(pickupLocation, 300), destination: textField(destination || 'Hospital', 300),
      emergencyType: textField(emergencyType || 'General', 80), notes: textField(notes, 2000),
      status: 'requested', requestedBy: actorEmail(req.user), dispatchedBy: actorEmail(req.user)
    });
    res.status(201).json(trip);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/dispatch/:id', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    const { status, ambulanceId } = req.body || {};
    const existing = await AmbulanceTrip.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Dispatch request not found' });

    if (existing.status === 'requested' && status === 'cancelled') {
      const cancelled = await AmbulanceTrip.findOneAndUpdate(
        { _id: existing._id, status: 'requested' },
        { $set: { status: 'cancelled' } },
        { new: true }
      );
      if (!cancelled) return res.status(409).json({ message: 'Request was updated by another action' });
      return res.json(cancelled);
    }

    if (existing.status === 'requested' && status === 'dispatched') {
      if (!ambulanceId) return res.status(400).json({ message: 'An available ambulance must be selected' });
      const ambulance = await Ambulance.findOneAndUpdate(
        { _id: ambulanceId, status: 'available' },
        { $set: { status: 'on-trip' } },
        { new: true }
      );
      if (!ambulance) return res.status(409).json({ message: 'Ambulance is no longer available' });
      const dispatched = await AmbulanceTrip.findOneAndUpdate(
        { _id: existing._id, status: 'requested' },
        { $set: {
          status: 'dispatched', ambulanceId: ambulance._id, vehicleNo: ambulance.vehicleNo,
          driverName: ambulance.driverName, driverPhone: ambulance.driverPhone,
          currentLocation: ambulance.baseLocation, dispatchedBy: actorEmail(req.user),
          'stages.dispatched': new Date()
        } },
        { new: true }
      );
      if (!dispatched) {
        await Ambulance.findOneAndUpdate({ _id: ambulance._id, status: 'on-trip' }, { $set: { status: 'available' } });
        return res.status(409).json({ message: 'Request was updated by another action' });
      }
      return res.json(dispatched);
    }

    if (existing.status === 'dispatched' && status === 'arrived') {
      const arrived = await AmbulanceTrip.findOneAndUpdate(
        { _id: existing._id, status: 'dispatched' },
        { $set: { status: 'arrived', 'stages.onScene': new Date() } },
        { new: true }
      );
      if (!arrived) return res.status(409).json({ message: 'Request was updated by another action' });
      return res.json(arrived);
    }

    if (existing.status === 'arrived' && status === 'completed') {
      const completed = await AmbulanceTrip.findOneAndUpdate(
        { _id: existing._id, status: 'arrived' },
        { $set: { status: 'completed', 'stages.completed': new Date() } },
        { new: true }
      );
      if (!completed) return res.status(409).json({ message: 'Request was updated by another action' });
      if (completed.ambulanceId) await Ambulance.findOneAndUpdate({ _id: completed.ambulanceId, status: 'on-trip' }, { $set: { status: 'available', baseLocation: completed.destination } });
      return res.json(completed);
    }

    return res.status(409).json({ message: 'Invalid dispatch status transition' });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// AmbulanceTracking workflow: reserve an available vehicle and create an active trip.
r.get('/trips', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.active === 'true' || req.query.active === '1') q.status = { $nin: ['completed', 'cancelled'] };
    res.json(await AmbulanceTrip.find(q).sort({ dispatchedAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/trips', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    const { ambulanceId, patientName, patientPhone, pickupLocation, destination, notes } = req.body || {};
    if (!ambulanceId || !textField(patientName) || !textField(pickupLocation, 300)) return res.status(400).json({ message: 'Ambulance, patient and pickup location are required' });
    const ambulance = await Ambulance.findOneAndUpdate(
      { _id: ambulanceId, status: 'available' },
      { $set: { status: 'on-trip' } },
      { new: true }
    );
    if (!ambulance) return res.status(409).json({ message: 'Ambulance is no longer available' });
    try {
      const trip = await AmbulanceTrip.create({
        ambulanceId: ambulance._id, vehicleNo: ambulance.vehicleNo,
        driverName: ambulance.driverName, driverPhone: ambulance.driverPhone,
        patientName: textField(patientName), patientPhone: textField(patientPhone, 40),
        pickupLocation: textField(pickupLocation, 300), destination: textField(destination || 'Hospital', 300),
        currentLocation: ambulance.baseLocation, status: 'dispatched',
        stages: { dispatched: new Date() }, notes: textField(notes, 2000), dispatchedBy: actorEmail(req.user)
      });
      return res.status(201).json(trip);
    } catch (error) {
      await Ambulance.findOneAndUpdate({ _id: ambulance._id, status: 'on-trip' }, { $set: { status: 'available' } });
      throw error;
    }
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/trips/:id', protect, async (req, res) => {
  try {
    if (!canOperateAmbulance(req.user)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    const existing = await AmbulanceTrip.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Trip not found' });
    const body = req.body || {};
    const update = {};
    if (body.currentLocation !== undefined) update.currentLocation = textField(body.currentLocation, 300);
    if (body.notes !== undefined) update.notes = textField(body.notes, 2000);
    if (body.status !== undefined) {
      if (!allowedTripTransitions(existing.status).includes(body.status)) return res.status(409).json({ message: 'Invalid trip status transition' });
      update.status = body.status;
      const stageKey = { 'en-route': 'enRoute', 'on-scene': 'onScene', 'to-hospital': 'toHospital', completed: 'completed' }[body.status];
      if (stageKey) update['stages.' + stageKey] = new Date();
    }
    if (!Object.keys(update).length) return res.status(400).json({ message: 'No valid trip update provided' });
    const trip = await AmbulanceTrip.findOneAndUpdate(
      { _id: existing._id, status: existing.status },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!trip) return res.status(409).json({ message: 'Trip was updated by another request' });
    if (['completed', 'cancelled'].includes(trip.status) && trip.ambulanceId) {
      await Ambulance.findOneAndUpdate(
        { _id: trip.ambulanceId, status: 'on-trip' },
        { $set: { status: 'available', baseLocation: trip.destination } }
      );
    }
    res.json(trip);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
