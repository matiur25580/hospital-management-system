const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET env variable is required');

exports.protect = async (req, res, next) => {
  const match = (req.headers.authorization || '').match(/^Bearer\\s+(.+)$/i);
  if (!match) return res.status(401).json({ message: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(match[1], JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return next(error);
  }

  if (!payload || !payload.id) return res.status(401).json({ message: 'Invalid session' });
  try {
    // Role and account state come from the current database record, never stale JWT claims.
    const user = await User.findById(payload.id).select('_id name email role uniqueId');
    if (!user) return res.status(401).json({ message: 'Account is no longer available' });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied: insufficient role' });
  next();
};
