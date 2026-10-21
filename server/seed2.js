const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');
(async()=>{
  await mongoose.connect(process.env.MONGO_URI);
  const pw = await bcrypt.hash('doctor123', 10);
  await User.findOneAndUpdate({email:'doctor@hospital.com'},{name:'Dr. Arif Khan',email:'doctor@hospital.com',password:pw,role:'doctor',phone:'9876543210'},{upsert:true});
  const pw2 = await bcrypt.hash('recep123', 10);
  await User.findOneAndUpdate({email:'receptionist@hospital.com'},{name:'Sneha Das',email:'receptionist@hospital.com',password:pw2,role:'receptionist',phone:'9876543211'},{upsert:true});
  console.log('Doctor + Receptionist seeded OK');
  process.exit(0);
})();
