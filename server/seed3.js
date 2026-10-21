const mongoose = require('mongoose');
require('dotenv').config();
const Patient = require('./models/Patient');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
(async()=>{
  await mongoose.connect(process.env.MONGO_URI);
  await Patient.deleteMany({}); await Appointment.deleteMany({});
  const doc = await User.findOne({email:'doctor@hospital.com'});
  const pats = await Patient.insertMany([
    {patientId:'PAT-001',name:'Karim Sheikh',age:45,gender:'male',phone:'9000000001',address:'Kolkata',bloodGroup:'B+'},
    {patientId:'PAT-002',name:'Mina Begum',age:32,gender:'female',phone:'9000000002',address:'Howrah',bloodGroup:'O+'},
    {patientId:'PAT-003',name:'Amit Das',age:28,gender:'male',phone:'9000000003',address:'Salt Lake',bloodGroup:'A+'},
    {patientId:'PAT-004',name:'Rina Paul',age:55,gender:'female',phone:'9000000004',address:'Newtown',bloodGroup:'AB+'}
  ]);
  await Appointment.insertMany([
    {tokenNo:1,patient:pats[0]._id,doctor:doc._id,date:new Date(),timeSlot:'10:00 AM',status:'booked',symptoms:'Fever'},
    {tokenNo:2,patient:pats[1]._id,doctor:doc._id,date:new Date(),timeSlot:'11:00 AM',status:'booked',symptoms:'Headache'},
    {tokenNo:3,patient:pats[2]._id,doctor:doc._id,date:new Date(),timeSlot:'12:00 PM',status:'completed',symptoms:'Cough'}
  ]);
  console.log('Sample data OK: 4 patients, 3 appointments');
  process.exit(0);
})();
