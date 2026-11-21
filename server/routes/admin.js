const r = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const LabReport = require('../models/LabReport');
const Prescription = require('../models/Prescription');

// GET /api/admin/stats
r.get('/stats', protect, authorize('Admin'), async (req, res) => {
  try {
    const roles = ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'];
    const counts = {};
    for (const role of roles) counts[role] = await User.countDocuments({ role });
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const todaysAppointments = await Appointment.countDocuments({ date: { $gte: start } });
    const pendingLabs = await LabReport.countDocuments({ status: 'pending' });
    const totalPrescriptions = await Prescription.countDocuments();
    res.json({ counts, todaysAppointments, pendingLabs, totalPrescriptions });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/admin/users?role=Doctor
r.get('/users', protect, authorize('Admin'), async (req, res) => {
  try {
    const q = {};
    if (req.query.role) q.role = req.query.role;
    const users = await User.find(q).select('fullName email uniqueId role').sort({ _id: -1 }).limit(100);
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
});


// GET /api/admin/me (current logged-in user)
r.get('/me', protect, async (req, res) => {
  try {
    const uid = req.user.id || req.user._id || req.user.userId;
    const u = await User.findById(uid).select('fullName email uniqueId role');
    res.json(u);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
