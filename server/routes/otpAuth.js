const r = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/mailer');
const signToken = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// LOGIN (email-exists message soho)
r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "This email doesn't exist, plz register first" });
    const ok = await user.compare(password);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });
    res.json({ message: 'Login successful', token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

// SEND OTP
r.post('/send-otp', async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
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
    const { name, mobile, email, dob, password, otp } = req.body;
    if (!name || !mobile || !email || !dob || !password || !otp)
      return res.status(400).json({ message: 'All fields are mandatory' });
    const rec = await Otp.findOne({ email, purpose: 'register' }).sort({ createdAt: -1 });
    if (!rec || rec.otp !== String(otp))
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'This email already registered, plz login' });
    const user = await User.create({ name, mobile, email, dob, password, role: 'Patient' });
    await Otp.deleteMany({ email, purpose: 'register' });
    res.status(201).json({ message: 'Registration successful', token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role } });
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
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "This email doesn't exist, plz register first" });
    user.password = newPassword;
    await user.save();
    await Otp.deleteMany({ email, purpose: 'reset' });
    res.json({ message: 'Password changed successfully' });
  } catch (e) { next(e); }
});

module.exports = r;
