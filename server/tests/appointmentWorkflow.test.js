const { allowedAppointmentTransitions } = require('../utils/appointmentWorkflow');

test('appointment transitions are role-aware and terminal states cannot reopen', () => {
  expect(allowedAppointmentTransitions('Admin', 'booked')).toEqual(['in-queue', 'completed', 'cancelled']);
  expect(allowedAppointmentTransitions('Doctor', 'booked')).toEqual(['in-queue', 'cancelled']);
  expect(allowedAppointmentTransitions('Doctor', 'consulting')).toContain('completed');
  expect(allowedAppointmentTransitions('Admin', 'completed')).toEqual([]);
  expect(allowedAppointmentTransitions('Admin', 'cancelled')).toEqual([]);
  expect(allowedAppointmentTransitions('Doctor', 'unknown')).toEqual([]);
});
