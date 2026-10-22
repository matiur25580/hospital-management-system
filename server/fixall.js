require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const creds = [
  ['admin@hospital.com', 'Admin@123'],
  ['doctor@hospital.com', 'Doctor@123'],
  ['nurse@hospital.com', 'Nurse@123'],
  ['receptionist@hospital.com', 'Receptionist@123'],
  ['patient@hospital.com', 'Patient@123'],
];
mongoose.connect(process.env.MONGO_URI).then(async () => {
  for (const [email, pw] of creds) {
    const u = await User.findOne({ email });
    if (!u) { console.log('NOT FOUND:', email); continue; }
    u.password = pw;
    await u.save();
    const ok = await u.compare(pw);
    console.log((ok ? 'OK  ' : 'FAIL') + ' ' + email);
  }
  await mongoose.disconnect();
}).catch(e => console.log('ERR:', e.message));
