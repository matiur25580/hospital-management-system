const r = require('express').Router();
const { protect } = require('../middleware/auth');
const VisitorPass = require('../models/VisitorPass');
const GatePassCounter = require('../models/GatePassCounter');

const canManage = user => Boolean(user && ['Admin', 'Receptionist'].includes(user.role));
const emailOf = user => String(user && user.email || '').trim().toLowerCase();
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(value + 'T00:00:00').getTime());
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

r.get('/', protect, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ message: 'Receptionist or Admin access required' });
    const q = {};
    if (req.query.date) {
      if (!validDate(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
      const start = new Date(req.query.date + 'T00:00:00');
      const end = new Date(start); end.setDate(end.getDate() + 1);
      q.checkIn = { $gte: start, $lt: end };
    }
    if (req.query.status) {
      if (!['checked-in', 'checked-out'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid pass status' });
      q.status = req.query.status;
    }
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 80)), 'i');
      q.$or = [{ visitorName: rx }, { phone: rx }, { passNo: rx }];
    }
    res.json(await VisitorPass.find(q).sort({ checkIn: -1 }).limit(200));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ message: 'Receptionist or Admin access required' });
    const body = req.body || {};
    const { visitorName, phone, idProofType, idProofNo, purpose, patientName, personToMeet, department, vehicleNo, gateNo } = body;
    if (!String(visitorName || '').trim() || !/^\+?[0-9 ()-]{7,20}$/.test(String(phone || '').trim()) || !['patient-visit', 'doctor-meet', 'vendor', 'interview', 'delivery', 'other'].includes(purpose)) {
      return res.status(400).json({ message: 'Valid visitor name, phone and purpose are required' });
    }
    const year = new Date().getFullYear();
    const latest = await VisitorPass.findOne({ passNo: new RegExp('^GP-' + year + '-') }).sort({ passNo: -1 }).select('passNo');
    const existingSequence = latest ? Number(String(latest.passNo).split('-').pop()) || 0 : 0;
    try {
      await GatePassCounter.updateOne({ year }, { $setOnInsert: { year, sequence: existingSequence } }, { upsert: true });
    } catch (error) { if (error.code !== 11000) throw error; }
    const counter = await GatePassCounter.findOneAndUpdate({ year }, { $inc: { sequence: 1 } }, { new: true });
    const passNo = 'GP-' + year + '-' + String(counter.sequence).padStart(4, '0');
    const pass = await VisitorPass.create({
      passNo, visitorName: String(visitorName).trim().slice(0, 160), phone: String(phone).trim(),
      idProofType: String(idProofType || '').slice(0, 40), idProofNo: String(idProofNo || '').slice(0, 80),
      purpose, patientName: String(patientName || '').slice(0, 160), personToMeet: String(personToMeet || '').slice(0, 160),
      department: String(department || '').slice(0, 120), vehicleNo: String(vehicleNo || '').slice(0, 40),
      gateNo: String(gateNo || '').slice(0, 40), issuedBy: emailOf(req.user), status: 'checked-in'
    });
    res.status(201).json(pass);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id/checkout', protect, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ message: 'Receptionist or Admin access required' });
    const pass = await VisitorPass.findOneAndUpdate(
      { _id: req.params.id, status: 'checked-in' },
      { $set: { status: 'checked-out', checkOut: new Date() } },
      { new: true }
    );
    if (!pass) return res.status(409).json({ message: 'Pass not found or already checked out' });
    res.json(pass);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
