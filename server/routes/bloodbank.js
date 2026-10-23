const r = require('express').Router();
const { protect } = require('../middleware/auth');
const BloodStock = require('../models/BloodStock');
const BloodRequest = require('../models/BloodRequest');

const DEFAULT_STOCK = [
  { bloodGroup: 'A+', units: 12 }, { bloodGroup: 'A-', units: 4 },
  { bloodGroup: 'B+', units: 14 }, { bloodGroup: 'B-', units: 3 },
  { bloodGroup: 'AB+', units: 6 }, { bloodGroup: 'AB-', units: 2 },
  { bloodGroup: 'O+', units: 16 }, { bloodGroup: 'O-', units: 5 }
];
const GROUP_ORDER = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// GET /api/bloodbank/stock (auto-seeds default stock on first call)
r.get('/stock', protect, async (req, res) => {
  try {
    let stock = await BloodStock.find();
    if (!stock.length) stock = await BloodStock.insertMany(DEFAULT_STOCK);
    stock.sort((a, b) => GROUP_ORDER.indexOf(a.bloodGroup) - GROUP_ORDER.indexOf(b.bloodGroup));
    res.json(stock);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/bloodbank/stock { bloodGroup, units } - restock (adds units)
r.post('/stock', protect, async (req, res) => {
  try {
    const s = await BloodStock.findOneAndUpdate(
      { bloodGroup: req.body.bloodGroup },
      { $inc: { units: Number(req.body.units) || 0 } },
      { new: true, upsert: true }
    );
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/bloodbank/requests (?status=)
r.get('/requests', protect, async (req, res) => {
  try {
    const q = req.query.status ? { status: req.query.status } : {};
    res.json(await BloodRequest.find(q).sort({ date: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/bloodbank/requests - new blood request
r.post('/requests', protect, async (req, res) => {
  try { res.status(201).json(await BloodRequest.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/bloodbank/requests/:id - fulfill (deducts stock) / reject
r.patch('/requests/:id', protect, async (req, res) => {
  try {
    const rq = await BloodRequest.findById(req.params.id);
    if (!rq) return res.status(404).json({ message: 'Not found' });
    if (req.body.status === 'fulfilled') {
      const s = await BloodStock.findOne({ bloodGroup: rq.bloodGroup });
      if (!s || s.units < rq.units) return res.status(400).json({ message: 'Not enough stock for ' + rq.bloodGroup });
      s.units -= rq.units;
      await s.save();
    }
    rq.status = req.body.status;
    await rq.save();
    res.json(rq);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
