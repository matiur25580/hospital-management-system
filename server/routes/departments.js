const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Department = require('../models/Department');

// GET /api/departments - hospital directory (public)
r.get('/', protect, async (req, res) => {
  try { res.json(await Department.find().sort({ code: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/departments/:code
r.get('/:code', protect, async (req, res) => {
  try {
    const d = await Department.findOne({ code: req.params.code.toUpperCase() });
    if (!d) return res.status(404).json({ message: 'Department not found' });
    res.json(d);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
