const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const Dispense = require('../models/Dispense');

// GET /api/pharmacy (?q= search, ?low=true)
r.get('/', protect, async (req, res) => {
  try {
    let list = await Medicine.find().sort({ name: 1 });
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || (m.genericName || '').toLowerCase().includes(q));
    }
    if (req.query.low === 'true') list = list.filter(m => m.quantity <= m.minStock);
    res.json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/pharmacy -> add medicine
r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Medicine.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/pharmacy/:id -> update (stock adjust)
r.patch('/:id', protect, async (req, res) => {
  try { res.json(await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// DELETE /api/pharmacy/:id
r.delete('/:id', protect, async (req, res) => {
  try { await Medicine.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// POST /api/pharmacy/:id/dispense -> give medicine to patient (stock never goes negative)
r.post('/:id/dispense', protect, async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    const qty = Number(req.body.quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });
    if (qty > med.quantity) return res.status(400).json({ message: 'Only ' + med.quantity + ' in stock' });
    med.quantity -= qty;
    await med.save();
    const rec = await Dispense.create({
      medicineId: med._id, medicineName: med.name, quantity: qty,
      patientName: req.body.patientName, patientEmail: req.body.patientEmail,
      caseId: req.body.caseId, dispensedBy: req.body.dispensedBy
    });
    res.json({ medicine: med, record: rec });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/pharmacy/dispensed (?patientEmail=) -> dispense history
r.get('/dispensed', protect, async (req, res) => {
  try {
    const q = req.query.patientEmail ? { patientEmail: req.query.patientEmail } : {};
    res.json(await Dispense.find(q).sort({ date: -1 }).limit(50));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
