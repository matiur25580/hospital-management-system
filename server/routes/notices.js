const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Notice = require('../models/Notice');

const STAFF_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
const actorEmail = user => String(user && user.email || '').trim().toLowerCase();
const validDate = value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + 'T00:00:00').getTime()));

r.get('/', protect, async (req, res) => {
  try {
    if (!req.user || !STAFF_ROLES.has(req.user.role)) return res.status(403).json({ message: 'Staff access required' });
    const all = await Notice.find().sort({ createdAt: -1 }).limit(100);
    if (req.query.all && req.user.role === 'Admin') return res.json(all);
    const today = new Date().toISOString().slice(0, 10);
    res.json(all.filter(n => !n.validUntil || n.validUntil >= today));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const { title, message, category, priority, validUntil } = req.body || {};
    if (!String(title || '').trim() || !String(message || '').trim() || !['general', 'emergency', 'event', 'holiday'].includes(category) || !['normal', 'high'].includes(priority) || !validDate(validUntil)) {
      return res.status(400).json({ message: 'Valid notice details are required' });
    }
    const notice = await Notice.create({
      title: String(title).trim().slice(0, 160), message: String(message).trim().slice(0, 5000),
      category, priority, validUntil: validUntil || '', postedBy: actorEmail(req.user)
    });
    res.status(201).json(notice);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.delete('/:id', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
