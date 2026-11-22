const r = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { ensurePatientProfile } = require('../utils/patientProfile');
const { sendOtpEmail } = require('../utils/mailer');
const signToken = (u) => jwt.sign({ id: u._id, role: u.role, email: u.email }, process.env.JWT_SECRET, { expiresIn: '8h' });

// LOGIN
r.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const identifier = String(email || '').trim();
    const invalidCredentials = () => res.status(401).json({ message: 'Invalid email or password' });
    if (!identifier || !password) return invalidCredentials();
    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { uniqueId: identifier.toUpperCase() }] });
    if (!user || !(await user.compare(password)) || (role && user.role !== role)) return invalidCredentials();
    res.json({ message: 'Login successful', token: signToken(user),
      user: { id: user._id, name: user.name || user.fullName, email: user.email, role: user.role, uniqueId: user.uniqueId } });
  } catch (e) { next(e); }
});

// SEND OTP
r.post('/send-otp', async (req, res, next) => {
  try {
    const { email, purpose } = req.body || {};
    if (typeof email !== 'string' || !email.trim() || !['register', 'reset'].includes(purpose))
      return res.status(400).json({ message: 'Email and valid purpose required' });
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    const genericMessage = 'If this email is eligible, an OTP will be sent.';
    if ((purpose === 'register' && exists) || (purpose === 'reset' && !exists))
      return res.json({ message: genericMessage });
    await Otp.deleteMany({ email: normalizedEmail, purpose });
    const otp = String(crypto.randomInt(100000, 1000000));
    await Otp.create({ email: normalizedEmail, otp, purpose });
    await sendOtpEmail(normalizedEmail, otp, purpose);
    res.json({ message: genericMessage });
  } catch (e) { next(e); }
});

// VERIFY + REGISTER
r.post('/verify-register', async (req, res, next) => {
  try {
    const { name, mobile, email, dob, password, otp, role: reqRole } = req.body;
    if (!name || !mobile || !email || !dob || !password || !otp)
      return res.status(400).json({ message: 'All fields are mandatory' });
    if (reqRole && reqRole !== 'Patient') {
      return res.status(403).json({ message: 'Public registration is limited to Patient accounts. Staff accounts must be provisioned by an administrator.' });
    }
    const rec = await Otp.findOne({ email, purpose: 'register' }).sort({ createdAt: -1 });
    if (!rec || rec.otp !== String(otp))
      return res.status(400).json({ message: 'Invalid OTP' });
    if (rec && Date.now() - new Date(rec.createdAt).getTime() > 3 * 60 * 1000) {
      await Otp.deleteMany({ email, purpose: 'register' });
      return res.status(400).json({ message: 'OTP expired. Please resend OTP.' });
    }
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'This email already registered, plz login' });
    const role = 'Patient';
    const parts = String(name).trim().split(/\s+/);
    const fi = ((parts[0] && parts[0][0]) || 'X').toUpperCase();
    const li = (parts.length > 1 && parts[parts.length-1][0] ? parts[parts.length-1][0] : 'X').toUpperCase();
    const base = (role[0] + fi + li + dob).toUpperCase();
    let uniqueId = base, i = 1;
    while (await User.findOne({ uniqueId })) uniqueId = base + (i++);
    const user = await User.create({ name, mobile, email, dob, password, role, uniqueId });
    try {
      await ensurePatientProfile(user, mobile);
    } catch (profileError) {
      await User.deleteOne({ _id: user._id });
      throw profileError;
    }
    await Otp.deleteMany({ email, purpose: 'register' });
    res.status(201).json({ message: 'Registration successful', uniqueId,
      user: { id: user._id, name: user.fullName, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

// RESET PASSWORD
r.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'All fields are mandatory' });
    const rec = await Otp.findOne({ email, purpose: 'reset' }).sort({ createdAt: -1 });
    if (!rec || rec.otp !== String(otp))
      return res.status(400).json({ message: 'Invalid OTP' });
    if (rec && Date.now() - new Date(rec.createdAt).getTime() > 3 * 60 * 1000) {
      await Otp.deleteMany({ email, purpose: 'reset' });
      return res.status(400).json({ message: 'OTP expired. Please resend OTP.' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "This email doesn't exist, plz register first" });
    if (await user.compare(newPassword)) return res.status(400).json({ message: 'This is your current password. Please enter a different password.' });
    user.password = newPassword;
    await user.save();
    await Otp.deleteMany({ email, purpose: 'reset' });
    res.json({ message: 'Password changed successfully' });
  } catch (e) { next(e); }
});

module.exports = r;
