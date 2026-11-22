const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

const categories = ['cleanliness', 'staffBehavior', 'doctorCare', 'waitingTime', 'overall'];
const actorEmail = user => String(user && user.email || '').trim().toLowerCase();

r.get('/summary', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const all = await Feedback.find();
    const avg = {};
    categories.forEach(category => {
      const values = all.map(item => (item.ratings || {})[category]).filter(value => Number.isFinite(value) && value > 0);
      avg[category] = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : 0;
    });
    const deptMap = {};
    all.forEach(item => {
      const department = item.department || 'General';
      (deptMap[department] = deptMap[department] || []).push((item.ratings || {}).overall || 0);
    });
    const byDept = Object.entries(deptMap).map(([department, values]) => ({
      department, avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10, count: values.length
    })).sort((a, b) => b.avg - a.avg);
    res.json({ total: all.length, avg, byDept, pending: all.filter(item => item.status === 'new').length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.get('/', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const q = {};
    if (req.query.status) {
      if (!['new', 'reviewed'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid feedback status' });
      q.status = req.query.status;
    }
    if (req.query.department) q.department = String(req.query.department).slice(0, 120);
    res.json(await Feedback.find(q).sort({ submittedDate: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Patient') return res.status(403).json({ message: 'Only patients can submit feedback' });
    const ratings = req.body && req.body.ratings || {};
    const values = categories.map(category => Number(ratings[category]));
    if (values.some(value => !Number.isInteger(value) || value < 1 || value > 5)) return res.status(400).json({ message: 'All feedback ratings must be integers from 1 to 5' });
    const patient = await User.findById(req.user.id).select('name email role');
    if (!patient || patient.role !== 'Patient') return res.status(401).json({ message: 'Patient account unavailable' });
    const feedback = await Feedback.create({
      patientName: patient.name || '', patientEmail: actorEmail(req.user),
      department: String(req.body.department || '').trim().slice(0, 120),
      doctorName: String(req.body.doctorName || '').trim().slice(0, 160),
      ratings: Object.fromEntries(categories.map((category, index) => [category, values[index]])),
      comments: String(req.body.comments || '').trim().slice(0, 3000), status: 'new'
    });
    res.status(201).json(feedback);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    if (!req.body || req.body.status !== 'reviewed') return res.status(400).json({ message: 'Only review completion is allowed' });
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, status: 'new' },
      { $set: { status: 'reviewed' } },
      { new: true }
    );
    if (!feedback) return res.status(409).json({ message: 'Feedback not found or already reviewed' });
    res.json(feedback);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
