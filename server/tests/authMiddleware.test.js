process.env.JWT_SECRET = 'unit-test-secret-with-sufficient-entropy';

jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn() }));

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

function response() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

afterEach(() => jest.clearAllMocks());

test('uses the current database role instead of the role embedded in the JWT', async () => {
  jwt.verify.mockReturnValue({ id: 'user-1', role: 'Admin', email: 'old@example.com' });
  const databaseUser = { id: 'user-1', role: 'Patient', email: 'current@example.com' };
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(databaseUser) });
  const req = { headers: { authorization: 'Bearer valid-token' } };
  const res = response();
  const next = jest.fn();

  await protect(req, res, next);

  expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET, { algorithms: ['HS256'] });
  expect(User.findById).toHaveBeenCalledWith('user-1');
  expect(req.user).toBe(databaseUser);
  expect(req.user.role).toBe('Patient');
  expect(next).toHaveBeenCalledTimes(1);
});

test('rejects tokens for accounts that no longer exist', async () => {
  jwt.verify.mockReturnValue({ id: 'deleted-user', role: 'Admin' });
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  const req = { headers: { authorization: 'Bearer valid-token' } };
  const res = response();
  const next = jest.fn();

  await protect(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});

test('rejects invalid tokens and does not query the user collection', async () => {
  const error = new Error('bad token');
  error.name = 'JsonWebTokenError';
  jwt.verify.mockImplementation(() => { throw error; });
  const req = { headers: { authorization: 'Bearer invalid-token' } };
  const res = response();
  const next = jest.fn();

  await protect(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(User.findById).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
});
