const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('Admin'), async (req, res) => {
  try {
    const patients = await Patient.countDocuments();
    const doctors = await User.countDocuments({ role: 'Doctor' });
    const appointments = await Appointment.countDocuments();
    res.json({ patients, doctors, appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
