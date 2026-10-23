// Fire-and-forget email helper. Never throws, never blocks the request.
const nodemailer = require('nodemailer');

function getTransporter() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

async function sendMail(to, subject, html) {
  try {
    const t = getTransporter();
    if (!t || !to) return;
    await t.sendMail({ from: (process.env.EMAIL_USER || '').trim(), to, subject, html });
    console.log('mail sent ->', to, '|', subject);
  } catch (e) {
    console.error('mail failed:', e.message);
  }
}

module.exports = { sendMail };
