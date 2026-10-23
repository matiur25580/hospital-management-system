const r = require('express').Router();
const { protect } = require('../middleware/auth');
const LabCatalog = require('../models/LabCatalog');
const LabOrder = require('../models/LabOrder');

const DEFAULT_TESTS = [
  { code: 'CBC', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 350, sampleType: 'Blood', normalRange: 'As per age/sex', tatHours: 4 },
  { code: 'BSR', name: 'Blood Sugar (Random)', category: 'Biochemistry', price: 120, sampleType: 'Blood', normalRange: '70-140 mg/dL', tatHours: 2 },
  { code: 'HBA1C', name: 'HbA1c', category: 'Biochemistry', price: 450, sampleType: 'Blood', normalRange: '< 5.7%', tatHours: 6 },
  { code: 'LIPID', name: 'Lipid Profile', category: 'Biochemistry', price: 600, sampleType: 'Blood (fasting)', normalRange: 'See report', tatHours: 6 },
  { code: 'LFT', name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 550, sampleType: 'Blood', normalRange: 'See report', tatHours: 6 },
  { code: 'KFT', name: 'Kidney Function Test (KFT)', category: 'Biochemistry', price: 550, sampleType: 'Blood', normalRange: 'See report', tatHours: 6 },
  { code: 'TSH', name: 'Thyroid (TSH)', category: 'Hormone', price: 400, sampleType: 'Blood', normalRange: '0.4-4.0 mIU/L', tatHours: 8 },
  { code: 'URINE', name: 'Urine Routine (RE)', category: 'Pathology', price: 200, sampleType: 'Urine', normalRange: 'See report', tatHours: 3 },
  { code: 'DENGUE', name: 'Dengue NS1 Antigen', category: 'Serology', price: 650, sampleType: 'Blood', normalRange: 'Negative', tatHours: 4 },
  { code: 'WIDAL', name: 'Widal Test', category: 'Serology', price: 300, sampleType: 'Blood', normalRange: 'Negative', tatHours: 4 },
  { code: 'ECG', name: 'ECG (12-lead)', category: 'Cardiology', price: 250, sampleType: '-', normalRange: 'Normal sinus rhythm', tatHours: 1 },
  { code: 'XRAY', name: 'X-Ray Chest', category: 'Radiology', price: 400, sampleType: '-', normalRange: 'See report', tatHours: 2 },
  { code: 'USG', name: 'Ultrasound (USG)', category: 'Radiology', price: 800, sampleType: '-', normalRange: 'See report', tatHours: 2 }
];

// GET /api/lab/catalog (auto-seeds defaults)
r.get('/catalog', protect, async (req, res) => {
  try {
    let c = await LabCatalog.find().sort({ category: 1, name: 1 });
    if (!c.length) c = await LabCatalog.insertMany(DEFAULT_TESTS);
    res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/catalog', protect, async (req, res) => {
  try { res.status(201).json(await LabCatalog.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/lab/orders (?patientEmail=, ?status=)
r.get('/orders', protect, async (req, res) => {
  try {
    const q = {};
    if (req.query.patientEmail) q.patientEmail = req.query.patientEmail;
    if (req.query.status) q.status = req.query.status;
    res.json(await LabOrder.find(q).sort({ orderDate: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/orders', protect, async (req, res) => {
  try { res.status(201).json(await LabOrder.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/lab/orders/:id/collect
r.patch('/orders/:id/collect', protect, async (req, res) => {
  try {
    res.json(await LabOrder.findByIdAndUpdate(req.params.id,
      { status: 'sample-collected', collectedBy: req.body.collectedBy }, { new: true }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/lab/orders/:id/report { results: [{code, result, flag}], reportedBy }
r.patch('/orders/:id/report', protect, async (req, res) => {
  try {
    const o = await LabOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ message: 'Not found' });
    (req.body.results || []).forEach(rv => {
      const tc = o.tests.find(t => t.code === rv.code);
      if (tc) { tc.result = rv.result; tc.flag = rv.flag || 'normal'; }
    });
    const allDone = o.tests.length > 0 && o.tests.every(tc => tc.result && tc.result.trim() !== '');
    o.status = allDone ? 'reported' : 'in-progress';
    if (allDone) { o.reportedBy = req.body.reportedBy; o.reportedAt = new Date(); }
    await o.save();
    res.json(o);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
