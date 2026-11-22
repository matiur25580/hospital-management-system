const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const PatientCase = require('../models/PatientCase');
const Bed = require('../models/Bed');

let Appointment = null;
try { Appointment = require('../models/Appointment'); } catch (e) { /* optional */ }

// GET /api/analytics/overview
r.get('/overview', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: d.toLocaleDateString('en-US', { month: 'short' }) });
    }

    const [revAgg, caseAgg, topDiseases, payStatus, bedAgg, revTotals, caseCount, patientEmails] = await Promise.all([
      Payment.aggregate([
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, billed: { $sum: '$totalAmount' }, collected: { $sum: '$paidAmount' } } }
      ]),
      PatientCase.aggregate([
        { $group: { _id: { y: { $year: '$submittedAt' }, m: { $month: '$submittedAt' } }, count: { $sum: 1 } } }
      ]),
      PatientCase.aggregate([
        { $match: { disease: { $ne: null } } },
        { $group: { _id: '$disease', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      Payment.aggregate([
        { $group: { _id: '$status', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Bed.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $group: { _id: null, billed: { $sum: '$totalAmount' }, collected: { $sum: '$paidAmount' } } }
      ]),
      PatientCase.countDocuments(),
      PatientCase.distinct('patientEmail')
    ]);

    const revMap = {};
    revAgg.forEach(x => { revMap[x._id.y + '-' + x._id.m] = x; });
    const caseMap = {};
    caseAgg.forEach(x => { if (x._id && x._id.y) caseMap[x._id.y + '-' + x._id.m] = x.count; });

    const monthlyRevenue = months.map(mm => ({
      month: mm.label,
      billed: (revMap[mm.y + '-' + mm.m] || {}).billed || 0,
      collected: (revMap[mm.y + '-' + mm.m] || {}).collected || 0
    }));
    const monthlyCases = months.map(mm => ({ month: mm.label, count: caseMap[mm.y + '-' + mm.m] || 0 }));

    const rt = revTotals[0] || { billed: 0, collected: 0 };
    const revenue = { billed: rt.billed, collected: rt.collected, due: rt.billed - rt.collected };

    const beds = { total: 0, available: 0, occupied: 0, maintenance: 0 };
    bedAgg.forEach(x => { if (beds[x._id] !== undefined) beds[x._id] = x.count; beds.total += x.count; });

    let doctorLoad = [], apptCount = 0;
    if (Appointment) {
      doctorLoad = await Appointment.aggregate([
        { $group: { _id: { $ifNull: ['$doctorName', '$doctorEmail'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]);
      apptCount = await Appointment.countDocuments();
    }

    res.json({
      revenue,
      paymentStatus: payStatus.map(p => ({ status: p._id, total: p.total, count: p.count })),
      monthlyRevenue,
      monthlyCases,
      topDiseases: topDiseases.map(x => ({ disease: x._id || 'Unknown', count: x.count })),
      doctorLoad: doctorLoad.map(x => ({ doctor: x._id || 'Unknown', count: x.count })),
      beds,
      totals: { cases: caseCount, patients: patientEmails.length, appointments: apptCount }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
