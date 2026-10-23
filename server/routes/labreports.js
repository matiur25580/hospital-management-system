const r = require('express').Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const LabReport = require('../models/LabReport');
const { sendMail } = require('../utils/notify');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

r.get('/', protect, async (req, res) => {
  try {
    const q = req.query.patientEmail ? { patientEmail: req.query.patientEmail } : {};
    res.json(await LabReport.find(q).sort({ date: -1 }).limit(50));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.fileUrl = '/uploads/' + req.file.filename;
    const l = await LabReport.create(data);
      // notify patient: lab report ready
      try {
        sendMail(l.patientEmail || l.email, 'Lab Report Ready',
          '<p>Dear ' + (l.patientName || 'Patient') + ',</p>' +
          '<p>Your lab report <b>' + (l.title || l.testName || l.name || 'Lab Report') + '</b> is ready.</p>' +
          '<p>View it in the patient portal.</p>');
      } catch (_e3) { console.error('lab mail failed:', _e3.message); }
    res.status(201).json(l);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/:id', protect, async (req, res) => {
  try {
    const l = await LabReport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(l);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = r;
