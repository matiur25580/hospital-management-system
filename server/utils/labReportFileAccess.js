const CLINICAL_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
function canReadLabReportFile(user, report) {
  if (!user || !report) return false;
  if (user.role === 'Patient') return String(report.patientEmail || '').toLowerCase() === String(user.email || '').toLowerCase();
  return CLINICAL_ROLES.has(user.role);
}
module.exports = { canReadLabReportFile };
