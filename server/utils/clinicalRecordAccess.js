const CLINICAL_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
const BILLING_ROLES = new Set(['Admin', 'Receptionist']);
const CASE_MANAGEMENT_ROLES = new Set(['Admin', 'Doctor', 'Nurse']);
const DISCHARGE_ROLES = new Set(['Admin', 'Doctor']);
function patientEmailFor(user) { return user && user.role === 'Patient' ? String(user.email || '').trim().toLowerCase() : null; }
function canReadClinicalRecords(user) { return Boolean(user && (CLINICAL_ROLES.has(user.role) || user.role === 'Patient')); }
function canManageCases(user) { return Boolean(user && CASE_MANAGEMENT_ROLES.has(user.role)); }
function canManageBilling(user) { return Boolean(user && BILLING_ROLES.has(user.role)); }
function canManageDischarge(user) { return Boolean(user && DISCHARGE_ROLES.has(user.role)); }
module.exports = { CLINICAL_ROLES, BILLING_ROLES, CASE_MANAGEMENT_ROLES, DISCHARGE_ROLES, patientEmailFor, canReadClinicalRecords, canManageCases, canManageBilling, canManageDischarge };
