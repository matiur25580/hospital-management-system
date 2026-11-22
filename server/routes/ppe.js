/**
 * @swagger
 * tags:
 *   - name: PPE
 *     description: PPE module
 */
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const PPECheck = require('../models/PPECheck');

const STAFF_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
const ZONES = new Set(['main-gate', 'opd', 'ipd', 'ot', 'lab', 'pharmacy', 'emergency', 'billing']);
const PERSON_ROLES = new Set(['patient', 'attendant', 'doctor', 'nurse', 'receptionist', 'staff', 'other']);
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(value + 'T00:00:00').getTime());
const dayRange = value => {
  const day = new Date((value || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  if (Number.isNaN(day.getTime())) return null;
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

r.post('/', protect, async (req, res) => {
  try {
    if (!req.user || !['Admin', 'Receptionist'].includes(req.user.role)) return res.status(403).json({ message: 'Admin or Receptionist access required' });
    const { personName, personRole, zone, maskWorn, glovesWorn, maskProvided, remarks } = req.body || {};
    if (!String(personName || '').trim() || !PERSON_ROLES.has(personRole) || !ZONES.has(zone) || typeof maskWorn !== 'boolean' || typeof glovesWorn !== 'boolean' || typeof maskProvided !== 'boolean') {
      return res.status(400).json({ message: 'Valid person, role, zone and PPE checks are required' });
    }
    const compliant = maskWorn && glovesWorn;
    const check = await PPECheck.create({
      personName: String(personName).trim().slice(0, 160), personRole, zone,
      maskWorn, glovesWorn, maskProvided, compliant,
      remarks: String(remarks || '').slice(0, 2000),
      checkedBy: String(req.user.email || '').trim().toLowerCase()
    });
    res.status(201).json(check);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

r.get('/', protect, async (req, res) => {
  try {
    if (!req.user || !STAFF_ROLES.has(req.user.role)) return res.status(403).json({ message: 'Staff access required' });
    const q = {};
    if (req.query.zone) {
      if (!ZONES.has(req.query.zone)) return res.status(400).json({ message: 'Invalid zone' });
      q.zone = req.query.zone;
    }
    if (req.query.role) {
      if (!PERSON_ROLES.has(req.query.role)) return res.status(400).json({ message: 'Invalid person role' });
      q.personRole = req.query.role;
    }
    if (req.query.date) {
      if (!validDate(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
      q.createdAt = dayRange(req.query.date);
    }
    res.json(await PPECheck.find(q).sort({ createdAt: -1 }).limit(200));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/summary', protect, async (req, res) => {
  try {
    if (!req.user || !STAFF_ROLES.has(req.user.role)) return res.status(403).json({ message: 'Staff access required' });
    if (req.query.date && !validDate(req.query.date)) return res.status(400).json({ message: 'Invalid date' });
    const q = { createdAt: dayRange(req.query.date) };
    const total = await PPECheck.countDocuments(q);
    const compliant = await PPECheck.countDocuments({ ...q, compliant: true });
    const masksGiven = await PPECheck.countDocuments({ ...q, maskProvided: true });
    const byZone = await PPECheck.aggregate([{ $match: q }, { $group: { _id: '$zone', total: { $sum: 1 }, ok: { $sum: { $cond: ['$compliant', 1, 0] } } } }]);
    const byRole = await PPECheck.aggregate([{ $match: q }, { $group: { _id: '$personRole', total: { $sum: 1 }, ok: { $sum: { $cond: ['$compliant', 1, 0] } } } }]);
    res.json({ total, compliant, masksGiven, byZone, byRole, rate: total ? Math.round(compliant / total * 100) : 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = r;
