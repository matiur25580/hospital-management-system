const STAFF_ROLES = new Set(['Doctor', 'Nurse', 'Receptionist']);
function isStaff(user) { return Boolean(user && STAFF_ROLES.has(user.role) && user.email); }
function canManageHR(user) { return Boolean(user && user.role === 'Admin'); }
function canManageOT(user) { return Boolean(user && user.role === 'Admin'); }
function actorEmail(user) { return String(user && user.email || '').trim().toLowerCase(); }
module.exports = { isStaff, canManageHR, canManageOT, actorEmail };
