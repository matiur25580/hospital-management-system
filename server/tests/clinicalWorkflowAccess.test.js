const access = require('../utils/clinicalWorkflowAccess');

test('staff attendance reads are self-scoped and administrators can read all or one staff member', () => {
  expect(access.attendanceScope({ role: 'Doctor', email: ' DOC@example.com ' })).toEqual({ staffEmail: 'doc@example.com' });
  expect(access.attendanceScope({ role: 'Nurse', email: 'n@example.com' }, 'other@example.com')).toBeNull();
  expect(access.attendanceScope({ role: 'Admin', email: 'admin@example.com' })).toEqual({});
  expect(access.attendanceScope({ role: 'Admin', email: 'admin@example.com' }, 'other@example.com')).toEqual({ staffEmail: 'other@example.com' });
  expect(access.attendanceScope({ role: 'Patient', email: 'p@example.com' })).toBeNull();
});

test('teleconsult reads are scoped to patient or assigned doctor', () => {
  expect(access.teleconsultScope({ role: 'Patient', email: 'P@example.com' })).toEqual({ patientEmail: 'p@example.com' });
  expect(access.teleconsultScope({ role: 'Doctor', email: 'D@example.com' })).toEqual({ doctorEmail: 'd@example.com' });
  expect(access.teleconsultScope({ role: 'Admin', email: 'a@example.com' })).toEqual({});
  expect(access.teleconsultScope({ role: 'Nurse', email: 'n@example.com' })).toBeNull();
});

test('only the assigned doctor or administrator can manage a consultation', () => {
  const record = { doctorEmail: 'doctor@example.com' };
  expect(access.canManageTeleconsult({ role: 'Doctor', email: 'DOCTOR@example.com' }, record)).toBe(true);
  expect(access.canManageTeleconsult({ role: 'Doctor', email: 'other@example.com' }, record)).toBe(false);
  expect(access.canManageTeleconsult({ role: 'Admin', email: 'admin@example.com' }, record)).toBe(true);
  expect(access.canManageTeleconsult({ role: 'Patient', email: 'patient@example.com' }, record)).toBe(false);
});
