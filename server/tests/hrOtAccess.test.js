const { isStaff, canManageHR, canManageOT, actorEmail } = require('../utils/hrOtAccess');

test('only recognized staff roles can access their own HR records', () => {
  for (const role of ['Doctor', 'Nurse', 'Receptionist']) expect(isStaff({ role, email: 'staff@example.com' })).toBe(true);
  expect(isStaff({ role: 'Patient', email: 'patient@example.com' })).toBe(false);
  expect(isStaff({ role: 'Admin', email: 'admin@example.com' })).toBe(false);
  expect(isStaff({ role: 'Doctor' })).toBe(false);
});

test('HR and OT management actions are restricted to administrators', () => {
  expect(canManageHR({ role: 'Admin' })).toBe(true);
  expect(canManageOT({ role: 'Admin' })).toBe(true);
  for (const role of ['Doctor', 'Nurse', 'Receptionist', 'Patient']) {
    expect(canManageHR({ role })).toBe(false);
    expect(canManageOT({ role })).toBe(false);
  }
});

test('actor attribution uses normalized authenticated email', () => {
  expect(actorEmail({ email: ' HR@Example.com ' })).toBe('hr@example.com');
  expect(actorEmail(null)).toBe('');
});
