const mongoose = require('mongoose');
require('dotenv').config({ path: '/data/data/com.termux/files/home/hospital-management-system/server/.env' });
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const u = await mongoose.connection.db.collection('users').findOne(
      { email: 'rahamannatur397@gmail.com' },
      { projection: { email: 1, role: 1, fullName: 1, uniqueId: 1, isVerified: 1, otpVerified: 1 } }
    );
    if (u === null) {
      console.log('RESULT: NOT_REGISTERED - ei email diye kono account nei');
    } else {
      console.log('RESULT: REGISTERED');
      console.log('  email:', u.email);
      console.log('  role:', u.role);
      console.log('  name:', u.fullName);
      console.log('  uniqueId:', u.uniqueId);
      console.log('  verified:', (u.isVerified !== undefined) ? u.isVerified : 'field nei');
    }
  } catch(e) { console.log('DB error:', e.message); }
  await mongoose.disconnect();
})();
