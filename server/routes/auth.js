const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const r = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET env variable is required');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

// POST /api/auth/register
r.post('/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').optional().equals('Patient'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { name, email, password, role } = req.body;
      if (await User.findOne({ email }))
        return res.status(409).json({ message: 'Email already registered' });
      const { otp } = req.body;
      const rec = await Otp.findOne({ email, password: 0, purpose: 'register' }).sort({ createdAt: -1 }).catch(()=>null);
      const rec2 = rec || await Otp.findOne({ email, purpose: 'register' }).sort({ createdAt: -1 });
      // Never write OTP values or verification secrets to application logs.
      const recF = rec2;
      if (!recF || String(recF.otp).trim() !== String(otp || '').trim())
        return res.status(400).json({ message: 'OTP verification failed' });
      await Otp.deleteMany({ email, purpose: 'register' });
      const user = await User.create({ name, email, password, role });
      res.status(201).json({
        token: signToken(user),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (e) { next(e); }
  }
);

// POST /api/auth/login
r.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.compare(password)))
        return res.status(401).json({ message: 'Invalid email or password' });
      res.json({
        token: signToken(user),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (e) { next(e); }
  }
);

module.exports = r;
