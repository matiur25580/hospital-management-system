const r = require('express').Router();
const { protect } = require('../middleware/auth');
const PatientCase = require('../models/PatientCase');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');
const { sendMail } = require('../utils/notify');
const { generateCasePdf, generateBillPdf, generateDischargePdf } = require('../utils/casePdf');
const { patientEmailFor, canReadClinicalRecords, canManageCases } = require('../utils/clinicalRecordAccess');
r.get('/', protect, async (req, res) => {
 if (!canReadClinicalRecords(req.user)) return res.status(403).json({message:'Access denied.'});
 try { const own=patientEmailFor(req.user), requested=String(req.query.patientEmail||'').trim().toLowerCase(); const filter=own?{patientEmail:own}:(requested?{patientEmail:requested}:{}); res.json(await PatientCase.find(filter).sort({submittedAt:-1}).limit(100)); }
 catch(e){res.status(500).json({message:'Could not load cases.'});}
});
r.post('/', protect, async(req,res)=>{try{
 const own=patientEmailFor(req.user); if(!own&&!canManageCases(req.user)) return res.status(403).json({message:'Access denied.'});
 const patientEmail=own||String(req.body.patientEmail||'').trim().toLowerCase(); const patient=await Patient.findOne({email:patientEmail}).select('email'); if(!patient)return res.status(404).json({message:'Patient profile not found.'});
 const fields=['patientName','age','gender','phone','address','disease','symptoms','duration','medicalHistory','allergies']; const data={patientEmail}; for(const field of fields)if(req.body[field]!==undefined)data[field]=req.body[field]; if(own)data.patientName=req.user.name;
 const c=await PatientCase.create(data); c.pdfUrl=await generateCasePdf(c); await c.save(); res.status(201).json(c);
 }catch(e){res.status(400).json({message:'Could not create case.'});}});
r.patch('/:id/notes',protect,async(req,res)=>{if(!canManageCases(req.user))return res.status(403).json({message:'Only clinical staff can add case notes.'});try{
 const c=await PatientCase.findById(req.params.id);if(!c)return res.status(404).json({message:'Case not found'});const text=String(req.body.text||'').trim();if(!text||text.length>4000)return res.status(400).json({message:'A valid note is required.'});
 c.notes.push({author:req.user.name||req.user.email,role:req.user.role,text});c.pdfUrl=await generateCasePdf(c);await c.save();res.json(c);
 }catch(e){res.status(400).json({message:'Could not update case notes.'});}});
r.patch('/:id/status',protect,async(req,res)=>{if(!canManageCases(req.user))return res.status(403).json({message:'Only clinical staff can change case status.'});try{
 const c=await PatientCase.findById(req.params.id);if(!c)return res.status(404).json({message:'Case not found'});const {status}=req.body;if(!['new','under-treatment','discharged'].includes(status))return res.status(400).json({message:'Invalid status'});if(status==='discharged'&&c.status==='discharged')return res.status(409).json({message:'Case is already discharged.'});c.status=status;
 if(status==='discharged'){const items=Array.isArray(req.body.billItems)?req.body.billItems:[];if(items.length>100||items.some(i=>!i||typeof i.description!=='string'||!Number.isFinite(Number(i.amount))||Number(i.amount)<0))return res.status(400).json({message:'Invalid bill items.'});const fee=req.body.doctorFee===undefined?0:Number(req.body.doctorFee);if(!Number.isFinite(fee)||fee<0)return res.status(400).json({message:'Invalid doctor fee.'});c.billItems=items.map(i=>({description:i.description.slice(0,250),amount:Number(i.amount)}));c.doctorFee=fee;c.dischargedAt=new Date();c.billPdfUrl=await generateBillPdf(c);c.dischargePdfUrl=await generateDischargePdf(c);const total=c.billItems.reduce((s,i)=>s+i.amount,0)+fee;await Payment.findOneAndUpdate({caseId:c._id},{$setOnInsert:{patientName:c.patientName,patientEmail:c.patientEmail,totalAmount:total,paidAmount:0,payments:[],status:'unpaid'}},{upsert:true,runValidators:true});try{await sendMail(c.patientEmail,'You have been discharged','<p>Your discharge and bill documents are available in the patient portal.</p>');}catch(mailError){console.error('discharge mail failed:',mailError.message);}}
 c.pdfUrl=await generateCasePdf(c);await c.save();res.json(c);
 }catch(e){res.status(400).json({message:'Could not update case status.'});}});
module.exports=r;
