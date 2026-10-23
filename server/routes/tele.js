const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Teleconsult = require('../models/Teleconsult');

// GET /api/tele (?doctorEmail=, ?patientEmail=, ?status=, ?date=)
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.doctorEmail) q.doctorEmail = req.query.doctorEmail;
    if (req.query.patientEmail) q.patientEmail = req.query.patientEmail;
    if (req.query.status) q.status = req.query.status;
    if (req.query.date) q.date = req.query.date;
    res.json(await Teleconsult.find(q).sort({ date: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Teleconsult.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id', protect, async (req, res) => {
  try {
    const body = { ...req.body };
    // auto-generate Jitsi meeting link on confirm
    if (body.status === 'confirmed' && !body.meetingLink) {
      body.meetingLink = 'https://meet.jit.si/CityCareTele' + Date.now().toString(36).toUpperCase();
    }
    res.json(await Teleconsult.findByIdAndUpdate(req.params.id, body, { new: true }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
