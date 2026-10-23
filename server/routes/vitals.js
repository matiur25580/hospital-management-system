const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Vital = require('../models/Vital');

r.get('/', protect, async (req, res) => {
  try { res.json(await Vital.find().sort({ date: -1 }).limit(100)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try {
    const v = await Vital.create(req.body);
    res.status(201).json(v);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
