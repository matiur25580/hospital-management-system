const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Ward = require('../models/Ward');
const Bed = require('../models/Bed');

// GET /api/beds/wards -> wards with live occupancy counts
r.get('/wards', protect, async (req, res) => {
  try {
    const wards = await Ward.find().sort({ name: 1 });
    const out = await Promise.all(wards.map(async (w) => {
      const total = await Bed.countDocuments({ ward: w._id });
      const occupied = await Bed.countDocuments({ ward: w._id, status: 'occupied' });
      const maintenance = await Bed.countDocuments({ ward: w._id, status: 'maintenance' });
      return { _id: w._id, name: w.name, type: w.type, floor: w.floor, total, occupied, maintenance, available: total - occupied - maintenance };
    }));
    res.json(out);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/beds/wards -> create ward (Admin)
r.post('/wards', protect, async (req, res) => {
  try { res.status(201).json(await Ward.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/beds (?status=&ward=)
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.ward) q.ward = req.query.ward;
    res.json(await Bed.find(q).populate('ward').sort({ bedNumber: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/beds -> add bed (Admin)
r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await (await Bed.create(req.body)).populate('ward')); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/beds/:id/assign -> admit patient to bed
r.patch('/:id/assign', protect, async (req, res) => {
  try {
    const b = await Bed.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Bed not found' });
    if (b.status === 'occupied') return res.status(400).json({ message: 'Bed already occupied' });
    b.status = 'occupied';
    b.patientName = req.body.patientName;
    b.patientEmail = req.body.patientEmail;
    b.caseId = req.body.caseId || undefined;
    b.assignedAt = new Date();
    b.assignedBy = req.body.assignedBy;
    await b.save();
    res.json(await b.populate('ward'));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/beds/:id/release -> free the bed
r.patch('/:id/release', protect, async (req, res) => {
  try {
    const b = await Bed.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Bed not found' });
    b.status = 'available';
    b.patientName = undefined; b.patientEmail = undefined;
    b.caseId = undefined; b.assignedAt = undefined; b.assignedBy = undefined;
    await b.save();
    res.json(await b.populate('ward'));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/beds/:id/maintenance -> toggle maintenance flag
r.patch('/:id/maintenance', protect, async (req, res) => {
  try {
    const b = await Bed.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Bed not found' });
    b.status = b.status === 'maintenance' ? 'available' : 'maintenance';
    await b.save();
    res.json(await b.populate('ward'));
  } catch (e) { res.status(400).json({ message: e.message }); }
});


// PATCH /api/beds/:id -> update status (Admin)
r.patch('/:id', protect, async (req, res) => {
  try {
    const b = await Bed.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('ward');
    if (!b) return res.status(404).json({ message: 'Bed not found' });
    res.json(b);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/beds/:id/assign -> assign patient to bed
r.post('/:id/assign', protect, async (req, res) => {
  try {
    const b = await Bed.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Bed not found' });
    if (b.status === 'occupied') return res.status(400).json({ message: 'Bed already occupied' });
    b.status = 'occupied';
    b.patientEmail = req.body.patientEmail;
    b.patientName = req.body.patientName || req.body.patientEmail;
    b.assignedAt = new Date();
    await b.save();
    res.json(await b.populate('ward'));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/beds/:id/release -> release bed
r.post('/:id/release', protect, async (req, res) => {
  try {
    const b = await Bed.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Bed not found' });
    b.status = 'available';
    b.patientEmail = undefined;
    b.patientName = undefined;
    b.caseId = undefined;
    b.assignedAt = undefined;
    await b.save();
    res.json(await b.populate('ward'));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
