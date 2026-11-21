const Patient = require('../models/Patient');

async function ensurePatientProfile(user, phone) {
  let patient = await Patient.findOne({ email: user.email });
  if (patient) {
    if (patient.userId && String(patient.userId) !== String(user._id)) {
      throw new Error('A different patient account is already linked to this profile.');
    }
    patient.userId = user._id;
    if (!patient.phone && phone) patient.phone = phone;
    await patient.save();
    return patient;
  }

  return Patient.create({
    userId: user._id,
    patientId: `PAT-${String(user._id).toUpperCase()}`,
    name: user.name,
    email: user.email,
    phone,
  });
}

module.exports = { ensurePatientProfile };
