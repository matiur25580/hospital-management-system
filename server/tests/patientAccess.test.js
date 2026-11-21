const { canReadPatientList, canReadPatient } = require('../utils/patientAccess');

const ownPatient = { userId: 'patient-user-1' };
const otherPatient = { userId: 'patient-user-2' };

test('patients can list only their own linked records', () => {
  expect(canReadPatientList({ id: 'patient-user-1', role: 'Patient' })).toBe(true);
  expect(canReadPatient({ id: 'patient-user-1', role: 'Patient' }, ownPatient)).toBe(true);
  expect(canReadPatient({ id: 'patient-user-1', role: 'Patient' }, otherPatient)).toBe(false);
});

test('clinical roles can access the clinical patient directory', () => {
  for (const role of ['Admin', 'Doctor', 'Nurse', 'Receptionist']) {
    const user = { id: 'staff-1', role };
    expect(canReadPatientList(user)).toBe(true);
    expect(canReadPatient(user, otherPatient)).toBe(true);
  }
});

test('unrecognized roles and missing users are denied', () => {
  expect(canReadPatientList(null)).toBe(false);
  expect(canReadPatientList({ id: 'x', role: 'Billing' })).toBe(false);
  expect(canReadPatient({ id: 'x', role: 'Billing' }, ownPatient)).toBe(false);
  expect(canReadPatient({ id: 'x', role: 'Patient' }, null)).toBe(false);
});
