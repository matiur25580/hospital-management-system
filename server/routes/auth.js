const express=require('express');
const jwt=require('jsonwebtoken');
const User=require('../models/User');
const r=express.Router();
r.post('/login',async(req,res)=>{
  const {email,password}=req.body;
  const u=await User.findOne({email});
  if(!u||!(await u.compare(password))) return res.status(401).json({message:'Invalid credentials'});
  const token=jwt.sign({id:u._id,role:u.role},process.env.JWT_SECRET||'secret',{expiresIn:'1d'});
  res.json({token,user:{name:u.name,email:u.email,role:u.role}});
});
r.post('/seed-admin',async(req,res)=>{
  let u=await User.findOne({email:'admin@hospital.com'});
  if(!u) u=await User.create({name:'Admin',email:'admin@hospital.com',password:'admin123',role:'Admin'});
  res.json({email:'admin@hospital.com',password:'admin123'});
});
module.exports=r;
