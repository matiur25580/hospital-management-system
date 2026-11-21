const CLINICAL_ROLES = new Set(['Admin', 'Doctor', 'Nurse', 'Receptionist']);
const LAB_PROCESS_ROLES = new Set(['Admin', 'Nurse', 'Receptionist']);

function canReadLabOrders(user) {
  return Boolean(user && (user.role === 'Patient' || CLINICAL_ROLES.has(user.role)));
}

function canManageLabCatalog(user) {
  return Boolean(user && user.role === 'Admin');
}

function canCreateLabOrder(user) {
  return Boolean(user && ['Admin', 'Doctor'].includes(user.role));
}

function canProcessLabOrder(user) {
  return Boolean(user && LAB_PROCESS_ROLES.has(user.role));
}

module.exports = { canReadLabOrders, canManageLabCatalog, canCreateLabOrder, canProcessLabOrder };
