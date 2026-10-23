const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Notice = require('../models/Notice');

// GET /api/notices (?all=1 for everything, else active only)
r.get('/', protect, async (req, res) => {
  try {
    const all = await Notice.find().sort({ createdAt: -1 }).limit(100);
    if (req.query.all) return res.json(all);
    const today = new Date().toISOString().slice(0, 10);
    res.json(all.filter(n => !n.validUntil || n.validUntil >= today));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Notice.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.delete('/:id', protect, async (req, res) => {
  try { await Notice.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
