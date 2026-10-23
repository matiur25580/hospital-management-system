require('dotenv').config();
const mongoose = require('mongoose');
const Ward = require('./models/Ward');
const Bed = require('./models/Bed');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (await Ward.countDocuments() === 0) {
    const wards = await Ward.insertMany([
      { name: 'General Ward A', type: 'General', floor: '1st' },
      { name: 'ICU', type: 'ICU', floor: '2nd' },
      { name: 'Emergency Ward', type: 'Emergency', floor: 'Ground' },
    ]);
    for (const w of wards) {
      const n = w.type === 'ICU' ? 6 : 10;
      const prefix = w.name.split(' ')[0][0];
      const beds = [];
      for (let i = 1; i <= n; i++) beds.push({ bedNumber: prefix + '-' + String(i).padStart(2, '0'), ward: w._id });
      await Bed.insertMany(beds);
    }
    console.log('seeded 3 wards + 26 beds ✓');
  } else console.log('wards already exist');
  await mongoose.disconnect();
})();
