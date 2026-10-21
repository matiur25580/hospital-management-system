const express = require('express');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, async (req,res)=>{
  try{
    const { doctor, date } = req.body;
    const count = await Appointment.countDocuments({doctor, date: new Date(date)});
    const appt = await Appointment.create({...req.body, tokenNo: count+1});
    req.app = req.app || {};
    res.status(201).json(appt);
  }catch(e){ res.status(500).json({message:e.message}); }
});
router.get('/doctor/:doctorId', protect, async (req,res)=>{
  const list = await Appointment.find({doctor: req.params.doctorId}).populate('patient').sort({tokenNo:1});
  res.json(list);
});
router.patch('/:id/status', protect, async (req,res)=>{
  const updated = await Appointment.findByIdAndUpdate(req.params.id, {status: req.body.status}, {new:true});
  res.json(updated);
});

router.get('/', protect, async (req,res)=>{
  try{
    const list = await Appointment.find().populate('patient').populate('doctor').sort({date:-1});
    res.json(list);
  }catch(e){ res.status(500).json({message:e.message}); }
});
module.exports = router;
