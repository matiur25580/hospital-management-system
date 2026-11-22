function allowedAppointmentTransitions(role, status) {
  const admin = {
    booked: ['in-queue', 'completed', 'cancelled'],
    'in-queue': ['consulting', 'completed', 'cancelled'],
    consulting: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  const clinician = {
    booked: ['in-queue', 'cancelled'],
    'in-queue': ['consulting', 'cancelled'],
    consulting: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  const map = role === 'Admin' ? admin : clinician;
  return map[status] || [];
}
module.exports = { allowedAppointmentTransitions };
