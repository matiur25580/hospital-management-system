const p = require('../utils/clinicalRecordAccess');
test('patient identity is derived only from authenticated account', () => {
 expect(p.patientEmailFor({ role: 'Patient', email: ' PATIENT@example.com '})).toBe('patient@example.com');
 expect(p.patientEmailFor({ role: 'Doctor', email: 'doctor@example.com' })).toBeNull();
});
test('clinical, billing and discharge permissions are separated', () => {
 expect(p.canReadClinicalRecords({ role: 'Patient' })).toBe(true);
 expect(p.canReadClinicalRecords({ role: 'Billing' })).toBe(false);
 expect(p.canManageCases({ role: 'Doctor' })).toBe(true);
 expect(p.canManageCases({ role: 'Receptionist' })).toBe(false);
 expect(p.canManageBilling({ role: 'Receptionist' })).toBe(true);
 expect(p.canManageBilling({ role: 'Nurse' })).toBe(false);
 expect(p.canManageDischarge({ role: 'Doctor' })).toBe(true);
 expect(p.canManageDischarge({ role: 'Nurse' })).toBe(false);
});
