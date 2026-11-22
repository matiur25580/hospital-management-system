const r = require('express').Router();
const { protect } = require('../middleware/auth');
const LabCatalog = require('../models/LabCatalog');
const LabOrder = require('../models/LabOrder');
const Patient = require('../models/Patient');
const { canManageLabCatalog, canReadLabOrders, canCreateLabOrder, canProcessLabOrder } = require('../utils/labAccess');
const { mergeLabResults } = require('../utils/labResultPolicy');

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
  if (!canManageLabCatalog(req.user)) return res.status(403).json({ message: 'Only administrators can manage the lab catalogue.' });
  try {
    const { code, name, category, price, sampleType, normalRange, tatHours } = req.body;
    if (typeof code !== 'string' || !code.trim() || typeof name !== 'string' || !name.trim() ||
        !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Valid test code, name and non-negative price are required.' });
    }
    res.status(201).json(await LabCatalog.create({
      code: code.trim().toUpperCase(), name: name.trim(), category,
      price: Number(price), sampleType, normalRange,
      tatHours: Number.isFinite(Number(tatHours)) && Number(tatHours) > 0 ? Number(tatHours) : 4
    }));
  } catch (e) { res.status(400).json({ message: 'Could not create lab catalogue item.' }); }
});

// GET /api/lab/orders (?patientEmail=, ?status=)
r.get('/orders', protect, async (req, res) => {
  if (!canReadLabOrders(req.user)) return res.status(403).json({ message: 'Access denied.' });
  try {
    const q = {};
    if (req.user.role === 'Patient') {
      const email = String(req.user.email || '').trim().toLowerCase();
      if (!email) return res.status(403).json({ message: 'Patient account is not linked to an email.' });
      q.patientEmail = email;
    } else if (req.query.patientEmail) {
      q.patientEmail = String(req.query.patientEmail).trim().toLowerCase();
    }
    if (req.query.status) {
      const status = String(req.query.status);
      if (!['ordered', 'sample-collected', 'in-progress', 'reported'].includes(status)) {
        return res.status(400).json({ message: 'Invalid lab order status.' });
      }
      q.status = status;
    }
    res.json(await LabOrder.find(q).sort({ orderDate: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: 'Could not load lab orders.' }); }
});

r.post('/orders', protect, async (req, res) => {
  if (!canCreateLabOrder(req.user)) return res.status(403).json({ message: 'Only administrators and doctors can create lab orders.' });
  try {
    const patientEmail = String(req.body.patientEmail || '').trim().toLowerCase();
    const codes = Array.isArray(req.body.tests) ? req.body.tests.map(test => String(test?.code || '').trim().toUpperCase()) : [];
    if (!patientEmail || !codes.length || codes.some(code => !code) || new Set(codes).size !== codes.length) {
      return res.status(400).json({ message: 'A patient email and a non-empty list of unique test codes are required.' });
    }
    const patient = await Patient.findOne({ email: patientEmail });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found.' });
    const catalog = await LabCatalog.find({ code: { $in: codes } });
    if (catalog.length !== codes.length) return res.status(400).json({ message: 'One or more selected lab tests are unavailable.' });
    const byCode = new Map(catalog.map(test => [test.code, test]));
    const tests = codes.map(code => {
      const test = byCode.get(code);
      return { code: test.code, name: test.name, price: test.price, normalRange: test.normalRange };
    });
    const totalAmount = tests.reduce((sum, test) => sum + Number(test.price || 0), 0);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) return res.status(400).json({ message: 'Invalid lab order total.' });
    const order = await LabOrder.create({
      patientName: patient.name, patientEmail, tests, totalAmount,
      orderedBy: req.user.name || req.user.email || 'Clinical staff'
    });
    res.status(201).json(order);
  } catch (e) { res.status(400).json({ message: 'Could not create lab order.' }); }
});

// PATCH /api/lab/orders/:id/collect
r.patch('/orders/:id/collect', protect, async (req, res) => {
  if (!canProcessLabOrder(req.user)) return res.status(403).json({ message: 'Access denied.' });
  try {
    const order = await LabOrder.findOneAndUpdate(
      { _id: req.params.id, status: 'ordered' },
      { $set: { status: 'sample-collected', collectedBy: req.user.name || req.user.email || 'Lab staff' } },
      { new: true, runValidators: true }
    );
    if (!order) {
      if (!await LabOrder.exists({ _id: req.params.id })) return res.status(404).json({ message: 'Lab order not found.' });
      return res.status(409).json({ message: 'Only ordered lab requests can be collected.' });
    }
    res.json(order);
  } catch (e) { res.status(400).json({ message: 'Could not collect lab sample.' }); }
});

// PATCH /api/lab/orders/:id/report { results: [{code, result, flag}], reportedBy }
r.patch('/orders/:id/report', protect, async (req, res) => {
  if (!canProcessLabOrder(req.user)) return res.status(403).json({ message: 'Access denied.' });
  try {
    const order = await LabOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Lab order not found.' });
    if (!['sample-collected', 'in-progress'].includes(order.status)) {
      return res.status(409).json({ message: 'A sample must be collected before results can be reported.' });
    }
    let merged;
    try { merged = mergeLabResults(order.tests, req.body && req.body.results); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    const nextStatus = merged.complete ? 'reported' : 'in-progress';
    const update = { tests: merged.tests, status: nextStatus };
    if (merged.complete) {
      update.reportedBy = req.user.name || req.user.email || 'Lab staff';
      update.reportedAt = new Date();
    }
    const updated = await LabOrder.findOneAndUpdate(
      { _id: order._id, status: order.status },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(409).json({ message: 'Lab order changed concurrently. Refresh and retry.' });
    res.json(updated);
  } catch (e) { res.status(400).json({ message: 'Could not save lab results.' }); }
});
module.exports = r;
