const { canOperateAmbulance, canAdministerFleet, allowedTripTransitions } = require('../utils/ambulanceAccess');

test('only Admin and Receptionist can operate ambulance dispatch', () => {
  expect(canOperateAmbulance({ role: 'Admin' })).toBe(true);
  expect(canOperateAmbulance({ role: 'Receptionist' })).toBe(true);
  expect(canOperateAmbulance({ role: 'Doctor' })).toBe(false);
  expect(canOperateAmbulance({ role: 'Patient' })).toBe(false);
});

test('only Admin can manage the fleet', () => {
  expect(canAdministerFleet({ role: 'Admin' })).toBe(true);
  expect(canAdministerFleet({ role: 'Receptionist' })).toBe(false);
});

test('trip transitions are sequential and terminal states cannot reopen', () => {
  expect(allowedTripTransitions('dispatched')).toEqual(['en-route', 'cancelled']);
  expect(allowedTripTransitions('en-route')).toEqual(['on-scene', 'cancelled']);
  expect(allowedTripTransitions('on-scene')).toEqual(['to-hospital', 'cancelled']);
  expect(allowedTripTransitions('to-hospital')).toEqual(['completed', 'cancelled']);
  expect(allowedTripTransitions('completed')).toEqual([]);
  expect(allowedTripTransitions('cancelled')).toEqual([]);
});
