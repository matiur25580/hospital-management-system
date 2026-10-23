const r = require('express').Router();
const { protect } = require('../middleware/auth');
const InsuranceClaim = require('../models/InsuranceClaim');

// GET /api/insurance/summary
r.get('/summary', protect, async (req, res) => {
  try {
    const all = await InsuranceClaim.find();
    const byStatus = {};
    let totalClaimed = 0, totalApproved = 0, totalSettled = 0;
    const schemeMap = {};
    all.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      totalClaimed += Number(c.claimAmount) || 0;
      if (['approved', 'settled'].includes(c.status)) totalApproved += Number(c.claimAmount) || 0;
      if (c.status === 'settled') totalSettled += Number(c.claimAmount) || 0;
      const s = c.scheme || 'swasthya-sathi';
      schemeMap[s] = schemeMap[s] || { scheme: s, count: 0, claimed: 0 };
      schemeMap[s].count++;
      schemeMap[s].claimed += Number(c.claimAmount) || 0;
    });
    res.json({ total: all.length, byStatus, totalClaimed, totalApproved, totalSettled, byScheme: Object.values(schemeMap) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/insurance (?status=, ?scheme=, ?patientEmail=)
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.scheme) q.scheme = req.query.scheme;
    if (req.query.patientEmail) q.patientEmail = req.query.patientEmail;
    res.json(await InsuranceClaim.find(q).sort({ createdAt: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/insurance
r.post('/', protect, async (req, res) => {
  try {
    const n = await InsuranceClaim.countDocuments();
    const claimNo = 'CLM-' + new Date().getFullYear() + '-' + String(n + 1).padStart(4, '0');
    const claim = await InsuranceClaim.create({
      ...req.body, claimNo,
      statusHistory: [{ status: 'draft', date: new Date(), remarks: 'Claim created', by: req.body.handledBy || '' }]
    });
    res.status(201).json(claim);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/insurance/:id/status
r.patch('/:id/status', protect, async (req, res) => {
  try {
    const c = await InsuranceClaim.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    c.status = req.body.status;
    c.statusHistory.push({ status: req.body.status, date: new Date(), remarks: req.body.remarks || '', by: req.body.by || '' });
    if (req.body.remarks) c.remarks = req.body.remarks;
    await c.save();
    res.json(c);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
