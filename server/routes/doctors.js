const express=require('express');
const User=require('../models/User');
const {protect}=require('../middleware/auth');
const router=express.Router();
router.get('/',protect,async(req,res)=>{
 try{const docs=await User.find({role:{$regex:/^doctor$/i}}).select('-password');
 res.json(docs);}catch(e){res.status(500).json({message:e.message});}
});
module.exports=router;
