const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Authenticated directory: expose only fields needed to identify and contact a doctor.
router.get('/', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'Doctor' })
      .select('name email role')
      .sort({ name: 1 })
      .limit(200);
    res.json(doctors);
  } catch (e) { res.status(500).json({ message: 'Could not load doctor directory.' }); }
});

module.exports = router;
