const express = require('express');
const Appointment = require('../models/Appointment');
const DoctorSchedule = require('../models/DoctorSchedule');
const { sendMail } = require('../utils/notify');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, async (req,res)=>{
  try{
    const { doctor, date } = req.body;
    const count = await Appointment.countDocuments({doctor, date: new Date(date)});
    // doctor schedule availability check (fail-open if no schedule set)
    try {
      const _dem = req.body.doctorEmail || req.body.doctor || '';
      const _dt = req.body.date || req.body.appointmentDate || '';
      if (_dem && _dt) {
        const _s = await DoctorSchedule.findOne({ doctorEmail: _dem });
        if (_s) {
          const _d = new Date(_dt);
          const _day = _d.toLocaleDateString('en-US', { weekday: 'long' });
          const _slot = (_s.weekly || []).find(w => w.day === _day && w.active);
          const _leave = (_s.leaves || []).some(l => new Date(l).toDateString() === _d.toDateString());
          if (_leave || !_slot) return res.status(400).json({ message: 'Doctor not available on this date' });
        }
      }
    } catch (_e) { console.error('schedule check failed:', _e.message); }
    const appt = await Appointment.create({...req.body, tokenNo: count+1});
      // notify patient: appointment confirmed
      try {
        sendMail(appt.patientEmail, 'Appointment Confirmed',
          '<p>Dear ' + (appt.patientName || 'Patient') + ',</p>' +
          '<p>Your appointment with <b>' + (appt.doctorName || appt.doctor || 'Doctor') + '</b> on <b>' + (appt.date || '') + '</b>' +
          (appt.time ? ' at <b>' + appt.time + '</b>' : '') + ' is confirmed.</p>' +
          '<p>Please arrive 15 minutes early.</p>');
      } catch (_e2) { console.error('appointment mail failed:', _e2.message); }
    req.app = req.app || {};
    res.status(201).json(appt);
  }catch(e){ res.status(500).json({message:e.message}); }
});
router.get('/doctor/:doctorId', protect, async (req,res)=>{
  const list = await Appointment.find({doctor: req.params.doctorId}).populate('patient').sort({tokenNo:1});
  res.json(list);
});
router.patch('/:id/status', protect, async (req,res)=>{
  const updated = await Appointment.findByIdAndUpdate(req.params.id, {status: req.body.status}, {new:true});
  res.json(updated);
});

router.get('/', protect, async (req,res)=>{
  try{
    const list = await Appointment.find().populate('patient').populate('doctor').sort({date:-1});
    res.json(list);
  }catch(e){ res.status(500).json({message:e.message}); }
});
module.exports = router;
