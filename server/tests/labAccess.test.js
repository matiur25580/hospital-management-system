const {
  canReadLabOrders,
  canManageLabCatalog,
  canCreateLabOrder,
  canProcessLabOrder,
} = require('../utils/labAccess');

test('only clinical roles can read lab orders', () => {
  for (const role of ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient']) {
    expect(canReadLabOrders({ role })).toBe(true);
  }
  for (const role of ['Billing', 'Pharmacist', 'Guest']) {
    expect(canReadLabOrders({ role })).toBe(false);
  }
  expect(canReadLabOrders(null)).toBe(false);
});

test('only administrators can manage the lab catalogue', () => {
  expect(canManageLabCatalog({ role: 'Admin' })).toBe(true);
  for (const role of ['Doctor', 'Nurse', 'Receptionist', 'Patient']) {
    expect(canManageLabCatalog({ role })).toBe(false);
  }
});

test('only administrators and doctors can create lab orders', () => {
  expect(canCreateLabOrder({ role: 'Admin' })).toBe(true);
  expect(canCreateLabOrder({ role: 'Doctor' })).toBe(true);
  for (const role of ['Nurse', 'Receptionist', 'Patient']) {
    expect(canCreateLabOrder({ role })).toBe(false);
  }
});

test('only administrators, nurses and receptionists can process lab orders', () => {
  for (const role of ['Admin', 'Nurse', 'Receptionist']) {
    expect(canProcessLabOrder({ role })).toBe(true);
  }
  for (const role of ['Doctor', 'Patient', 'Billing']) {
    expect(canProcessLabOrder({ role })).toBe(false);
  }
});
