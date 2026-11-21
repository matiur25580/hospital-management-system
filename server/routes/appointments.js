const express = require('express');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorSchedule = require('../models/DoctorSchedule');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { sendMail } = require('../utils/notify');
const { protect } = require('../middleware/auth');
const router = express.Router();
const clinicalRoles = ['Admin', 'Doctor', 'Nurse', 'Receptionist'];

router.post('/', protect, async (req, res) => {
  try {
    if (!['Patient', 'Admin', 'Receptionist'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
    const { doctor, date, timeSlot, symptoms } = req.body || {};
    if (!mongoose.isValidObjectId(doctor) || !date || Number.isNaN(new Date(date).getTime())) return res.status(400).json({ message: 'Valid doctor and appointment date are required.' });
    let patient;
    if (req.user.role === 'Patient') patient = await Patient.findOne({ userId: req.user.id });
    else patient = await Patient.findById(req.body.patient);
    if (!patient) return res.status(404).json({ message: 'Patient profile not found.' });
    const doctorUser = await User.findOne({ _id: doctor, role: 'Doctor' }).select('_id email');
    if (!doctorUser) return res.status(404).json({ message: 'Doctor not found.' });
    const doctorSchedule = await DoctorSchedule.findOne({ doctorEmail: doctorUser.email });
    if (doctorSchedule) {
      const appointmentDate = new Date(date);
      const day = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const slot = (doctorSchedule.weekly || []).find(item => item.day === day && item.active);
      const leave = (doctorSchedule.leaves || []).some(item => new Date(item).toDateString() === appointmentDate.toDateString());
      if (leave || !slot) return res.status(400).json({ message: 'Doctor not available on this date.' });
    }
    const count = await Appointment.countDocuments({ doctor, date: new Date(date) });
    const appt = await Appointment.create({ patient: patient._id, doctor, date: new Date(date), timeSlot, symptoms, tokenNo: count + 1 });
    try { await sendMail(patient.email, 'Appointment Confirmed', '<p>Your appointment is confirmed.</p>'); } catch (_) {}
    res.status(201).json(appt);
  } catch (e) { res.status(400).json({ message: 'Could not create appointment.' }); }
});

router.get('/doctor/:doctorId', protect, async (req, res) => {
  if (req.user.role === 'Doctor' && String(req.user.id) !== String(req.params.doctorId)) return res.status(403).json({ message: 'Access denied.' });
  if (!['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
  if (!mongoose.isValidObjectId(req.params.doctorId)) return res.status(400).json({ message: 'Invalid doctor ID.' });
  const list = await Appointment.find({ doctor: req.params.doctorId }).populate('patient').sort({ tokenNo: 1 });
  res.json(list);
});

router.patch('/:id/status', protect, async (req, res) => {
  if (!['Admin', 'Doctor'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid appointment ID.' });
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
  if (req.user.role === 'Doctor' && String(appointment.doctor) !== String(req.user.id)) return res.status(403).json({ message: 'You can only update your own appointments.' });
  const allowed = ['booked', 'in-queue', 'consulting', 'completed', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid appointment status.' });
  appointment.status = req.body.status;
  await appointment.save();
  res.json(appointment);
});

router.get('/', protect, async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'Patient') {
      const patient = await Patient.findOne({ userId: req.user.id }).select('_id');
      if (!patient) return res.json([]);
      filter = { patient: patient._id };
    } else if (clinicalRoles.includes(req.user.role)) filter = {};
    else return res.status(403).json({ message: 'Access denied.' });
    const list = await Appointment.find(filter).populate('patient').populate('doctor').sort({ date: -1 }).limit(200);
    res.json(list);
  } catch (e) { res.status(500).json({ message: 'Could not load appointments.' }); }
});
module.exports = router;
