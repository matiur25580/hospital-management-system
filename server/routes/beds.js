const express = require('express');
const Bed = require('../models/Bed');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, async (req,res)=>{
  const beds = await Bed.find().populate('patient');
  res.json(beds);
});
router.post('/', protect, authorize('admin'), async (req,res)=>{
  const bed = await Bed.create(req.body);
  res.status(201).json(bed);
});
router.patch('/:id/assign', protect, async (req,res)=>{
  const bed = await Bed.findByIdAndUpdate(req.params.id, {patient: req.body.patientId, status:'occupied'}, {new:true});
  res.json(bed);
});
module.exports = router;
