const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Teleconsult = require('../models/Teleconsult');
const User = require('../models/User');
const { teleconsultScope, canManageTeleconsult, userEmail, normalizedEmail } = require('../utils/clinicalWorkflowAccess');

const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(value).getTime());
const allowedSlots = new Set(['09:00', '10:00', '11:00', '12:00', '17:00', '18:00', '19:00', '20:00']);
const transitions = {
  requested: new Set(['confirmed', 'cancelled']),
  confirmed: new Set(['in-progress', 'cancelled']),
  'in-progress': new Set(['completed']),
  completed: new Set(),
  cancelled: new Set()
};

r.get('/', protect, async (req, res) => {
  try {
    const scope = teleconsultScope(req.user);
    if (!scope) return res.status(403).json({ message: 'Access denied' });
    const q = { ...scope };
    if (req.query.status) {
      if (!['requested', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid status' });
      q.status = req.query.status;
    }
    if (req.query.date) {
      if (!validDate(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
      q.date = req.query.date;
    }
    res.json(await Teleconsult.find(q).sort({ date: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Patient' || !userEmail(req.user)) return res.status(403).json({ message: 'Only patients can request a consultation' });
    const { doctorEmail, department, date, timeSlot, symptoms, patientPhone } = req.body || {};
    const normalizedDoctorEmail = normalizedEmail(doctorEmail);
    if (!normalizedDoctorEmail || !String(department || '').trim() || !validDate(date) || !allowedSlots.has(timeSlot) || !String(symptoms || '').trim()) {
      return res.status(400).json({ message: 'Valid doctor, department, date, time and symptoms are required' });
    }
    const doctor = await User.findOne({ email: normalizedDoctorEmail, role: 'Doctor' }).select('name email');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const patient = await User.findById(req.user.id).select('name email');
    if (!patient) return res.status(401).json({ message: 'Patient account unavailable' });
    const doc = await Teleconsult.create({
      patientName: patient.name || '', patientEmail: userEmail(req.user), patientPhone: String(patientPhone || '').slice(0, 40),
      doctorName: doctor.name || '', doctorEmail: normalizedEmail(doctor.email), department: String(department).trim().slice(0, 120),
      date, timeSlot, symptoms: String(symptoms).trim().slice(0, 4000), fee: 300, status: 'requested'
    });
    res.status(201).json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id', protect, async (req, res) => {
  try {
    const requestedStatus = req.body && req.body.status;
    if (!['confirmed', 'in-progress', 'completed', 'cancelled'].includes(requestedStatus)) {
      return res.status(400).json({ message: 'Invalid consultation status' });
    }
    const existing = await Teleconsult.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Consultation not found' });
    if (!canManageTeleconsult(req.user, existing)) return res.status(403).json({ message: 'Only the assigned doctor or an admin can update this consultation' });
    if (!transitions[existing.status] || !transitions[existing.status].has(requestedStatus)) {
      return res.status(409).json({ message: 'Invalid consultation status transition' });
    }
    const update = { status: requestedStatus };
    if (requestedStatus === 'confirmed') {
      update.meetingLink = 'https://meet.jit.si/CityCareTele' + Date.now().toString(36).toUpperCase();
    }
    if (requestedStatus === 'completed') update.prescription = String(req.body.prescription || '').trim().slice(0, 5000);
    const updated = await Teleconsult.findOneAndUpdate(
      { _id: existing._id, status: existing.status, doctorEmail: existing.doctorEmail },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(409).json({ message: 'Consultation was updated by another request' });
    res.json(updated);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
