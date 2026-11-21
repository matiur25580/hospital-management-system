const r = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { ensurePatientProfile } = require('../utils/patientProfile');
const { sendOtpEmail } = require('../utils/mailer');
const signToken = (u) => jwt.sign({ id: u._id, role: u.role, email: u.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

// LOGIN (email-exists message soho)
r.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const identifier = String(email || '').trim();
    const user = await User.findOne({ $or: [{ email: identifier }, { uniqueId: identifier.toUpperCase() }] });
    if (!user) return res.status(404).json({ message: "This email doesn't exist, plz register first" });
    const ok = await user.compare(password);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });
    if (role && user.role !== role) return res.status(403).json({ message: `Role mismatch! This account is registered as '${user.role}'. Please select your correct role.` });
    res.json({ message: 'Login successful', token: signToken(user),
      user: { id: user._id, name: user.fullName, email: user.email, role: user.role, uniqueId: user.uniqueId } });
  } catch (e) { next(e); }
});

// SEND OTP
r.post('/send-otp', async (req, res, next) => {
  try {
    const { email, purpose } = req.body
    if (purpose === 'reset') { const _u = await User.findOne({ email: email }); if (!_u) return res.status(404).json({ message: 'Plz enter your registered email address' }); };
    if (!email || !['register', 'reset'].includes(purpose))
      return res.status(400).json({ message: 'Email and valid purpose required' });
    const exists = await User.findOne({ email });
    if (purpose === 'register' && exists)
      return res.status(400).json({ message: 'This email already registered, plz login' });
    if (purpose === 'reset' && !exists)
      return res.status(404).json({ message: "This email doesn't exist, plz register first" });
    await Otp.deleteMany({ email, purpose });
    const otp = String(crypto.randomInt(100000, 1000000));
    await Otp.create({ email, otp, purpose });
    await sendOtpEmail(email, otp, purpose);
    res.json({ message: 'OTP sent to your email' });
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
