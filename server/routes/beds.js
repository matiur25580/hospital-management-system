const express = require('express');
const Bed = require('../models/Bed');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, async (req,res)=>{
  const beds = await Bed.find().populate('patient');
  res.json(beds);
});
router.post('/', protect, authorize('Admin'), async (req,res)=>{
  const bed = await Bed.create(req.body);
  res.status(201).json(bed);
});
router.patch('/:id/assign', protect, async (req,res)=>{
  const bed = await Bed.findByIdAndUpdate(req.params.id, {patient: req.body.patientId, status:'occupied'}, {new:true});
  res.json(bed);
});

router.patch('/:id/discharge', protect, async (req,res)=>{
  try{
    const bed = await Bed.findByIdAndUpdate(req.params.id, {patient: null, status:'available'}, {new:true});
    res.json(bed);
  }catch(e){ res.status(500).json({message:e.message}); }
});
module.exports = router;
