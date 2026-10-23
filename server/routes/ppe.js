/**
 * @swagger
 * tags:
 *   - name: PPE
 *     description: PPE module
 */
const r = require('express').Router();
const { protect } = require('../middleware/auth');
const PPECheck = require('../models/PPECheck');
r.post('/', protect, async (req, res) => {
  try {
    const { personName, personRole, zone, maskWorn, glovesWorn, maskProvided, remarks } = req.body;
    const c = await PPECheck.create({
      personName, personRole, zone,
      maskWorn: !!maskWorn, glovesWorn: !!glovesWorn, maskProvided: !!maskProvided,
      compliant: !!(maskWorn && glovesWorn), remarks,
      checkedBy: (req.user && (req.user.email || req.user.name)) || 'staff'
    });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
r.get('/', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.zone) q.zone = req.query.zone;
    if (req.query.role) q.personRole = req.query.role;
    if (req.query.date) {
      const d = new Date(req.query.date);
      q.createdAt = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    }
    res.json(await PPECheck.find(q).sort({ createdAt: -1 }).limit(200));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
r.get('/summary', protect, async (req, res) => {
  try {
    const day = req.query.date ? new Date(req.query.date) : new Date();
    const q = { createdAt: { $gte: new Date(day.setHours(0,0,0,0)), $lt: new Date(day.setHours(23,59,59,999)) } };
    const total = await PPECheck.countDocuments(q);
    const compliant = await PPECheck.countDocuments({ ...q, compliant: true });
    const masksGiven = await PPECheck.countDocuments({ ...q, maskProvided: true });
    const byZone = await PPECheck.aggregate([{ $match: q }, { $group: { _id: '$zone', total: { $sum: 1 }, ok: { $sum: { $cond: ['$compliant', 1, 0] } } } }]);
    const byRole = await PPECheck.aggregate([{ $match: q }, { $group: { _id: '$personRole', total: { $sum: 1 }, ok: { $sum: { $cond: ['$compliant', 1, 0] } } } }]);
    res.json({ total, compliant, masksGiven, byZone, byRole, rate: total ? Math.round(compliant / total * 100) : 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = r;
