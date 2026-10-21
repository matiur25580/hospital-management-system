const express = require('express');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, async (req,res)=>{
  try{
    const count = await Patient.countDocuments();
    const patientId = 'P' + String(count+1).padStart(5,'0');
    const patient = await Patient.create({...req.body, patientId});
    res.status(201).json(patient);
  }catch(e){ res.status(500).json({message:e.message}); }
});
router.get('/', protect, async (req,res)=>{
  const patients = await Patient.find().sort({createdAt:-1});
  res.json(patients);
});
module.exports = router;
