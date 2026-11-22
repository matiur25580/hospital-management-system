const r = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');
const { clinicalRoles } = require('../utils/patientAccess');
const { canReadLabReportFile } = require('../utils/labReportFileAccess');

const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
});
const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only PDF, JPEG and PNG attachments are supported.');
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  }
});

r.get('/', protect, async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'Patient') filter = { patientEmail: req.user.email };
    else if (clinicalRoles.includes(req.user.role)) filter = req.query.patientEmail ? { patientEmail: String(req.query.patientEmail).trim().toLowerCase() } : {};
    else return res.status(403).json({ message: 'Access denied.' });
    res.json(await LabReport.find(filter).sort({ createdAt: -1 }).limit(50));
  } catch (e) { res.status(500).json({ message: 'Could not load lab reports.' }); }
});

// Attachments are served only after checking the authenticated user's patient scope or clinical role.
r.get('/files/:filename', protect, async (req, res) => {
  try {
    const filename = req.params.filename;
    if (filename !== path.basename(filename) || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ message: 'Invalid attachment name.' });
    }
    const fileUrl = '/api/lab-reports/files/' + filename;
    const report = await LabReport.findOne({ fileUrl }).select('patientEmail fileUrl');
    if (!report) return res.status(404).json({ message: 'Lab report attachment not found.' });
    if (!canReadLabReportFile(req.user, report)) return res.status(403).json({ message: 'Access denied.' });
    return res.sendFile(filename, { root: UPLOAD_DIR }, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode === 404 ? 404 : 500).json({ message: 'Could not load lab report attachment.' });
    });
  } catch (e) { return res.status(500).json({ message: 'Could not load lab report attachment.' }); }
});

r.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!['Admin', 'Doctor', 'Nurse'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
    const patientEmail = String(req.body.patientEmail || '').trim().toLowerCase();
    if (!patientEmail || !await Patient.exists({ email: patientEmail })) return res.status(404).json({ message: 'Patient profile not found.' });
    const data = { ...req.body, patientEmail };
    if (req.file) data.fileUrl = '/api/lab-reports/files/' + req.file.filename;
    delete data.reviewedBy;
    const l = await LabReport.create(data);
    res.status(201).json(l);
  } catch (e) { res.status(400).json({ message: 'Could not create lab report.' }); }
});

r.patch('/:id', protect, async (req, res) => {
  try {
    if (!['Admin', 'Doctor'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
    const allowed = {};
    for (const key of ['status', 'reviewNote', 'isCritical']) if (req.body[key] !== undefined) allowed[key] = req.body[key];
    if (req.user.role === 'Doctor') allowed.reviewedBy = req.user.email;
    const l = await LabReport.findByIdAndUpdate(req.params.id, { $set: allowed }, { new: true, runValidators: true });
    if (!l) return res.status(404).json({ message: 'Lab report not found.' });
    res.json(l);
  } catch (e) { res.status(400).json({ message: 'Could not update lab report.' }); }
});

r.delete('/:id', protect, async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Only administrators can delete lab reports.' });
  try {
    const l = await LabReport.findByIdAndDelete(req.params.id);
    if (!l) return res.status(404).json({ message: 'Lab report not found.' });
    res.json({ message: 'Lab report deleted.' });
  } catch (e) { res.status(500).json({ message: 'Could not delete lab report.' }); }
});

r.get('/stats/summary', protect, async (req, res) => {
  if (!['Admin', 'Doctor', 'Nurse'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied.' });
  try {
    const [pending, reviewed, retest, critical] = await Promise.all([
      LabReport.countDocuments({ status: 'pending' }),
      LabReport.countDocuments({ status: 'reviewed' }),
      LabReport.countDocuments({ status: 'retest' }),
      LabReport.countDocuments({ isCritical: true, status: 'pending' })
    ]);
    res.json({ pending, reviewed, retest, critical });
  } catch (e) { res.status(500).json({ message: 'Could not load lab report statistics.' }); }
});
module.exports = r;
