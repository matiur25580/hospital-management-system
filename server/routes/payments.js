const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');

// GET /api/payments (?patientEmail=)
r.get('/', protect, async (req, res) => {
  try {
    const q = req.query.patientEmail ? { patientEmail: req.query.patientEmail } : {};
    res.json(await Payment.find(q).sort({ createdAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/payments/:id/pay -> record a payment (partial allowed, never over due)
r.patch('/:id/pay', protect, async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Bill not found' });
    const amt = Number(req.body.amount) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const due = p.totalAmount - p.paidAmount;
    if (amt > due) return res.status(400).json({ message: 'Amount exceeds due (Rs. ' + due + ')' });
    p.payments.push({ amount: amt, method: req.body.method || 'cash', receivedBy: req.body.receivedBy });
    p.paidAmount += amt;
    p.status = p.paidAmount >= p.totalAmount ? 'paid' : 'partial';
    await p.save();
    res.json(p);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
