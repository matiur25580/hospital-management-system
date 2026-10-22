const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: (process.env.EMAIL_USER||'').trim(), pass: (process.env.EMAIL_PASS||'').replace(/\s+/g,'') }
});
async function sendOtpEmail(to, otp, purpose) {
  const subject = purpose === 'register' ? 'Hospital Management - Registration OTP' : 'Hospital Management - Password Reset OTP';
  await transporter.sendMail({
    from: (process.env.EMAIL_USER||'').trim(), to, subject,
    html: '<div style="font-family:sans-serif;max-width:400px"><h2>' + subject + '</h2><p>Your 6-digit OTP:</p><h1 style="letter-spacing:10px">' + otp + '</h1><p style="color:#888">Valid for 3 minutes. Do not share.</p></div>'
  });
}
module.exports = { sendOtpEmail };
