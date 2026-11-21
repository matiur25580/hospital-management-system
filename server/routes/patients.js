const express = require('express');
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { canReadPatientList, canReadPatient } = require('../utils/patientAccess');
const router = express.Router();

router.post('/', protect, authorize('Admin', 'Receptionist'), async (req, res) => {
  try {
    const { name, age, gender, phone, address, bloodGroup, emergencyContact, email } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 120
      || typeof phone !== 'string' || !phone.trim() || phone.trim().length > 30) {
      return res.status(400).json({ message: 'Patient name and contact number are required.' });
    }
    if (email !== undefined && email !== '' && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
      return res.status(400).json({ message: 'Enter a valid patient email address.' });
    }
    if (age !== undefined && age !== '' && (!Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 130)) {
      return res.status(400).json({ message: 'Patient age must be between 0 and 130.' });
    }
    if (gender !== undefined && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ message: 'Select a valid patient gender.' });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const linkedUser = normalizedEmail
      ? await User.findOne({ email: normalizedEmail, role: 'Patient' }).select('_id')
      : null;
    if (normalizedEmail) {
      const existing = await Patient.findOne({ email: normalizedEmail });
      if (existing) {
        if (linkedUser && existing.userId && String(existing.userId) !== String(linkedUser._id)) {
          return res.status(409).json({ message: 'This patient profile is linked to another account.' });
        }
        if (linkedUser && !existing.userId) {
          existing.userId = linkedUser._id;
          await existing.save();
        }
        return res.status(200).json(existing);
      }
    }
    if (linkedUser && await Patient.exists({ userId: linkedUser._id })) {
      return res.status(409).json({ message: 'A patient profile is already linked to this account.' });
    }

    const count = await Patient.countDocuments();
    const patientId = 'P' + String(count + 1).padStart(5, '0');
    const patient = await Patient.create({
      patientId,
      userId: linkedUser?._id,
      email: normalizedEmail || undefined,
      name: name.trim(),
      age: age === undefined || age === '' ? undefined : Number(age),
      gender,
      phone: phone.trim(),
      address: typeof address === 'string' ? address.trim().slice(0, 500) : undefined,
      bloodGroup: typeof bloodGroup === 'string' ? bloodGroup.trim().slice(0, 10) : undefined,
      emergencyContact: typeof emergencyContact === 'string' ? emergencyContact.trim().slice(0, 30) : undefined,
    });
    res.status(201).json(patient);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A patient profile with these details already exists.' });
    res.status(400).json({ message: 'Could not create patient profile.' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    if (!canReadPatientList(req.user)) {
      return res.status(403).json({ message: 'Access denied: insufficient role.' });
    }
    if (req.user.role === 'Patient') {
      const patients = await Patient.find({ userId: req.user.id }).sort({ createdAt: -1 });
      return res.json(patients);
    }
    const patients = await Patient.find().sort({ createdAt: -1 }).limit(1000);
    return res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Could not load patient records.' });
  }
});

router.get('/:id', protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid patient ID.' });
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    if (!canReadPatient(req.user, patient)) {
      return res.status(403).json({ message: 'Access denied: insufficient role.' });
    }
    return res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Could not load patient record.' });
  }
});

router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid patient ID.' });
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json({ message: 'Patient deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete patient record.' });
  }
});

module.exports = router;
