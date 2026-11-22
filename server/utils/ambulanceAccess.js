function canOperateAmbulance(user) {
  return Boolean(user && ['Admin', 'Receptionist'].includes(user.role));
}
function canAdministerFleet(user) {
  return Boolean(user && user.role === 'Admin');
}
function allowedTripTransitions(status) {
  const transitions = {
    dispatched: ['en-route', 'cancelled'],
    'en-route': ['on-scene', 'cancelled'],
    'on-scene': ['to-hospital', 'cancelled'],
    'to-hospital': ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  return transitions[status] || [];
}
module.exports = { canOperateAmbulance, canAdministerFleet, allowedTripTransitions };
