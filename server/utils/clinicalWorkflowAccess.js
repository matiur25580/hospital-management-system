const STAFF_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
const CLINICAL_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);

function normalizedEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function userEmail(user) {
  return normalizedEmail(user && user.email);
}

function isStaff(user) {
  return Boolean(user && STAFF_ROLES.has(user.role) && userEmail(user));
}

function canManageAttendance(user) {
  return Boolean(user && user.role === 'Admin');
}

function attendanceScope(user, requestedEmail) {
  if (!isStaff(user)) return null;
  const ownEmail = userEmail(user);
  if (!requestedEmail || normalizedEmail(requestedEmail) === ownEmail) return { staffEmail: ownEmail };
  return canManageAttendance(user) ? { staffEmail: normalizedEmail(requestedEmail) } : null;
}

function teleconsultScope(user) {
  if (!user || !userEmail(user)) return null;
  if (user.role === 'Patient') return { patientEmail: userEmail(user) };
  if (user.role === 'Doctor') return { doctorEmail: userEmail(user) };
  if (user.role === 'Admin') return {};
  return null;
}

function canManageTeleconsult(user, record) {
  return Boolean(user && record && (
    user.role === 'Admin' ||
    (user.role === 'Doctor' && userEmail(user) === normalizedEmail(record.doctorEmail))
  ));
}

module.exports = {
  STAFF_ROLES,
  CLINICAL_ROLES,
  normalizedEmail,
  userEmail,
  isStaff,
  canManageAttendance,
  attendanceScope,
  teleconsultScope,
  canManageTeleconsult
};
