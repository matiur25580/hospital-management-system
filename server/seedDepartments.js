const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const { departments } = require('./seed/hospitalMaster');
const Department = require('./models/Department');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await Department.countDocuments();
    if (existing > 0) {
      console.log('Already ' + existing + ' departments in DB - skipping seed');
    } else {
      const docs = departments.map(d => ({
        code: d.code, name: d.name, floor: d.floor,
        opdRooms: d.opdRooms, hod: d.hod, doctors: d.doctors,
        nurseCount: d.nurses, // seed uses 'nurses', model uses 'nurseCount'
        opdDays: d.opdDays, sessions: d.sessions,
        scheduleNote: d.scheduleNote, description: d.description,
      }));
      await Department.insertMany(docs);
      console.log('Seeded ' + docs.length + ' departments');
    }
  } catch (e) { console.log('Seed error:', e.message); }
  await mongoose.disconnect();
})();
