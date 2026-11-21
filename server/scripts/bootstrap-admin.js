require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const mongoUri = process.env.MONGO_URI;
  const email = typeof process.env.BOOTSTRAP_ADMIN_EMAIL === 'string'
    ? process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase()
    : '';
  const name = typeof process.env.BOOTSTRAP_ADMIN_NAME === 'string'
    ? process.env.BOOTSTRAP_ADMIN_NAME.trim()
    : '';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!mongoUri || !email || !name || typeof password !== 'string' || password.length < 16 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set MONGO_URI, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME and a 16-72 byte BOOTSTRAP_ADMIN_PASSWORD.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address.');
  }

  await mongoose.connect(mongoUri);
  if (await User.exists({ role: 'Admin' })) {
    throw new Error('An administrator already exists. Bootstrap is disabled after the first admin is created.');
  }
  if (await User.exists({ email })) {
    throw new Error('An account with BOOTSTRAP_ADMIN_EMAIL already exists.');
  }

  const uniqueId = 'ADM' + crypto.randomBytes(6).toString('hex').toUpperCase();
  await User.create({ name, email, password, role: 'Admin', uniqueId });
  console.log('Initial administrator created. Remove BOOTSTRAP_ADMIN_* values from the environment now.');
}

main()
  .catch((error) => {
    console.error('Administrator bootstrap failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
