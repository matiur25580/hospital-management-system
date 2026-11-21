const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const { clinicalRoles } = require('../utils/patientAccess');

function canReadPrescription(user, record) {
  if (!user || !record) return false;
  if (user.role === 'Patient') return record.patientEmail === user.email;
  if (user.role === 'Doctor') return record.doctorEmail === user.email;
  return clinicalRoles.includes(user.role);
}

r.get('/', protect, async (req, res, next) => {
  try {
    let filter;
    if (req.user.role === 'Patient') filter = { patientEmail: req.user.email };
    else if (req.user.role === 'Doctor') filter = { doctorEmail: req.user.email };
    else if (clinicalRoles.includes(req.user.role)) filter = {};
    else return res.status(403).json({ message: 'Access denied.' });
    const list = await Prescription.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (e) { next(e); }
});

r.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'Doctor') return res.status(403).json({ message: 'Only doctors can create prescriptions.' });
    const { patientEmail, patientName, diagnosis, medicines, notes, followUpDate } = req.body || {};
    if (!patientEmail || !diagnosis || !Array.isArray(medicines) || !medicines.length)
      return res.status(400).json({ message: 'Patient, diagnosis and at least one medicine are required.' });
    const patient = await Patient.findOne({ email: String(patientEmail).trim().toLowerCase() });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found.' });
    const pr = await Prescription.create({
      doctorEmail: req.user.email,
      doctorName: req.user.name,
      patientEmail: patient.email,
      patientName: patient.name || patientName,
      diagnosis, medicines, notes, followUpDate
    });
    res.status(201).json(pr);
  } catch (e) { next(e); }
});

r.get('/:id', protect, async (req, res, next) => {
  try {
    const pr = await Prescription.findById(req.params.id);
    if (!pr) return res.status(404).json({ message: 'Prescription not found.' });
    if (!canReadPrescription(req.user, pr)) return res.status(403).json({ message: 'Access denied.' });
    res.json(pr);
  } catch (e) { next(e); }
});
module.exports = r;
