const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Discharge = require('../models/Discharge');

// GET /api/discharge (?patientEmail=, ?status=)
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.patientEmail) q.patientEmail = req.query.patientEmail;
    if (req.query.status) q.status = req.query.status;
    res.json(await Discharge.find(q).sort({ createdAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Discharge.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id', protect, async (req, res) => {
  try { res.json(await Discharge.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.delete('/:id', protect, async (req, res) => {
  try { await Discharge.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
