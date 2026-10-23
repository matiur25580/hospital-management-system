const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const Dispense = require('../models/Dispense');

// GET /api/pharmacy (?lowStock=true)
r.get('/', protect, async (req, res) => {
  try {
    let list = await Medicine.find().sort({ name: 1 });
    if (req.query.lowStock === 'true') list = list.filter(m => m.quantity <= m.minStock);
    res.json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/pharmacy -> add medicine
r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Medicine.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/pharmacy/:id -> update medicine
r.patch('/:id', protect, async (req, res) => {
  try { res.json(await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/pharmacy/:id
r.delete('/:id', protect, async (req, res) => {
  try { await Medicine.findByIdAndDelete(req.params.id); res.json({ message: 'deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/pharmacy/:id/dispense -> reduce stock + record
r.post('/:id/dispense', protect, async (req, res) => {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Medicine not found' });
    const qty = Number(req.body.quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });
    if (m.quantity < qty) return res.status(400).json({ message: 'Insufficient stock. Available: ' + m.quantity });
    m.quantity -= qty;
    await m.save();
    const d = await Dispense.create({
      medicineId: m._id, medicineName: m.name, quantity: qty,
      patientName: req.body.patientName, patientEmail: req.body.patientEmail,
      caseId: req.body.caseId, dispensedBy: req.user.email || req.user.name
    });
    res.status(201).json({ medicine: m, dispense: d, lowStock: m.quantity <= m.minStock });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/pharmacy/:id/restock -> add stock
r.post('/:id/restock', protect, async (req, res) => {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Medicine not found' });
    const qty = Number(req.body.quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });
    m.quantity += qty;
    if (req.body.batchNo) m.batchNo = req.body.batchNo;
    if (req.body.expiryDate) m.expiryDate = req.body.expiryDate;
    await m.save();
    res.json(m);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/pharmacy/alerts/low-stock
r.get('/alerts/low-stock', protect, async (req, res) => {
  try {
    const all = await Medicine.find().sort({ quantity: 1 });
    res.json(all.filter(m => m.quantity <= m.minStock));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/pharmacy/alerts/expiry (?days=30)
r.get('/alerts/expiry', protect, async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    res.json(await Medicine.find({ expiryDate: { $lte: cutoff } }).sort({ expiryDate: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/pharmacy/dispenses -> dispense history
r.get('/dispenses/history', protect, async (req, res) => {
  try { res.json(await Dispense.find().sort({ date: -1 }).limit(100)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
