const { validationResult } = require('express-validator');
// Converts express-validator results into one consistent 400 response before a request reaches its handler.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  next();
};
module.exports = validate;
