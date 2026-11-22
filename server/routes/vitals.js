const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Vital = require('../models/Vital');
const Patient = require('../models/Patient');

const CLINICAL_ROLES = new Set(['Admin', 'Doctor', 'Nurse']);
const emailOf = user => String(user && user.email || '').trim().toLowerCase();

r.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'Patient') {
      return res.json(await Vital.find({ patientEmail: emailOf(req.user) }).sort({ date: -1 }).limit(100));
    }
    if (!CLINICAL_ROLES.has(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
    const filter = req.query.patientEmail ? { patientEmail: String(req.query.patientEmail).trim().toLowerCase() } : {};
    res.json(await Vital.find(filter).sort({ date: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: 'Could not load patient vitals.' }); }
});

r.post('/', protect, async (req, res) => {
  try {
    if (!CLINICAL_ROLES.has(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
    const patientEmail = String(req.body.patientEmail || '').trim().toLowerCase();
    const patient = patientEmail ? await Patient.findOne({ email: patientEmail }).select('name email') : null;
    if (!patient) return res.status(404).json({ message: 'Patient profile not found.' });
    const temperature = Number(req.body.temperature);
    const pulse = Number(req.body.pulse);
    const bp = String(req.body.bp || '').trim();
    const bpMatch = bp.match(/^(\d{2,3})\/(\d{2,3})$/);
    if (!Number.isFinite(temperature) || temperature < 25 || temperature > 45 ||
        !Number.isInteger(pulse) || pulse < 20 || pulse > 250 || !bpMatch ||
        Number(bpMatch[1]) < 50 || Number(bpMatch[1]) > 300 ||
        Number(bpMatch[2]) < 30 || Number(bpMatch[2]) > 200 ||
        Number(bpMatch[1]) <= Number(bpMatch[2])) {
      return res.status(400).json({ message: 'Enter valid temperature, blood pressure and pulse values.' });
    }
    const vital = await Vital.create({
      patientEmail: patient.email,
      patientName: patient.name,
      temperature: temperature.toFixed(1),
      bp,
      pulse: String(pulse),
      notes: String(req.body.notes || '').trim().slice(0, 2000),
      recordedBy: emailOf(req.user)
    });
    res.status(201).json(vital);
  } catch (e) { res.status(400).json({ message: 'Could not record patient vitals.' }); }
});
module.exports = r;
