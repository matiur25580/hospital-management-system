const { canReadLabReportFile } = require('../utils/labReportFileAccess');

test('patients can access only their own lab report attachments', () => {
  const report = { patientEmail: 'patient@example.com' };
  expect(canReadLabReportFile({ role: 'Patient', email: 'patient@example.com' }, report)).toBe(true);
  expect(canReadLabReportFile({ role: 'Patient', email: 'other@example.com' }, report)).toBe(false);
});

test('clinical roles can access lab report attachments', () => {
  for (const role of ['Admin', 'Doctor', 'Nurse', 'Receptionist']) {
    expect(canReadLabReportFile({ role }, { patientEmail: 'patient@example.com' })).toBe(true);
  }
});

test('unrecognized roles and missing records are denied', () => {
  expect(canReadLabReportFile({ role: 'Billing' }, { patientEmail: 'patient@example.com' })).toBe(false);
  expect(canReadLabReportFile({ role: 'Patient', email: 'patient@example.com' }, null)).toBe(false);
  expect(canReadLabReportFile(null, { patientEmail: 'patient@example.com' })).toBe(false);
});
