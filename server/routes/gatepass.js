const r = require('express').Router();
const { protect } = require('../middleware/auth');
const VisitorPass = require('../models/VisitorPass');

// GET /api/gatepass (?date=YYYY-MM-DD, ?status=, ?q=)
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.date) {
      const d = req.query.date;
      q.checkIn = { $gte: new Date(d + 'T00:00:00'), $lte: new Date(d + 'T23:59:59') };
    }
    if (req.query.status) q.status = req.query.status;
    if (req.query.q) {
      const rx = new RegExp(req.query.q, 'i');
      q.$or = [{ visitorName: rx }, { phone: rx }, { passNo: rx }];
    }
    res.json(await VisitorPass.find(q).sort({ checkIn: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/gatepass - issue pass
r.post('/', protect, async (req, res) => {
  try {
    const n = await VisitorPass.countDocuments();
    const passNo = 'GP-' + new Date().getFullYear() + '-' + String(n + 1).padStart(4, '0');
    res.status(201).json(await VisitorPass.create({ ...req.body, passNo }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/gatepass/:id/checkout
r.patch('/:id/checkout', protect, async (req, res) => {
  try {
    res.json(await VisitorPass.findByIdAndUpdate(req.params.id, { status: 'checked-out', checkOut: new Date() }, { new: true }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
