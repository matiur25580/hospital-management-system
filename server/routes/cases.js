const r = require('express').Router();
const { protect } = require('../middleware/auth');
const PatientCase = require('../models/PatientCase');
const Payment = require('../models/Payment');
const { sendMail } = require('../utils/notify');
const { generateCasePdf, generateBillPdf, generateDischargePdf } = require('../utils/casePdf');

// GET /api/cases (?patientEmail= for patient)
r.get('/', protect, async (req, res) => {
  try {
    const q = req.query.patientEmail ? { patientEmail: req.query.patientEmail } : {};
    res.json(await PatientCase.find(q).sort({ submittedAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/cases (patient intake -> auto case PDF)
r.post('/', protect, async (req, res) => {
  try {
    const c = await PatientCase.create(req.body);
    c.pdfUrl = await generateCasePdf(c);
    await c.save();
    res.status(201).json(c);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/cases/:id/notes (doctor/nurse adds description -> PDF regenerates)
r.patch('/:id/notes', protect, async (req, res) => {
  try {
    const c = await PatientCase.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Case not found' });
    c.notes.push({ author: req.body.author, role: req.body.role, text: req.body.text });
    c.pdfUrl = await generateCasePdf(c);
    await c.save();
    res.json(c);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/cases/:id/status (new -> under-treatment -> discharged; discharge auto-generates bill PDF)
r.patch('/:id/status', protect, async (req, res) => {
  try {
    const c = await PatientCase.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Case not found' });
    const { status, billItems, doctorFee } = req.body;
    if (!['new', 'under-treatment', 'discharged'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    c.status = status;
    if (status === 'discharged') {
      c.billItems = billItems || [];
      c.doctorFee = Number(doctorFee) || 0;
      c.dischargedAt = new Date();
      c.billPdfUrl = await generateBillPdf(c);
      c.dischargePdfUrl = await generateDischargePdf(c);
      const itemsTotal = (c.billItems || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
      await Payment.findOneAndUpdate(
        { caseId: c._id },
        { $set: { patientName: c.patientName, patientEmail: c.patientEmail, totalAmount: itemsTotal + (Number(c.doctorFee) || 0) },
          $setOnInsert: { paidAmount: 0, payments: [], status: 'unpaid' } },
        { upsert: true }
      );
      // notify patient: discharged + bill
      try {
        const _it = (c.billItems || []).reduce((sm, it) => sm + (Number(it.amount) || 0), 0);
        const _total = _it + (Number(c.doctorFee) || 0);
        sendMail(c.patientEmail, 'You have been discharged',
          '<p>Dear ' + (c.patientName || 'Patient') + ',</p>' +
          '<p>You have been discharged on ' + new Date().toLocaleString() + '.</p>' +
          '<p>Diagnosis: <b>' + (c.disease || '-') + '</b></p>' +
          '<p>Total bill: <b>Rs. ' + _total + '</b>. Please clear dues at the reception.</p>' +
          '<p>Your discharge summary and bill are available in the patient portal.</p><p>Get well soon!</p>');
      } catch (_e) { console.error('discharge mail failed:', _e.message); }
    }
    c.pdfUrl = await generateCasePdf(c);
    await c.save();
    res.json(c);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
