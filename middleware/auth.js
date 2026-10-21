const jwt = require('jsonwebtoken');
const protect = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch (e) { return res.status(401).json({ success: false, message: 'Invalid or expired token' }); }
};
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied for your role' });
  next();
};
module.exports = { protect, authorize };
