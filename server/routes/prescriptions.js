const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Prescription = require('../models/Prescription');
// GET /api/prescriptions?doctorEmail=x or ?patientEmail=y
r.get('/', protect, async (req, res, next) => {
  try {
    const q = {};
    if (req.query.doctorEmail) q.doctorEmail = req.query.doctorEmail;
    if (req.query.patientEmail) q.patientEmail = req.query.patientEmail;
    const list = await Prescription.find(q).sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (e) { next(e); }
});
// POST /api/prescriptions
r.post('/', protect, async (req, res, next) => {
  try {
    const { doctorEmail, doctorName, patientEmail, patientName, diagnosis, medicines, notes, followUpDate } = req.body;
    if (!doctorEmail || !patientEmail || !diagnosis || !medicines || !medicines.length)
      return res.status(400).json({ message: 'Doctor, patient, diagnosis and at least one medicine are required' });
    const pr = await Prescription.create({ doctorEmail, doctorName, patientEmail, patientName, diagnosis, medicines, notes, followUpDate });
    res.status(201).json(pr);
  } catch (e) { next(e); }
});
r.get('/:id', protect, async (req, res, next) => {
  try {
    const pr = await Prescription.findById(req.params.id);
    if (!pr) return res.status(404).json({ message: 'Prescription not found' });
    res.json(pr);
  } catch (e) { next(e); }
});
module.exports = r;
