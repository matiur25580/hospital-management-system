const CLINICAL_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
const clinicalRoles = [...CLINICAL_ROLES];

function canReadPatientList(user) {
  return Boolean(user && (user.role === 'Patient' || CLINICAL_ROLES.has(user.role)));
}

function canReadPatient(user, patient) {
  if (!user || !patient) return false;
  if (user.role === 'Patient') return String(patient.userId || '') === String(user.id || '');
  return CLINICAL_ROLES.has(user.role);
}

module.exports = { canReadPatientList, canReadPatient, clinicalRoles };
