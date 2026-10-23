const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// GET /api/feedback/summary - averages
r.get('/summary', protect, async (req, res) => {
  try {
    const all = await Feedback.find();
    const cats = ['cleanliness', 'staffBehavior', 'doctorCare', 'waitingTime', 'overall'];
    const avg = {};
    cats.forEach(c => {
      const vals = all.map(f => (f.ratings || {})[c]).filter(v => v > 0);
      avg[c] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
    });
    const deptMap = {};
    all.forEach(f => {
      const d = f.department || 'General';
      (deptMap[d] = deptMap[d] || []).push((f.ratings || {}).overall || 0);
    });
    const byDept = Object.entries(deptMap).map(([d, v]) => ({
      department: d, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10, count: v.length
    })).sort((a, b) => b.avg - a.avg);
    res.json({ total: all.length, avg, byDept, pending: all.filter(f => f.status === 'new').length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/feedback
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.department) q.department = req.query.department;
    res.json(await Feedback.find(q).sort({ submittedDate: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try { res.status(201).json(await Feedback.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id', protect, async (req, res) => {
  try { res.json(await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
