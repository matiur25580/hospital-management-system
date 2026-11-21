const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Vital = require('../models/Vital');
const Patient = require('../models/Patient');

r.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'Patient') {
      return res.json(await Vital.find({ patientEmail: req.user.email }).sort({ date: -1 }).limit(100));
    }
    if (!['Admin', 'Doctor', 'Nurse'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
    const filter = req.query.patientEmail ? { patientEmail: String(req.query.patientEmail).trim().toLowerCase() } : {};
    res.json(await Vital.find(filter).sort({ date: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: 'Could not load patient vitals.' }); }
});

r.post('/', protect, async (req, res) => {
  try {
    if (!['Admin', 'Doctor', 'Nurse'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
    const patientEmail = String(req.body.patientEmail || '').trim().toLowerCase();
    if (!patientEmail || !await Patient.exists({ email: patientEmail })) return res.status(404).json({ message: 'Patient profile not found.' });
    const { temperature, bp, pulse, notes } = req.body;
    const vital = await Vital.create({
      patientEmail, patientName: req.body.patientName,
      temperature, bp, pulse, notes, recordedBy: req.user.email
    });
    res.status(201).json(vital);
  } catch (e) { res.status(400).json({ message: 'Could not record patient vitals.' }); }
});
module.exports = r;
